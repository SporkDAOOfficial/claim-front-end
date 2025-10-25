import { ClaimWithEpoch } from "@/pages/api/claims";
import { formatNumber, isDeadlinePassed } from "@/utils/functions";
import { formatWeiToNumber } from "@/utils/functions";
import { Table, Text } from "@chakra-ui/react";
import ClaimEpoch from "../ClaimEpoch/ClaimEpoch";
import { useReadContract } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import TokenNameSymbol from "@/components/1_atoms/TokenNameSymbol/TokenNameSymbol";

interface ClaimsTableRowProps {
  claim: ClaimWithEpoch;
}

const ClaimsTableRow = ({ claim }: ClaimsTableRowProps) => {
  // State to store canClaim data with defaults
  const [canClaimData, setCanClaimData] = useState({
    canUserClaim: false,
    reason: "Loading...",
  });
  const { address } = useAccount();

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
        <TokenNameSymbol
          tokenAddress={claim.epoch.tokenAddress as `0x${string}`}
        />
      </Table.Cell>
      <Table.Cell fontSize="sm">
        {formatNumber(formatWeiToNumber(claim.amount))}
      </Table.Cell>
      <Table.Cell
        fontSize="sm"
        color={
          isDeadlinePassed(claim.epoch.claimDeadline) ? "orange.500" : undefined
        }
      >
        {new Date(parseInt(claim.epoch.claimDeadline) * 1000).toLocaleString()}
      </Table.Cell>
      <Table.Cell>
        <Text
          color={
            claim.epoch.isActive
              ? isDeadlinePassed(claim.epoch.claimDeadline)
                ? "orange.500"
                : "green.500"
              : "orange.500"
          }
          fontSize="sm"
        >
          {claim.epoch.isActive
            ? isDeadlinePassed(claim.epoch.claimDeadline)
              ? "Expired"
              : "Active"
            : "Inactive"}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <ClaimEpoch
          claim={claim}
          disabled={!canClaimData.canUserClaim}
          isDeadlinePassed={isDeadlinePassed(claim.epoch.claimDeadline)}
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default ClaimsTableRow;
