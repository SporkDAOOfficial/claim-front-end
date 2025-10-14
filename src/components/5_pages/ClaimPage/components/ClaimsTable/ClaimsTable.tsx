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
        <Table.Row>
          <Table.ColumnHeader>Epoch</Table.ColumnHeader>
          <Table.ColumnHeader>Token Address</Table.ColumnHeader>
          <Table.ColumnHeader>Claim Amount</Table.ColumnHeader>
          <Table.ColumnHeader>Claim Deadline</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader>Action</Table.ColumnHeader>
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
