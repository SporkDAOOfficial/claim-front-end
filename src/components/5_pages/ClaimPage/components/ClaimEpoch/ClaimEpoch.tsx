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
  isDeadlinePassed: boolean;
}

const ClaimEpoch = ({ claim, disabled, isDeadlinePassed }: ClaimEpochProps) => {
  const { address } = useAccount();
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
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

  // Read on-chain epoch data to determine active/deadline regardless of DB state
  const { data: epochOnChain } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "getEpoch",
    args: [BigInt(claim.epochId)],
    query: { enabled: true },
  });

  // Update isClaimed state from smart contract
  useEffect(() => {
    if (hasClaimedResult !== undefined) {
      setIsClaimed(hasClaimedResult as boolean);
    }
  }, [hasClaimedResult, claim.epochId]);

  // Check if user can claim (prefer on-chain active/deadline)
  const canClaim = () => {
    const activeOnChain = epochOnChain ? (epochOnChain as readonly any[])[5] === true : claim.epoch.isActive;
    const deadlineSecOnChain = epochOnChain ? Number((epochOnChain as readonly any[])[2]) : undefined;
    const deadlinePassedOnChain = deadlineSecOnChain ? Date.now() > deadlineSecOnChain * 1000 : isDeadlinePassed;
    const hasAddress = Boolean(address);
    return Boolean(activeOnChain && !deadlinePassedOnChain && !isClaimed && hasAddress);
  };

  // Handle claim transaction
  const handleClaim = async () => {
    if (!address) {
      toaster.create({ title: "Connect your wallet to claim", type: "warning" });
      return;
    }
    if (!canClaim()) return;

    // Use the stored merkle proof array
    const merkleProof: `0x${string}`[] = claim.proof as `0x${string}`[];

    const payload = {
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "claim",
      args: [BigInt(claim.epochId), BigInt(claim.amount), merkleProof],
    };

    try {
      let useUnicorn = false;
      if (wallet?.isUnicorn && wallet.unicornWallet?.getAccount) {
        try {
          const acc = await wallet.unicornWallet.getAccount();
          useUnicorn = Boolean(acc?.address);
        } catch {
          useUnicorn = false;
        }
      }

      if (useUnicorn) {
        await wallet.unicornWallet!.sendTransaction(payload);
      } else {
        writeContract(payload);
      }
    } catch (e) {
      toaster.create({ title: "Unable to send transaction. Please reconnect and try again.", type: "error" });
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
        disabled={!canClaim() || disabled || isClaimed}
      >
        {isClaimed ? "Claimed" : "Claim"}
      </Button>
    </Flex>
  );
};

export default ClaimEpoch;
