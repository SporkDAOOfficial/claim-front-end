import {
  Button,
  Field,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";

const TokenClawback = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [isClawingBack, setIsClawingBack] = useState(false);

  // Token-based clawback
  const {
    writeContract: writeTokenClawback,
    data: clawbackHash,
    isPending: isClawbackPending,
  } = useWriteContract();

  // Wait for clawback transaction
  const { isLoading: isClawbackConfirming, isSuccess: isClawbackSuccess } =
    useWaitForTransactionReceipt({
      hash: clawbackHash,
    });

  // Handle token-based clawback
  const handleTokenClawback = () => {
    if (!tokenAddress || isClawingBack) return;

    setIsClawingBack(true);
    writeTokenClawback({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "deactivateEpochAndClawbackByToken",
      args: [tokenAddress as `0x${string}`],
    });
  };

  // Handle successful clawback
  useEffect(() => {
    if (isClawbackSuccess) {
      setIsClawingBack(false);
      setTokenAddress("");
      toaster.create({
        title: "Token-based clawback completed successfully!",
        type: "success",
      });
    }
  }, [isClawbackSuccess]);

  // Update loading state
  useEffect(() => {
    if (isClawbackPending || isClawbackConfirming) {
      setIsClawingBack(true);
    } else if (
      !isClawbackPending &&
      !isClawbackConfirming &&
      !isClawbackSuccess
    ) {
      setIsClawingBack(false);
    }
  }, [isClawbackPending, isClawbackConfirming, isClawbackSuccess]);

  return (
    <SimpleGrid columns={2} gap="2rem">
      <Stack
        border="1px solid"
        borderColor="fg.subtle"
        fontSize="sm"
        p="1rem"
        rounded="md"
        gap="1rem"
      >
        <Stack gap="0.5rem">
          <Heading size="md">Token-based Clawback</Heading>
          <Text fontSize="sm" color="fg.muted">
            Deactivate all active epochs for a specific token and clawback all
            unclaimed tokens. This will affect all epochs using the specified
            token.
          </Text>
        </Stack>

        <Field.Root>
          <Field.Label>Token Address</Field.Label>
          <Input
            size="sm"
            placeholder="0x..."
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
        </Field.Root>

        <Flex justifyContent="flex-end">
          <Button
            onClick={handleTokenClawback}
            loading={isClawingBack}
            disabled={!tokenAddress || isClawingBack}
            colorPalette="red"
            variant="outline"
            size="xs"
          >
            {isClawingBack ? "Processing..." : "Deactivate & Clawback by Token"}
          </Button>
        </Flex>
      </Stack>
    </SimpleGrid>
  );
};

export default TokenClawback;
