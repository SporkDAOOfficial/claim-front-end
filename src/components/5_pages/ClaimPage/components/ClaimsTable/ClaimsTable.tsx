import { Table } from "@chakra-ui/react";
import ClaimsTableRow from "./ClaimsTableRow";
import { ClaimWithEpoch } from "@/pages/api/claims";

interface ClaimsTableProps {
  claims: ClaimWithEpoch[];
}

const ClaimsTable = ({ claims }: ClaimsTableProps) => {
  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row borderBottom="1px solid" borderColor="purple.800">
          <Table.ColumnHeader color="gray.300" fontWeight="bold" fontSize="xs" letterSpacing="0.05em" textTransform="uppercase">Epoch</Table.ColumnHeader>
          <Table.ColumnHeader color="gray.300" fontWeight="bold" fontSize="xs" letterSpacing="0.05em" textTransform="uppercase">Token</Table.ColumnHeader>
          <Table.ColumnHeader color="gray.300" fontWeight="bold" fontSize="xs" letterSpacing="0.05em" textTransform="uppercase">Claim Amount</Table.ColumnHeader>
          <Table.ColumnHeader color="gray.300" fontWeight="bold" fontSize="xs" letterSpacing="0.05em" textTransform="uppercase">Claim Deadline</Table.ColumnHeader>
          <Table.ColumnHeader color="gray.300" fontWeight="bold" fontSize="xs" letterSpacing="0.05em" textTransform="uppercase">Status</Table.ColumnHeader>
          <Table.ColumnHeader color="gray.300" fontWeight="bold" fontSize="xs" letterSpacing="0.05em" textTransform="uppercase">Action</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {claims.map((claim, index) => (
          <ClaimsTableRow key={index} claim={claim} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default ClaimsTable;
