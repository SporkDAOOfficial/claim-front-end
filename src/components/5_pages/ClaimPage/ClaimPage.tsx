import {
  Button,
  Heading,
  Separator,
  Stack,
  Text,
  Table,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ClaimWithEpoch } from "@/pages/api/claims";
import LoadingPage from "@/components/1_atoms/LoadingPage/LoadingPage";

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
    return <LoadingPage />;
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
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Epoch</Table.ColumnHeader>
            <Table.ColumnHeader>Token Address</Table.ColumnHeader>
            <Table.ColumnHeader>Claim Amount</Table.ColumnHeader>
            <Table.ColumnHeader>Claim Deadline</Table.ColumnHeader>
            <Table.ColumnHeader>Proof</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Action</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {claims.map((claim) => (
            <Table.Row key={claim.id}>
              <Table.Cell>{claim.epoch.name}</Table.Cell>
              <Table.Cell fontFamily="mono" fontSize="xs">
                {claim.epoch.tokenAddress.slice(0, 6)}...
                {claim.epoch.tokenAddress.slice(-4)}
              </Table.Cell>
              <Table.Cell>{claim.amount}</Table.Cell>
              <Table.Cell>
                {new Date(
                  parseInt(claim.epoch.claimDeadline) * 1000
                ).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell fontFamily="mono" fontSize="xs">
                {claim.proof.slice(0, 10)}...{claim.proof.slice(-10)}
              </Table.Cell>
              <Table.Cell>
                <Text color={claim.epoch.isActive ? "green.500" : "red.500"}>
                  {claim.epoch.isActive ? "Active" : "Inactive"}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Button size="xs" disabled={!claim.epoch.isActive}>
                  Claim
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Stack>
  );
};

export default ClaimPage;
