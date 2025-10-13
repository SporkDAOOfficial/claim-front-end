import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "viem";

export interface ClaimData {
  address: string;
  amount: string; // Amount in wei (smallest unit)
  proof: string; // Individual proof hash for this claim
}

export interface MerkleTreeData {
  tree: MerkleTree;
  root: string;
  claims: ClaimData[];
}

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Generate proof hash for a single claim
 */
export function generateLeafHash(address: string, amount: string): string {
  // Contract uses: keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))))
  // We need to replicate this in JavaScript
  const encoded = keccak256(new TextEncoder().encode(address + amount));
  return keccak256(encoded);
}

/**
 * Generate a Merkle tree from claim data
 */
export function generateMerkleTree(claims: ClaimData[]): MerkleTreeData {
  if (claims.length === 0) {
    throw new Error("Cannot generate Merkle tree with empty claims");
  }

  // Sort claims by address for consistent ordering
  const sortedClaims = [...claims].sort((a, b) =>
    a.address.toLowerCase().localeCompare(b.address.toLowerCase())
  );

  // Generate leaves and add proof hash to each claim
  const leaves = sortedClaims.map((claim) => {
    const leafHash = generateLeafHash(claim.address, claim.amount);
    claim.proof = leafHash;
    return leafHash;
  });

  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  return {
    tree,
    root,
    claims: sortedClaims,
  };
}

/**
 * Get Merkle proof for a specific address and amount
 */
export function getMerkleProof(
  tree: MerkleTree,
  address: string,
  amount: string
): string[] {
  const leaf = generateLeafHash(address, amount);
  const proof = tree.getHexProof(leaf);
  return proof;
}

/**
 * Parse CSV content into ClaimData array
 */
function parseCSV(csvContent: string): ClaimData[] {
  const lines = csvContent.trim().split("\n");
  const claims: ClaimData[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [address, amount] = line.split(",");
    if (address && amount) {
      claims.push({
        address: address.trim(),
        amount: amount.trim(),
        proof: "", // Will be populated during Merkle tree generation
      });
    }
  }

  return claims;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({
      uploadDir: "/tmp",
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read the CSV file content
    const csvContent = fs.readFileSync(file.filepath, "utf-8");

    console.log("CSV File received:");
    console.log("Filename:", file.originalFilename);
    console.log("Size:", file.size);
    console.log("Content:", csvContent);

    // Parse CSV and generate Merkle tree
    const claims = parseCSV(csvContent);
    console.log("Parsed claims:", claims);

    if (claims.length === 0) {
      return res.status(400).json({ error: "No valid claims found in CSV" });
    }

    const merkleTreeData = generateMerkleTree(claims);
    console.log("Merkle tree generated:");
    console.log("Root:", merkleTreeData.root);
    console.log("Number of claims:", merkleTreeData.claims.length);
    console.log("Claims with proof hashes:", merkleTreeData.claims);

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      message: "CSV file processed and Merkle tree generated successfully",
      filename: file.originalFilename,
      size: file.size,
      merkleTree: {
        root: merkleTreeData.root,
        claimsCount: merkleTreeData.claims.length,
        claims: merkleTreeData.claims.map((claim) => ({
          address: claim.address,
          amount: claim.amount,
          proof: claim.proof,
        })),
      },
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Error processing file" });
  }
}
