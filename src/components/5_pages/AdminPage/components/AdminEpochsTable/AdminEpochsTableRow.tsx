import { Button, Table, Text } from "@chakra-ui/react";
import { Epoch } from "../../AdminPage";
import { formatNumber, formatWeiToNumber } from "@/utils/functions";
import SubmitOnChainEpochModal from "../SubmitOnChainEpochModal/SubmitOnChainEpochModal";
import { useReadContract } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";

interface AdminEpochsTableRowProps {
  epoch: Epoch;
}

const AdminEpochsTableRow = ({ epoch }: AdminEpochsTableRowProps) => {
  // State to store contract epoch data with defaults
  const [tokenName, setTokenName] = useState<string>("");
  const [contractData, setContractData] = useState({
    token: "0x0000000000000000000000000000000000000000",
    merkleRoot:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    claimDeadline: "0",
    totalAllocated: "0",
    totalClaimed: "0",
    active: false,
    unclaimed: "0",
  });

  // Read epoch data from smart contract
  const { data: contractEpochData } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "getEpoch",
    args: [BigInt(epoch.id)],
  });

  // Fetch token name from token address contract
  const { data: tokenNameResult } = useReadContract({
    address: epoch.tokenAddress as `0x${string}`,
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
    query: { enabled: !!epoch.tokenAddress },
  });

  useEffect(() => {
    if (tokenNameResult && typeof tokenNameResult === "string") {
      setTokenName(tokenNameResult);
    }
  }, [tokenNameResult, epoch.tokenAddress]);

  // Update state when contract data is available
  useEffect(() => {
    if (contractEpochData) {
      const data = contractEpochData as readonly [
        string,
        string,
        bigint,
        bigint,
        bigint,
        boolean,
        bigint
      ];
      const formattedData = {
        token: data[0],
        merkleRoot: data[1],
        claimDeadline: data[2].toString(),
        totalAllocated: data[3].toString(),
        totalClaimed: data[4].toString(),
        active: data[5],
        unclaimed: data[6].toString(),
      };

      setContractData(formattedData);
    }
  }, [contractEpochData, epoch.id]);

  // Check if claim deadline has passed
  const isDeadlinePassed = () => {
    const deadline = parseInt(epoch.claimDeadline) * 1000;
    return Date.now() > deadline;
  };

  return (
    <Table.Row>
      <Table.Cell fontSize="sm">{epoch.id}</Table.Cell>
      <Table.Cell fontSize="sm">{epoch.name}</Table.Cell>
      <Table.Cell fontFamily="mono" fontSize="xs">
        <Tooltip content={epoch.tokenAddress}>
          <Text cursor="pointer">{tokenName}</Text>
        </Tooltip>
      </Table.Cell>
      <Table.Cell fontSize="sm">
        {formatNumber(formatWeiToNumber(contractData.totalClaimed))} /{" "}
        {formatNumber(formatWeiToNumber(epoch.totalAllocation))}
      </Table.Cell>
      <Table.Cell
        fontSize="sm"
        color={isDeadlinePassed() ? "orange.500" : undefined}
      >
        {new Date(parseInt(epoch.claimDeadline) * 1000).toLocaleString()}
      </Table.Cell>
      <Table.Cell fontSize="sm">{epoch.claimsCount}</Table.Cell>
      <Table.Cell>
        <Text
          color={
            epoch.isActive
              ? isDeadlinePassed()
                ? "orange.500"
                : "green.500"
              : "orange.500"
          }
          fontSize="sm"
        >
          {epoch.isActive
            ? isDeadlinePassed()
              ? "Expired"
              : "Active"
            : "Pending"}
        </Text>
      </Table.Cell>
      <Table.Cell>
        {epoch.isActive ? (
          <Button size="xs" disabled>
            Epoch Submitted
          </Button>
        ) : (
          <SubmitOnChainEpochModal epoch={epoch} />
        )}
      </Table.Cell>
    </Table.Row>
  );
};

export default AdminEpochsTableRow;
