import { ClaimWithEpoch } from "@/pages/api/claims";
import { formatNumber } from "@/utils/functions";
import { formatWeiToNumber } from "@/utils/functions";
import { Table, Text } from "@chakra-ui/react";
import ClaimEpoch from "../ClaimEpoch/ClaimEpoch";
import { useReadContract } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Tooltip } from "@/components/ui/tooltip";

interface ClaimsTableRowProps {
  claim: ClaimWithEpoch;
}

const ClaimsTableRow = ({ claim }: ClaimsTableRowProps) => {
  const { address } = useAccount();

  const [tokenName, setTokenName] = useState<string>("");
  // State to store canClaim data with defaults
  const [canClaimData, setCanClaimData] = useState({
    canUserClaim: false,
    reason: "Loading...",
  });

  // Read canClaim data from smart contract
  const { data: canClaimResult } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "canClaim",
    args: address
      ? [BigInt(claim.epochId), address, BigInt(claim.amount)]
      : undefined,
    query: { enabled: !!address },
  });

  // Fetch token name from token address contract
  const { data: tokenNameResult } = useReadContract({
    address: claim.epoch.tokenAddress as `0x${string}`,
    abi: [
      {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [{ name: "", type: "string" }],
        type: "function",
      },
    ],
    functionName: "name",
    query: { enabled: !!claim.epoch.tokenAddress },
  });

  useEffect(() => {
    if (tokenNameResult && typeof tokenNameResult === "string") {
      setTokenName(tokenNameResult);
    }
  }, [tokenNameResult, claim.epoch.tokenAddress]);

  // Update state when canClaim data is available
  useEffect(() => {
    if (canClaimResult) {
      const data = canClaimResult as readonly [boolean, string];
      const formattedData = {
        canUserClaim: data[0],
        reason: data[1],
      };

      setCanClaimData(formattedData);
    }
  }, [canClaimResult, claim.epochId]);

  return (
    <Table.Row>
      <Table.Cell fontSize="sm">{claim.epoch.name}</Table.Cell>
      <Table.Cell fontFamily="mono" fontSize="xs">
        <Tooltip content={claim.epoch.tokenAddress}>
          <Text cursor="pointer">{tokenName}</Text>
        </Tooltip>
      </Table.Cell>
      <Table.Cell fontSize="sm">
        {formatNumber(formatWeiToNumber(claim.amount))}
      </Table.Cell>
      <Table.Cell fontSize="sm">
        {new Date(parseInt(claim.epoch.claimDeadline) * 1000).toLocaleString()}
      </Table.Cell>
      <Table.Cell>
        <Text
          color={claim.epoch.isActive ? "green.500" : "red.500"}
          fontSize="sm"
        >
          {claim.epoch.isActive ? "Active" : "Inactive"}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <ClaimEpoch claim={claim} disabled={!canClaimData.canUserClaim} />
      </Table.Cell>
    </Table.Row>
  );
};

export default ClaimsTableRow;
