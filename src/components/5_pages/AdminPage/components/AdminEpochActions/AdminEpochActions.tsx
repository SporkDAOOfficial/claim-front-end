import { Button, Flex, SimpleGrid } from "@chakra-ui/react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { isDeadlinePassed } from "@/utils/functions";

interface AdminEpochActionsProps {
  epochId: number;
  isActive: boolean;
  hasUnclaimed: boolean;
  claimDeadline: string;
}

const AdminEpochActions = ({
  epochId,
  isActive,
  hasUnclaimed,
  claimDeadline,
}: AdminEpochActionsProps) => {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isClawingBack, setIsClawingBack] = useState(false);

  // Write contract hook for deactivation
  const {
    writeContract: writeDeactivate,
    data: deactivateHash,
    isPending: isDeactivatingPending,
  } = useWriteContract();

  // Write contract hook for clawback
  const {
    writeContract: writeClawback,
    data: clawbackHash,
    isPending: isClawingBackPending,
  } = useWriteContract();

  // Wait for deactivation transaction receipt
  const { isLoading: isDeactivatingConfirming, isSuccess: isDeactivated } =
    useWaitForTransactionReceipt({
      hash: deactivateHash,
    });

  // Wait for clawback transaction receipt
  const { isLoading: isClawbackConfirming, isSuccess: isClawedBack } =
    useWaitForTransactionReceipt({
      hash: clawbackHash,
    });

  // Handle deactivate epoch
  const handleDeactivate = () => {
    if (!isActive || isDeactivating) return;

    setIsDeactivating(true);
    writeDeactivate({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "deactivateEpoch",
      args: [BigInt(epochId)],
    });
  };

  // Handle clawback
  const handleClawback = () => {
    if (!hasUnclaimed || isClawingBack) return;

    setIsClawingBack(true);
    writeClawback({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "clawback",
      args: [BigInt(epochId)],
    });
  };

  // Handle deactivate and clawback in one transaction
  const handleDeactivateAndClawback = () => {
    if (!isActive || isDeactivating) return;

    setIsDeactivating(true);
    writeDeactivate({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "deactivateEpochAndClawback",
      args: [BigInt(epochId)],
    });
  };

  // Handle successful deactivation
  useEffect(() => {
    if (isDeactivated) {
      setIsDeactivating(false);
      toaster.create({
        title: "Epoch deactivated successfully!",
        type: "success",
      });
    }
  }, [isDeactivated]);

  // Handle successful clawback
  useEffect(() => {
    if (isClawedBack) {
      setIsClawingBack(false);
      toaster.create({
        title: "Clawback successful!",
        type: "success",
      });
    }
  }, [isClawedBack]);

  // Reset loading states
  useEffect(() => {
    if (isDeactivatingPending || isDeactivatingConfirming) {
      setIsDeactivating(true);
    } else if (
      !isDeactivatingPending &&
      !isDeactivatingConfirming &&
      !isDeactivated
    ) {
      setIsDeactivating(false);
    }
  }, [isDeactivatingPending, isDeactivatingConfirming, isDeactivated]);

  useEffect(() => {
    if (isClawingBackPending || isClawbackConfirming) {
      setIsClawingBack(true);
    } else if (
      !isClawingBackPending &&
      !isClawbackConfirming &&
      !isClawedBack
    ) {
      setIsClawingBack(false);
    }
  }, [isClawingBackPending, isClawbackConfirming, isClawedBack]);

  return (
    <Flex gap="0.5rem" direction="column">
      {isActive && (
        <SimpleGrid columns={2} gap="0.5rem">
          <Button
            size="xs"
            onClick={handleDeactivate}
            loading={isDeactivating}
            disabled={isDeactivating || isClawingBack}
            colorPalette="orange"
            variant="outline"
          >
            {isDeactivating ? "Deactivating..." : "Deactivate"}
          </Button>
          {hasUnclaimed && (
            <Button
              size="xs"
              onClick={handleDeactivateAndClawback}
              loading={isDeactivating}
              disabled={isDeactivating || isClawingBack}
              colorPalette="red"
              variant="outline"
            >
              {isDeactivating
                ? "Processing..."
                : isDeadlinePassed(claimDeadline)
                ? "Deactivate & Clawback"
                : "Deactivate & Clawback"}
            </Button>
          )}
        </SimpleGrid>
      )}
      {!isActive && hasUnclaimed && (
        <Button
          size="xs"
          onClick={handleClawback}
          loading={isClawingBack}
          disabled={isDeactivating || isClawingBack}
          colorPalette="red"
          variant="outline"
        >
          {isClawingBack ? "Clawing back..." : "Clawback"}
        </Button>
      )}
    </Flex>
  );
};

export default AdminEpochActions;
