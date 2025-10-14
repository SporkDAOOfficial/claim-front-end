import { Table } from "@chakra-ui/react";
import { Epoch } from "../../AdminPage";
import AdminEpochsTableRow from "./AdminEpochsTableRow";

interface AdminEpochsTableProps {
  epochs: Epoch[];
}

const AdminEpochsTable = ({ epochs }: AdminEpochsTableProps) => {
  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>ID</Table.ColumnHeader>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader>Token Address</Table.ColumnHeader>
          <Table.ColumnHeader>Total Claims</Table.ColumnHeader>
          <Table.ColumnHeader>Claim Deadline</Table.ColumnHeader>
          <Table.ColumnHeader>Addresses</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader>Action</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {epochs.map((epoch: Epoch, index: number) => (
          <AdminEpochsTableRow key={index} epoch={epoch} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default AdminEpochsTable;
