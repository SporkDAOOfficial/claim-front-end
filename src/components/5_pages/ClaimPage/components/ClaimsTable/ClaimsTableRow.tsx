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
import { erc20Abi } from "viem";

interface ClaimsTableRowProps {
  claim: ClaimWithEpoch;
}

const ClaimsTableRow = ({ claim }: ClaimsTableRowProps) => {
  // State to store canClaim data with defaults
  const [canClaimData, setCanClaimData] = useState({
    canUserClaim: false,
    reason: "Loading...",
  });
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
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

  // Read on-chain epoch tuple to display true status (not DB flag)
  const { data: epochOnChain } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "getEpoch",
    args: [BigInt(claim.epochId)],
    query: { enabled: true },
  });

  // Fetch token decimals
  const { data: decimalsResult } = useReadContract({
    address: claim.epoch.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!claim.epoch.tokenAddress },
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

  // Update token decimals
  useEffect(() => {
    if (decimalsResult !== undefined) {
      setTokenDecimals(Number(decimalsResult));
    }
  }, [decimalsResult]);

  return (
    <Table.Row _hover={{ bg: "rgba(118, 75, 162, 0.05)" }}>
      <Table.Cell fontSize="sm" color="gray.100">{claim.epoch.name}</Table.Cell>
      <Table.Cell fontFamily="mono" fontSize="xs" color="gray.300">
        <TokenNameSymbol
          tokenAddress={claim.epoch.tokenAddress as `0x${string}`}
        />
      </Table.Cell>
      <Table.Cell fontSize="sm" color="gray.100" fontWeight="medium">
        {formatNumber(formatWeiToNumber(claim.amount, tokenDecimals), tokenDecimals)}
      </Table.Cell>
      <Table.Cell
        fontSize="sm"
        color={
          (() => {
            const deadline = epochOnChain ? Number((epochOnChain as readonly any[])[2]) : parseInt(claim.epoch.claimDeadline);
            return isDeadlinePassed(String(deadline)) ? "orange.400" : "gray.200";
          })()
        }
      >
        {(() => {
          const deadline = epochOnChain ? Number((epochOnChain as readonly any[])[2]) : parseInt(claim.epoch.claimDeadline);
          if (isNaN(deadline) || deadline <= 0) {
            return "Pending";
          }
          const date = new Date(deadline * 1000);
          if (isNaN(date.getTime())) {
            return "Pending";
          }
          return date.toLocaleString();
        })()}
      </Table.Cell>
      <Table.Cell>
        <Text
          color={
            (() => {
              const active = epochOnChain ? (epochOnChain as readonly any[])[5] === true : claim.epoch.isActive;
              const deadline = epochOnChain ? Number((epochOnChain as readonly any[])[2]) : parseInt(claim.epoch.claimDeadline);
              const expired = isDeadlinePassed(String(deadline));
              return active ? (expired ? "orange.400" : "green.400") : "orange.400";
            })()
          }
          fontSize="sm"
        >
          {(() => {
            const active = epochOnChain ? (epochOnChain as readonly any[])[5] === true : claim.epoch.isActive;
            const deadline = epochOnChain ? Number((epochOnChain as readonly any[])[2]) : parseInt(claim.epoch.claimDeadline);
            const expired = isDeadlinePassed(String(deadline));
            return active ? (expired ? "Expired" : "Active") : "Inactive";
          })()}
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
