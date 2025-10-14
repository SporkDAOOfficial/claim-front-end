import { Button, Flex } from "@chakra-ui/react";
import { ClaimWithEpoch } from "@/pages/api/claims";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";

interface ClaimEpochProps {
  claim: ClaimWithEpoch;
  disabled: boolean;
}

const ClaimEpoch = ({ claim, disabled }: ClaimEpochProps) => {
  const { address } = useAccount();
  const [isClaimed, setIsClaimed] = useState(false);

  // Write contract hook for claiming
  const {
    writeContract,
    data: hash,
    isPending: isClaiming,
  } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Check if claim deadline has passed
  const isDeadlinePassed = () => {
    const deadline = parseInt(claim.epoch.claimDeadline) * 1000;
    return Date.now() > deadline;
  };

  // Check if user can claim
  const canClaim = () => {
    return claim.epoch.isActive && !isDeadlinePassed() && !isClaimed && address;
  };

  // Handle claim transaction
  const handleClaim = () => {
    if (!canClaim()) return;

    // Use the stored merkle proof array
    const merkleProof: `0x${string}`[] = claim.proof as `0x${string}`[];

    writeContract({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "claim",
      args: [BigInt(claim.epochId), BigInt(claim.amount), merkleProof],
    });
  };

  // Handle successful claim
  useEffect(() => {
    if (isConfirmed) {
      setIsClaimed(true);
      toaster.create({
        title: "Claim successful!",
        type: "success",
      });
    }
  }, [isConfirmed]);

  return (
    <Flex w="5rem">
      <Button
        size="xs"
        onClick={handleClaim}
        loading={isClaiming || isConfirming}
        disabled={!canClaim() || disabled}
      >
        {isClaiming
          ? "Claiming..."
          : isConfirming
          ? "Confirming..."
          : isClaimed
          ? "Claimed"
          : isDeadlinePassed()
          ? "Expired"
          : !claim.epoch.isActive || disabled
          ? "Inactive"
          : disabled
          ? "Not Eligible"
          : "Claim"}
      </Button>
    </Flex>
  );
};

export default ClaimEpoch;
