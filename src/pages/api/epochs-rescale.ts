import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyMessage } from "viem";
import { isAdmin } from "@/lib/contractUtils";

type Action = "rescale" | "update";

interface PostBodyBase {
  address: string;
  message: string;
  signature: string;
  epochId: number;
}

interface RescaleBody extends PostBodyBase {
  action: "rescale";
  decimals: number; // multiply by 10 ** decimals
  dryRun?: boolean;
}

interface UpdateBody extends PostBodyBase {
  action: "update";
  name?: string;
  tokenAddress?: string;
  totalAllocation?: string; // string in smallest units
  claimDeadline?: string;   // unix ts string
  isActive?: boolean;
}

type PostBody = RescaleBody | UpdateBody;
// Allow delete via same endpoint
interface DeleteBody extends PostBodyBase {
  action: "delete";
  force?: boolean; // allow deleting even if active (use with caution)
}

async function verifyAdmin({ address, message, signature }: { address: string; message: string; signature: string; }): Promise<boolean> {
  try {
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!isValidSignature) return false;
    const hasAdminRole = await isAdmin(address);
    return !!hasAdminRole;
  } catch (err) {
    console.error("Admin verify failed", err);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Partial<PostBody>;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid body" });
  }

  const { address, message, signature, epochId } = body as PostBodyBase;
  if (!address || !message || !signature || !epochId) {
    return res.status(400).json({ error: "Missing required fields: address, message, signature, epochId" });
  }

  const ok = await verifyAdmin({ address, message, signature });
  if (!ok) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const epoch = await prisma.epoch.findUnique({ where: { id: Number(epochId) } });
  if (!epoch) {
    return res.status(404).json({ error: `Epoch ${epochId} not found` });
  }

  const action = body.action as Action | "delete";
  if (action === "rescale") {
    const decimals = Number((body as RescaleBody).decimals);
    const dryRun = !!(body as RescaleBody).dryRun;
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
      return res.status(400).json({ error: "Invalid decimals" });
    }
    const multiplier = BigInt(10) ** BigInt(decimals);

    const claims = await prisma.merkleUserClaims.findMany({ where: { epochId: Number(epochId) } });
    const newTotal = (BigInt(epoch.totalAllocation) * multiplier).toString();
    const preview = {
      epochId,
      decimals,
      multiplier: multiplier.toString(),
      totalAllocation: { old: epoch.totalAllocation, new: newTotal },
      sample: claims.slice(0, 5).map(c => ({ id: c.id, old: c.amount, next: (BigInt(c.amount) * multiplier).toString() })),
      count: claims.length,
      dryRun,
    };
    if (dryRun) return res.status(200).json({ preview });

    await prisma.$transaction(async (tx) => {
      await tx.epoch.update({ where: { id: Number(epochId) }, data: { totalAllocation: newTotal } });
      for (const c of claims) {
        await tx.merkleUserClaims.update({ where: { id: c.id }, data: { amount: (BigInt(c.amount) * multiplier).toString() } });
      }
    });
    return res.status(200).json({ message: `Rescaled epoch ${epochId}`, updatedClaims: claims.length });
  }

  if (action === "update") {
    const { name, tokenAddress, totalAllocation, claimDeadline, isActive } = body as UpdateBody;
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (tokenAddress !== undefined) data.tokenAddress = tokenAddress;
    if (totalAllocation !== undefined) data.totalAllocation = totalAllocation;
    if (claimDeadline !== undefined) data.claimDeadline = claimDeadline;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await prisma.epoch.update({ where: { id: Number(epochId) }, data });
    return res.status(200).json({ message: "Epoch updated", epoch: { id: updated.id, ...data } });
  }

  if (action === "delete") {
    const { force } = (body as unknown as DeleteBody);
    if (epoch.isActive && !force) {
      return res.status(400).json({ error: "Epoch is active. Set force=true to delete anyway." });
    }
    await prisma.$transaction(async (tx) => {
      await tx.merkleUserClaims.deleteMany({ where: { epochId: Number(epochId) } });
      await tx.epoch.delete({ where: { id: Number(epochId) } });
    });
    return res.status(200).json({ message: `Epoch ${epochId} and related claims deleted` });
  }

  return res.status(400).json({ error: "Invalid action" });
}


