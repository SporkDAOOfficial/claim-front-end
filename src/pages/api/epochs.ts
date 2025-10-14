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
  if (req.method === "GET") {
    return handleGetEpochs(req, res);
  } else if (req.method === "PUT") {
    return handleUpdateEpoch(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetEpochs(req: NextApiRequest, res: NextApiResponse) {
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

async function handleUpdateEpoch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { epochId, isActive } = req.body;

    if (!epochId || typeof isActive !== "boolean") {
      return res.status(400).json({
        error: "Missing required fields: epochId and isActive",
      });
    }

    const updatedEpoch = await prisma.epoch.update({
      where: { id: parseInt(epochId) },
      data: { isActive },
    });

    res.status(200).json({
      message: "Epoch updated successfully",
      epoch: {
        id: updatedEpoch.id,
        isActive: updatedEpoch.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating epoch:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Error updating epoch",
      details: errorMessage,
    });
  }
}
