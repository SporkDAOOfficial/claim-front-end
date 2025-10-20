import { Button, Flex } from "@chakra-ui/react";
import { ClaimWithEpoch } from "@/pages/api/claims";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { useUniversalWallet } from "@unicorn.eth/autoconnect";

interface ClaimEpochProps {
  claim: ClaimWithEpoch;
  disabled: boolean;
}

const ClaimEpoch = ({ claim, disabled }: ClaimEpochProps) => {
  const { address } = useAccount();
  const [isClaimed, setIsClaimed] = useState<boolean | null>(null);
  const wallet = useUniversalWallet();

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

  // Read hasClaimed data from smart contract
  const { data: hasClaimedResult } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "hasClaimed",
    args: address ? [BigInt(claim.epochId), address] : undefined,
    query: { enabled: !!address },
  });

  // Check if claim deadline has passed
  const isDeadlinePassed = () => {
    const deadline = parseInt(claim.epoch.claimDeadline) * 1000;
    return Date.now() > deadline;
  };

  // Update isClaimed state from smart contract
  useEffect(() => {
    if (hasClaimedResult !== undefined) {
      setIsClaimed(hasClaimedResult as boolean);
    }
  }, [hasClaimedResult, claim.epochId]);

  // Check if user can claim
  const canClaim = () => {
    return claim.epoch.isActive && !isDeadlinePassed() && !isClaimed && address;
  };

  // Handle claim transaction
  const handleClaim = async () => {
    if (!canClaim()) return;

    // Use the stored merkle proof array
    const merkleProof: `0x${string}`[] = claim.proof as `0x${string}`[];

    const payload = {
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "claim",
      args: [BigInt(claim.epochId), BigInt(claim.amount), merkleProof],
    };

    if (wallet.isUnicorn) {
      await wallet.unicornWallet.sendTransaction(payload);
    } else {
      writeContract(payload);
    }
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
          : isClaimed === null
          ? "Loading..."
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
