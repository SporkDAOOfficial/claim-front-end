import { Input, NativeSelect, Skeleton, Stack, Text } from "@chakra-ui/react";
import { Epoch } from "../../AdminPage";
import { useEffect, useState } from "react";
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
    claimData?: {
      amount: string;
      proof: string;
    };
  } | null>(null);

  // Check user eligibility from database
  const checkUserEligibility = async (address: string, epochId: number) => {
    if (!address || !epochId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/user-eligibility?address=${address}&epochId=${epochId}`
      );
      const data = await response.json();

      setClaimResult({
        canUserClaim: data.canUserClaim,
        reason: data.reason,
        claimData: data.claimData,
      });
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setClaimResult({
        canUserClaim: false,
        reason: "Error checking eligibility",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check eligibility when epoch or address changes
  const userAddress = watch("userAddress");
  useEffect(() => {
    if (selectedEpochId && userAddress) {
      checkUserEligibility(userAddress, selectedEpochId);
    } else {
      setClaimResult(null);
    }
  }, [selectedEpochId, userAddress]);

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
      {isLoading && watch("userAddress") ? (
        <Skeleton height="20px" width="200px" />
      ) : (
        <Stack gap="0.5rem">
          <Text>
            {!claimResult && !isLoading && "Status unknown"}
            {claimResult &&
              claimResult.canUserClaim &&
              watch("userAddress") &&
              "✅ Can claim"}
            {claimResult &&
              !claimResult.canUserClaim &&
              watch("userAddress") &&
              `❌ Cannot claim: ${claimResult.reason}`}
          </Text>
          {claimResult?.canUserClaim && claimResult.claimData && (
            <Stack gap="0.25rem" fontSize="xs" color="fg.muted">
              <Text>Amount: {claimResult.claimData.amount}</Text>
              <Text>
                Proof available: {claimResult.claimData.proof ? "Yes" : "No"}
              </Text>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default UserEligibilityCheck;
