import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { getAddress } from "viem";

// Interface for the API response
export interface ClaimWithEpoch {
  id: string;
  address: string;
  amount: string;
  proof: string[];
  merkleRoot: string;
  epochId: number;
  createdAt: string;
  epoch: {
    id: number;
    name: string;
    description: string;
    tokenAddress: string;
    totalAllocation: string;
    claimDeadline: string;
    merkleRoot: string;
    isActive: boolean;
    createdAt: string;
  };
}

export interface ClaimsApiResponse {
  address: string;
  claimsCount: number;
  claims: ClaimWithEpoch[];
}

// GET /api/claims?address=0x... - Get MerkleUserClaims by address
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      return res.status(400).json({
        error: "Address parameter is required",
      });
    }

    // Normalize address to checksum format for consistent querying
    const normalizedAddress = getAddress(address);

    console.log("Fetching claims for address:", normalizedAddress);

    // Fetch all claims for this address
    const claims = await prisma.merkleUserClaims.findMany({
      where: {
        address: normalizedAddress,
      },
      include: {
        epoch: {
          select: {
            id: true,
            name: true,
            description: true,
            tokenAddress: true,
            totalAllocation: true,
            claimDeadline: true,
            merkleRoot: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      `Found ${claims.length} claims for address ${normalizedAddress}`
    );

    const response: ClaimsApiResponse = {
      address: normalizedAddress,
      claimsCount: claims.length,
      claims: claims.map((claim) => ({
        id: claim.id,
        address: claim.address,
        amount: claim.amount,
        proof: JSON.parse(claim.proof || "[]"), // Parse JSON string back to array
        merkleRoot: claim.merkleRoot,
        epochId: claim.epochId,
        createdAt: claim.createdAt.toISOString(),
        epoch: {
          id: claim.epoch.id,
          name: claim.epoch.name,
          description: claim.epoch.description || "",
          tokenAddress: claim.epoch.tokenAddress,
          totalAllocation: claim.epoch.totalAllocation,
          claimDeadline: claim.epoch.claimDeadline,
          merkleRoot: claim.epoch.merkleRoot,
          isActive: claim.epoch.isActive,
          createdAt: claim.epoch.createdAt.toISOString(),
        },
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching claims:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      error: "Error fetching claims",
      details: errorMessage,
    });
  }
}
