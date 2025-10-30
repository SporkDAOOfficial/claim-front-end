import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { verifyMessage, getAddress } from "viem";
import { isAdmin } from "@/lib/contractUtils";
import { generateMerkleTree } from "./merkle-tree";

export const config = { api: { bodyParser: false } };

async function verifyAdmin(address: string, message: string, signature: string) {
  const ok = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  if (!ok) return false;
  const has = await isAdmin(address);
  return !!has;
}

async function saveClaimsChunked(epochId: number, merkleRoot: string, claims: Array<{ address: string; amount: string; proof: string[]; }>) {
  // Remove existing rows first to ensure clean replace
  await prisma.merkleUserClaims.deleteMany({ where: { epochId } });
  const CHUNK = 1000;
  for (let i = 0; i < claims.length; i += CHUNK) {
    const data = claims.slice(i, i + CHUNK).map(c => ({
      address: c.address,
      amount: c.amount,
      proof: JSON.stringify(c.proof),
      merkleRoot,
      epochId,
    }));
    await prisma.merkleUserClaims.createMany({ data, skipDuplicates: true });
  }
  return { inserted: claims.length };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const form = formidable({ uploadDir: "/tmp", keepExtensions: true });
    const [fields, files] = await form.parse(req);
    const epochId = Number(Array.isArray(fields.epochId) ? fields.epochId[0] : fields.epochId);
    const address = Array.isArray(fields.address) ? fields.address[0] : fields.address;
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message;
    const signature = Array.isArray(fields.signature) ? fields.signature[0] : fields.signature;
    const totalAllocation = Array.isArray(fields.totalAllocation) ? fields.totalAllocation[0] : fields.totalAllocation; // base units string

    if (!epochId || !address || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!(await verifyAdmin(address as string, message as string, signature as string))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const epoch = await prisma.epoch.findUnique({ where: { id: epochId } });
    if (!epoch) return res.status(404).json({ error: "Epoch not found" });
    if (epoch.isActive) return res.status(400).json({ error: "Cannot reupload for active epoch" });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });
    const csvContent = fs.readFileSync(file.filepath, "utf-8");

    // Local CSV parser (amounts in base units, address normalized)
    const claims = (() => {
      const lines = csvContent.trim().split("\n");
      const out: Array<{ address: string; amount: string; proof: string[] }> = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [addr, amt] = line.split(",");
        if (addr && amt) {
          try {
            const normalized = getAddress(addr.trim());
            out.push({ address: normalized, amount: amt.trim(), proof: [] });
          } catch {
            // skip invalid
          }
        }
      }
      return out;
    })();
    if (claims.length === 0) return res.status(400).json({ error: "No valid claims found in CSV" });

    const merkle = generateMerkleTree(claims);

    // Replace claims and update epoch
    const saved = await saveClaimsChunked(epochId, merkle.root, merkle.claims);
    const updated = await prisma.epoch.update({
      where: { id: epochId },
      data: {
        merkleRoot: merkle.root,
        totalAllocation: totalAllocation || epoch.totalAllocation,
      },
    });

    fs.unlinkSync(file.filepath);
    return res.status(200).json({ message: "Epoch CSV re-uploaded", epoch: { id: updated.id, merkleRoot: updated.merkleRoot, totalAllocation: updated.totalAllocation }, savedClaims: saved.inserted });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}




