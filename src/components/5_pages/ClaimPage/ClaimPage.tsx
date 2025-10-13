import {
  Button,
  Flex,
  Heading,
  Separator,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ClaimWithEpoch } from "@/pages/api/claims";

const ClaimPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [claims, setClaims] = useState<ClaimWithEpoch[]>([]);
  const { address } = useAccount();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setIsLoading(true);
        console.log(
          "Fetching claims for address:",
          address?.toLowerCase() ?? ""
        );

        if (!address) return;

        const response = await fetch(
          `/api/claims?address=${address?.toLowerCase() ?? ""}`
        );
        const result = await response.json();

        console.log("Claims API Response:", result);

        if (response.ok) {
          console.log(
            `Found ${result.claimsCount} claims for ${result.address}`
          );
          console.log("Claims:", result.claims);
          setClaims(result.claims);
        } else {
          console.error("Error fetching claims:", result.error);
        }
      } catch (error) {
        console.error("Error calling claims API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch claims when component mounts
    fetchClaims();
  }, [address]);

  if (isLoading) {
    return (
      <Stack h="80vh" justifyContent="center" alignItems="center" mt="1rem">
        <Spinner size="xl" />
      </Stack>
    );
  }

  if (claims.length === 0) {
    return (
      <Stack h="80vh" justifyContent="center" alignItems="center" mt="1rem">
        <Text>No claims found for this address.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="1rem">
      <Heading>Claim Tokens</Heading>
      <Separator />
      <SimpleGrid gap="1rem" columns={3} mt="1rem">
        {claims.map((claim) => (
          <Stack
            key={claim.id}
            border="1px solid"
            borderColor="fg.subtle"
            p="1rem"
            rounded="md"
            bg="bg.panel"
            fontSize="sm"
          >
            <Text>
              Claim Deadline:{" "}
              {new Date(
                parseInt(claim.epoch.claimDeadline) * 1000
              ).toLocaleString()}
            </Text>
            <Text>Claim Amount: {claim.amount}</Text>
            <Text>
              Proof: {claim.proof.slice(0, 10)}...{claim.proof.slice(-10)}
            </Text>
            <Flex justifyContent="flex-end">
              <Button size="xs">Claim</Button>
            </Flex>
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default ClaimPage;
