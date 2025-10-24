import { formatNumber, formatWeiToNumber } from "@/utils/functions";
import {
  Button,
  CloseButton,
  Dialog,
  Portal,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Epoch } from "../../AdminPage";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState, useEffect } from "react";
import { memContractAddress } from "@/web3/contractAddresses";
import { erc20Abi } from "viem";
import { memAbi } from "@/web3/abis/mem_abi";

interface SubmitOnChainEpochModalProps {
  epoch: Epoch;
}

const SubmitOnChainEpochModal = ({ epoch }: SubmitOnChainEpochModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { address } = useAccount();

  // Write contract hook for approval
  const {
    writeContract,
    data: hash,
    isPending: isApproving,
  } = useWriteContract();

  // Write contract hook for epoch submission
  const {
    writeContract: writeContractEpoch,
    data: epochHash,
    isPending: isSubmittingEpoch,
  } = useWriteContract();

  // Wait for approval transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Wait for epoch submission transaction receipt
  const { isLoading: isConfirmingEpoch, isSuccess: isEpochConfirmed } =
    useWaitForTransactionReceipt({
      hash: epochHash,
    });

  // Read allowance when modal is open and we have the required data
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: epoch.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && isOpen
        ? [address, memContractAddress as `0x${string}`]
        : undefined,
    query: {
      enabled: !!(address && isOpen && epoch.tokenAddress),
    },
  });

  // Refetch allowance when modal opens or when approval is confirmed
  useEffect(() => {
    if (isOpen) {
      refetchAllowance();
    }
  }, [isOpen, refetchAllowance]);

  // Refetch allowance when approval transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance();
    }
  }, [isConfirmed, refetchAllowance]);

  // Update epoch to active when epoch submission is confirmed
  useEffect(() => {
    if (isEpochConfirmed) {
      updateEpochToActive();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEpochConfirmed]);

  // Handle approval transaction
  const handleApprove = () => {
    writeContract({
      address: epoch.tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [
        memContractAddress as `0x${string}`,
        BigInt(epoch.totalAllocation),
      ],
    });
  };

  // Handle epoch submission
  const handleSubmitEpoch = () => {
    writeContractEpoch({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "createEpoch",
      args: [
        BigInt(epoch.id),
        epoch.tokenAddress as `0x${string}`,
        epoch.merkleRoot as `0x${string}`,
        BigInt(epoch.claimDeadline),
        BigInt(epoch.totalAllocation),
      ],
    });
  };

  // Update epoch to active in database
  const updateEpochToActive = async () => {
    try {
      const response = await fetch("/api/epochs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          epochId: epoch.id,
          isActive: true,
        }),
      });

      if (response.ok) {
        // Optionally refresh the parent component's epoch list
        window.location.reload(); // Simple refresh for now
      } else {
        console.error("Failed to update epoch to active");
      }
    } catch (error) {
      console.error("Error updating epoch to active:", error);
    }
  };

  return (
    <Dialog.Root size="lg" onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <SimpleGrid columns={2} gap="0.5rem">
          <Button colorPalette="blue" size="xs" variant="outline">
            Submit Epoch
          </Button>
        </SimpleGrid>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{epoch?.name}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="1rem">
                <Stack>
                  <Text>Token Address:</Text>
                  <Text fontFamily="mono" fontSize="xs">
                    {epoch?.tokenAddress}
                  </Text>
                </Stack>
                <SimpleGrid columns={3}>
                  <Stack>
                    <Text>Total Allocation:</Text>
                    <Text fontSize="xs">
                      {formatNumber(formatWeiToNumber(epoch?.totalAllocation))}
                    </Text>
                  </Stack>
                  <Stack>
                    <Text>Claim Deadline:</Text>
                    <Text fontSize="xs">
                      {new Date(
                        parseInt(epoch?.claimDeadline) * 1000
                      ).toLocaleString()}
                    </Text>
                  </Stack>
                  <Stack>
                    <Text>Claims Count:</Text>
                    <Text fontSize="xs">{epoch?.claimsCount}</Text>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Stack direction="row" gap="1rem">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  loading={isApproving || isConfirming}
                  disabled={
                    !!(
                      allowance !== undefined &&
                      allowance >= BigInt(epoch.totalAllocation)
                    )
                  }
                >
                  {isApproving
                    ? "Approving..."
                    : isConfirming
                    ? "Confirming..."
                    : allowance !== undefined &&
                      allowance >= BigInt(epoch.totalAllocation)
                    ? "Already Approved"
                    : "Approve"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitEpoch}
                  loading={isSubmittingEpoch || isConfirmingEpoch}
                  disabled={
                    allowance === undefined ||
                    !(allowance >= BigInt(epoch.totalAllocation))
                  }
                >
                  {isSubmittingEpoch
                    ? "Submitting..."
                    : isConfirmingEpoch
                    ? "Confirming..."
                    : "Submit"}
                </Button>
              </Stack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default SubmitOnChainEpochModal;
