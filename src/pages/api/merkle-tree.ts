import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "viem";
import { prisma } from "../../lib/prisma";

export interface ClaimData {
  address: string;
  amount: string; // Amount in wei (smallest unit)
  proof: string; // Individual proof hash for this claim
}

export interface EpochData {
  tokenAddress: string;
  totalAllocation: string;
  claimDeadline: string; // Unix timestamp as string
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
        address: address.trim().toLowerCase(), // Convert to lowercase
        amount: amount.trim(),
        proof: "", // Will be populated during Merkle tree generation
      });
    }
  }

  return claims;
}

/**
 * Get the next sequential ID for epoch creation
 * TODO: Replace with smart contract call in the future
 */
async function getNextEpochId(): Promise<string> {
  try {
    // Query database for the highest existing ID
    const lastEpoch = await prisma.epoch.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });

    // If no epochs exist, start with ID 1
    if (!lastEpoch) {
      console.log("No existing epochs found, starting with ID 1");
      return "1";
    }

    // Increment the last ID by 1
    const nextId = (parseInt(lastEpoch.id) + 1).toString();
    console.log(
      `Generated next epoch ID: ${nextId} (previous: ${lastEpoch.id})`
    );

    return nextId;
  } catch (error) {
    console.error("Error getting next epoch ID:", error);
    // Fallback to ID 1 if there's an error
    return "1";
  }
}

/**
 * Create a new epoch with form data
 */
async function createEpoch(epochData: EpochData) {
  // Get the next sequential ID (placeholder for future smart contract integration)
  const nextId = await getNextEpochId();

  return await prisma.epoch.create({
    data: {
      id: nextId,
      name: `Epoch ${nextId}`,
      description: `Epoch ${nextId} - Token: ${epochData.tokenAddress}`,
      tokenAddress: epochData.tokenAddress,
      totalAllocation: epochData.totalAllocation,
      claimDeadline: epochData.claimDeadline,
      merkleRoot: "", // Will be updated after Merkle tree generation
      isActive: true,
    },
  });
}

/**
 * Update epoch with Merkle root
 */
async function updateEpochWithMerkleRoot(epochId: string, merkleRoot: string) {
  return await prisma.epoch.update({
    where: { id: epochId },
    data: { merkleRoot },
  });
}

/**
 * Save claims to database
 */
async function saveClaimsToDatabase(
  claims: ClaimData[],
  merkleRoot: string,
  epochId: string
) {
  const claimsData = claims.map((claim) => ({
    address: claim.address.toLowerCase(), // Ensure lowercase in database
    amount: claim.amount,
    proof: claim.proof,
    merkleRoot: merkleRoot,
    epochId: epochId,
  }));

  // Use upsert to handle potential duplicates
  const savedClaims = await Promise.all(
    claimsData.map((claimData) =>
      prisma.merkleUserClaims.upsert({
        where: {
          address_epochId: {
            address: claimData.address,
            epochId: claimData.epochId,
          },
        },
        update: {
          amount: claimData.amount,
          proof: claimData.proof,
          epochId: claimData.epochId,
        },
        create: claimData,
      })
    )
  );

  return savedClaims;
}

// POST /api/merkle-tree - Create epoch and process CSV
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

    // Extract form data
    const tokenAddress = Array.isArray(fields.tokenAddress)
      ? fields.tokenAddress[0]
      : fields.tokenAddress;
    const totalAllocation = Array.isArray(fields.totalAllocation)
      ? fields.totalAllocation[0]
      : fields.totalAllocation;
    const claimDeadline = Array.isArray(fields.claimDeadline)
      ? fields.claimDeadline[0]
      : fields.claimDeadline;

    if (!tokenAddress || !totalAllocation || !claimDeadline) {
      return res.status(400).json({
        error:
          "Missing required fields: tokenAddress, totalAllocation, claimDeadline",
      });
    }

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

    // Create epoch with form data
    const epochData: EpochData = {
      tokenAddress,
      totalAllocation,
      claimDeadline,
    };

    const epoch = await createEpoch(epochData);
    console.log("Epoch created:", epoch.id);

    // Update epoch with Merkle root
    const updatedEpoch = await updateEpochWithMerkleRoot(
      epoch.id,
      merkleTreeData.root
    );
    console.log("Epoch updated with Merkle root");

    // Save claims to database
    const savedClaims = await saveClaimsToDatabase(
      merkleTreeData.claims,
      merkleTreeData.root,
      epoch.id
    );
    console.log("Claims saved to database:", savedClaims.length);

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      message:
        "Epoch created, Merkle tree generated, and claims saved successfully",
      filename: file.originalFilename,
      size: file.size,
      epoch: {
        id: updatedEpoch.id,
        name: updatedEpoch.name,
        description: updatedEpoch.description,
        tokenAddress: updatedEpoch.tokenAddress,
        totalAllocation: updatedEpoch.totalAllocation,
        claimDeadline: updatedEpoch.claimDeadline,
        merkleRoot: updatedEpoch.merkleRoot,
        isActive: updatedEpoch.isActive,
      },
      merkleTree: {
        root: merkleTreeData.root,
        claimsCount: merkleTreeData.claims.length,
        claims: merkleTreeData.claims.map((claim) => ({
          address: claim.address,
          amount: claim.amount,
          proof: claim.proof,
        })),
      },
      database: {
        savedClaimsCount: savedClaims.length,
      },
    });
  } catch (error) {
    console.error("Error processing file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof Error ? error.name : "Error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
    });
    res.status(500).json({
      error: "Error processing file",
      details: errorMessage,
      type: errorName,
    });
  }
}
