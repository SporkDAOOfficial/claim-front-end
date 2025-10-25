import { Heading, Separator, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ClaimWithEpoch } from "@/pages/api/claims";
import LoadingPage from "@/components/1_atoms/LoadingPage/LoadingPage";
import { getAddress } from "viem";
import ClaimsTable from "./components/ClaimsTable/ClaimsTable";

const ClaimPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [claims, setClaims] = useState<ClaimWithEpoch[]>([]);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setIsLoading(true);

        if (!address) return;

        const response = await fetch(
          `/api/claims?address=${address ? getAddress(address) : ""}`
        );
        const result = await response.json();

        if (response.ok) {
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

  if (claims.length === 0 || !address || !isConnected) {
    return (
      <Stack h="80vh" justifyContent="center" alignItems="center" mt="1rem">
        {address && !isConnected && (
          <Text>Connect your wallet to view your claims.</Text>
        )}
        {claims.length === 0 && <Text>No claims found.</Text>}
      </Stack>
    );
  }

  return (
    <Stack gap="1rem">
      <Heading>Claim Tokens</Heading>
      <Separator />
      <ClaimsTable claims={claims} />
    </Stack>
  );
};

export default ClaimPage;
