import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export interface EpochApiResponse {
  id: number;
  name: string;
  description: string;
  tokenAddress: string;
  totalAllocation: string;
  claimDeadline: string;
  merkleRoot: string;
  isActive: boolean;
  createdAt: string;
  claimsCount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const epochs = await prisma.epoch.findMany({
      include: {
        _count: {
          select: {
            claims: true,
          },
        },
      },
      orderBy: {
        id: "desc", // Most recent first
      },
    });

    const response: EpochApiResponse[] = epochs.map((epoch) => ({
      id: epoch.id,
      name: epoch.name,
      description: epoch.description || "",
      tokenAddress: epoch.tokenAddress,
      totalAllocation: epoch.totalAllocation,
      claimDeadline: epoch.claimDeadline,
      merkleRoot: epoch.merkleRoot,
      isActive: epoch.isActive,
      createdAt: epoch.createdAt.toISOString(),
      claimsCount: epoch._count.claims,
    }));

    console.log(`Fetched ${response.length} epochs`);

    res.status(200).json({
      epochs: response,
      totalCount: response.length,
    });
  } catch (error) {
    console.error("Error fetching epochs:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Error fetching epochs",
      details: errorMessage,
    });
  }
}
