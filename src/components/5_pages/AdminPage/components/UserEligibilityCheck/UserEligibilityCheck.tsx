import { Input, NativeSelect, Skeleton, Stack, Text } from "@chakra-ui/react";
import { Epoch } from "../../AdminPage";
import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { memContractAddress } from "@/web3/contractAddresses";
import { memAbi } from "@/web3/abis/mem_abi";
import { FieldValues, UseFormRegister } from "react-hook-form";

interface UserEligibilityCheckProps {
  watch: (name: string) => string;
  register: UseFormRegister<FieldValues>;
  epochs: Epoch[];
}

const UserEligibilityCheck = ({
  watch,
  register,
  epochs,
}: UserEligibilityCheckProps) => {
  const [selectedEpochId, setSelectedEpochId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    canUserClaim: boolean;
    reason: string;
  } | null>(null);

  // Read canClaim from smart contract when we have both epochId and userAddress
  const { data: canClaimResult, isPending } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "canClaim",
    args:
      selectedEpochId && watch("userAddress")
        ? [
            BigInt(selectedEpochId),
            watch("userAddress") as `0x${string}`,
            BigInt(0),
          ] // amount is 0 for checking eligibility
        : undefined,
    query: {
      enabled: !!(selectedEpochId && watch("userAddress")),
    },
  });

  // Update claim result when contract result is available
  useEffect(() => {
    if (canClaimResult !== undefined) {
      const data = canClaimResult as readonly [boolean, string];
      setClaimResult({
        canUserClaim: data[0],
        reason: data[1],
      });
      setIsLoading(false);
    }
  }, [canClaimResult]);

  // Update loading state when contract call is pending
  useEffect(() => {
    setIsLoading(isPending);
  }, [isPending]);

  return (
    <Stack
      border="1px solid"
      borderColor="fg.subtle"
      fontSize="sm"
      p="1rem"
      rounded="md"
      w="20rem"
      gap="1rem"
    >
      <Text>Check user eligibility</Text>
      <NativeSelect.Root size="xs">
        <NativeSelect.Field
          value={selectedEpochId?.toString() || ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value) {
              setSelectedEpochId(parseInt(value));
            } else {
              setSelectedEpochId(null);
            }
          }}
        >
          <option value="">Select epoch</option>
          {epochs.map((epoch: Epoch) => (
            <option key={epoch.id} value={epoch.id.toString()}>
              {epoch.name}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <Input
        size="xs"
        {...register("userAddress")}
        placeholder="User address"
      />
      {isLoading ? (
        <Skeleton height="20px" width="200px" />
      ) : (
        <Text>
          {!claimResult && !isLoading && "Status unknown"}
          {claimResult && claimResult.canUserClaim && "✅ Can claim"}
          {claimResult &&
            !claimResult.canUserClaim &&
            `❌ Cannot claim: ${claimResult.reason}`}
        </Text>
      )}
    </Stack>
  );
};

export default UserEligibilityCheck;
