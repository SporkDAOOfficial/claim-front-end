import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { MerkleTree } from "merkletreejs";
import {
  keccak256,
  verifyMessage,
  encodeAbiParameters,
  concat,
  getAddress,
} from "viem";
import { prisma } from "../../lib/prisma";
import { isAdmin, isCreator } from "@/lib/contractUtils";

export interface ClaimData {
  address: string;
  amount: string; // Amount in wei (smallest unit)
  proof: string[]; // Array of merkle proof hashes
}

export interface EpochData {
  name: string;
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
 * Verify signature and check if address has admin role on contract
 */
async function verifyAdminSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    // Verify the signature
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    // Check if the signature is valid
    if (!isValidSignature) {
      return false;
    }

    // Check if address has admin role on the contract
    const hasAdminRole = await isAdmin(address);
    const hasCreatorRole = await isCreator(address);

    if (!hasAdminRole) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

/**
 * Generate proof hash for a single claim
 */
function generateLeafHash(address: string, amount: string): string {
  // Generate proof hash for a single claim
  const encoded = encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [address as `0x${string}`, BigInt(amount)]
  );

  // First hash: keccak256(abi.encode(address, amount))
  const firstHash = keccak256(encoded);

  // Second hash: keccak256(bytes.concat(keccak256(abi.encode(address, amount))))
  // This matches the Solidity: keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))))
  const finalHash = keccak256(concat([firstHash]));

  return finalHash;
}

/**
 * Generate a Merkle tree from claim data
 */
export function generateMerkleTree(claims: ClaimData[]): MerkleTreeData {
  if (claims.length === 0) {
    throw new Error("Cannot generate Merkle tree with empty claims");
  }

  // Sort claims by address for consistent ordering (use getAddress for proper checksum format)
  const sortedClaims = [...claims].sort((a, b) =>
    getAddress(a.address).localeCompare(getAddress(b.address))
  );

  // Generate leaves for the merkle tree
  const leaves = sortedClaims.map((claim) => {
    return generateLeafHash(claim.address, claim.amount);
  });

  const tree = new MerkleTree(leaves, keccak256, {
    sortLeaves: true,
    sortPairs: true,
  });
  const root = tree.getHexRoot();

  // Generate merkle proofs for each claim
  sortedClaims.forEach((claim) => {
    claim.proof = getMerkleProof(tree, claim.address, claim.amount);
  });

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
      try {
        // Normalize address to proper checksum format using viem
        const normalizedAddress = getAddress(address.trim());
        claims.push({
          address: normalizedAddress, // Properly formatted checksum address
          amount: amount.trim(),
          proof: [], // Will be populated during Merkle tree generation
        });
      } catch (error) {
        console.error(`Invalid address in CSV: ${address.trim()}`, error);
        // Skip invalid addresses
      }
    }
  }

  return claims;
}

/**
 * Create a new epoch with form data
 * Manually manages ID to ensure it starts from 1 and increments properly
 */
async function createEpoch(epochData: EpochData) {
  // Get the highest existing ID
  const lastEpoch = await prisma.epoch.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  // Calculate next ID (start from 1 if no epochs exist)
  const nextId = lastEpoch ? lastEpoch.id + 1 : 1;

  return await prisma.epoch.create({
    data: {
      id: nextId, // Manually set the ID
      name: epochData.name || "Epoch", // Use provided name or default
      description: `Token: ${epochData.tokenAddress}`,
      tokenAddress: epochData.tokenAddress,
      totalAllocation: epochData.totalAllocation,
      claimDeadline: epochData.claimDeadline,
      merkleRoot: "", // Will be updated after Merkle tree generation
      isActive: false,
    },
  });
}

/**
 * Update epoch with Merkle root and proper description
 */
async function updateEpochWithMerkleRoot(
  epochId: number,
  merkleRoot: string,
  tokenAddress: string,
  name: string
) {
  return await prisma.epoch.update({
    where: { id: epochId },
    data: {
      merkleRoot,
      description: `${name} - Token: ${tokenAddress}`,
    },
  });
}

/**
 * Save claims to database
 */
async function saveClaimsToDatabase(
  claims: ClaimData[],
  merkleRoot: string,
  epochId: number
) {
  const claimsData = claims.map((claim) => ({
    address: claim.address, // Keep original checksum format
    amount: claim.amount,
    proof: JSON.stringify(claim.proof), // Store merkle proof array as JSON string
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
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const tokenAddress = Array.isArray(fields.tokenAddress)
      ? fields.tokenAddress[0]
      : fields.tokenAddress;
    const totalAllocation = Array.isArray(fields.totalAllocation)
      ? fields.totalAllocation[0]
      : fields.totalAllocation;
    const claimDeadline = Array.isArray(fields.claimDeadline)
      ? fields.claimDeadline[0]
      : fields.claimDeadline;
    const signature = Array.isArray(fields.signature)
      ? fields.signature[0]
      : fields.signature;
    const address = Array.isArray(fields.address)
      ? fields.address[0]
      : fields.address;
    const message = Array.isArray(fields.message)
      ? fields.message[0]
      : fields.message;

    if (!tokenAddress || !totalAllocation || !claimDeadline) {
      return res.status(400).json({
        error:
          "Missing required fields: tokenAddress, totalAllocation, claimDeadline",
      });
    }

    if (!signature || !address || !message) {
      return res.status(400).json({
        error: "Missing signature verification data",
      });
    }

    // Verify admin signature
    const isValidAdmin = await verifyAdminSignature(
      address,
      message,
      signature
    );
    if (!isValidAdmin) {
      return res.status(403).json({
        error: "Unauthorized: Invalid signature or not an admin",
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read the CSV file content
    const csvContent = fs.readFileSync(file.filepath, "utf-8");

    // Parse CSV and generate Merkle tree
    const claims = parseCSV(csvContent);

    if (claims.length === 0) {
      return res.status(400).json({ error: "No valid claims found in CSV" });
    }

    const merkleTreeData = generateMerkleTree(claims);

    // Create epoch with form data
    const epochData: EpochData = {
      name: name || "Epoch",
      tokenAddress,
      totalAllocation,
      claimDeadline,
    };

    const epoch = await createEpoch(epochData);

    // Update epoch with Merkle root
    const updatedEpoch = await updateEpochWithMerkleRoot(
      epoch.id,
      merkleTreeData.root,
      tokenAddress,
      name || "Epoch"
    );

    // Save claims to database
    const savedClaims = await saveClaimsToDatabase(
      merkleTreeData.claims,
      merkleTreeData.root,
      epoch.id
    );

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
