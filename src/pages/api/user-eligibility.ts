import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export interface UserEligibilityResponse {
  canUserClaim: boolean;
  reason: string;
  claimData?: {
    amount: string;
    proof: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, epochId } = req.query;

  if (!address || !epochId) {
    return res.status(400).json({
      error: "Missing required parameters: address and epochId",
    });
  }

  try {
    // Check if the epoch exists and is active
    const epoch = await prisma.epoch.findUnique({
      where: { id: parseInt(epochId as string) },
    });

    if (!epoch) {
      return res.status(404).json({
        canUserClaim: false,
        reason: "Epoch not found",
      });
    }

    // Check if user has a claim for this epoch (case-insensitive)
    const userClaim = await prisma.merkleUserClaims.findFirst({
      where: {
        address: {
          equals: address as string,
          mode: 'insensitive',
        },
        epochId: parseInt(epochId as string),
      },
    });

    if (!userClaim) {
      return res.status(200).json({
        canUserClaim: false,
        reason: "User is not eligible for this epoch",
      });
    }

    // User is eligible
    return res.status(200).json({
      canUserClaim: true,
      reason: "User is eligible to claim",
      claimData: {
        amount: userClaim.amount,
        proof: userClaim.proof,
      },
    });
  } catch (error) {
    console.error("Error checking user eligibility:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      error: "Error checking user eligibility",
      details: errorMessage,
    });
  }
}
