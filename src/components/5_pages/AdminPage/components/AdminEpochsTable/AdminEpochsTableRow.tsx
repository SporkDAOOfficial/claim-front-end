import { Button, Table, Text, Flex } from "@chakra-ui/react";
import { Epoch } from "../../AdminPage";
import { formatNumber, formatWeiToNumber } from "@/utils/functions";
import SubmitOnChainEpochModal from "../SubmitOnChainEpochModal/SubmitOnChainEpochModal";
import AdminEpochActions from "../AdminEpochActions/AdminEpochActions";
import { useReadContract } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useEffect, useState } from "react";

interface AdminEpochsTableRowProps {
  epoch: Epoch;
}

const AdminEpochsTableRow = ({ epoch }: AdminEpochsTableRowProps) => {
  // State to store contract epoch data with defaults
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
  const [isLoadingContractData, setIsLoadingContractData] = useState(true);

  // Read epoch data from smart contract
  const { data: contractEpochData, error: contractError, isLoading: isContractLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "getEpoch",
    args: [BigInt(epoch.id)],
  });

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

      console.log(`Epoch ${epoch.id} contract data:`, formattedData);
      setContractData(formattedData);
      setIsLoadingContractData(false);
    } else if (contractError) {
      console.error(`Error fetching contract data for epoch ${epoch.id}:`, contractError);
      setIsLoadingContractData(false);
    } else if (!isContractLoading) {
      // If not loading and no data, epoch might not exist on contract
      console.log(`No contract data found for epoch ${epoch.id}`);
      setIsLoadingContractData(false);
    }
  }, [contractEpochData, contractError, isContractLoading, epoch.id]);

  // Check if clawback is possible (has unclaimed tokens)
  const canClawback = parseInt(contractData.unclaimed) > 0;

  // Check if claim deadline has passed
  const isDeadlinePassed = () => {
    const deadline = parseInt(contractData.claimDeadline) * 1000;
    return Date.now() > deadline;
  };

  // Determine the actual status based on contract active state and deadline
  const getEpochStatus = () => {
    if (isLoadingContractData) return { text: "Loading...", color: "gray.500" };
    if (contractError) return { text: "Error", color: "red.500" };
    if (!contractData.active) return { text: "Inactive", color: "orange.500" };
    if (isDeadlinePassed()) return { text: "Expired", color: "red.500" };
    return { text: "Active", color: "green.500" };
  };

  const epochStatus = getEpochStatus();

  return (
    <Table.Row>
      <Table.Cell fontSize="sm">{epoch.id}</Table.Cell>
      <Table.Cell fontSize="sm">{epoch.name}</Table.Cell>
      <Table.Cell fontFamily="mono" fontSize="xs">
        {epoch.tokenAddress}
      </Table.Cell>
      <Table.Cell fontSize="sm">
        {formatNumber(formatWeiToNumber(contractData.totalClaimed))} /{" "}
        {formatNumber(formatWeiToNumber(epoch.totalAllocation))}
      </Table.Cell>
      <Table.Cell fontSize="sm">
        {new Date(parseInt(epoch.claimDeadline) * 1000).toLocaleString()}
      </Table.Cell>
      <Table.Cell fontSize="sm">{epoch.claimsCount}</Table.Cell>
      <Table.Cell>
        <Text color={epochStatus.color} fontSize="sm">
          {epochStatus.text}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Flex gap="0.5rem" direction="column">
          {contractData.active ? (
            <Button size="xs" disabled>
              {isDeadlinePassed() ? "Epoch Expired" : "Epoch Submitted"}
            </Button>
          ) : (
            <SubmitOnChainEpochModal epoch={epoch} />
          )}
          <AdminEpochActions
            epochId={epoch.id}
            isActive={contractData.active}
            hasUnclaimed={canClawback}
            claimDeadline={contractData.claimDeadline}
          />
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
};

export default AdminEpochsTableRow;