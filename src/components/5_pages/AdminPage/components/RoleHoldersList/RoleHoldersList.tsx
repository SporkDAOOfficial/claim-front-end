import { Heading, Stack, Text, Table, Badge } from "@chakra-ui/react";
import { useReadContract } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useAccount } from "wagmi";

const RoleHoldersList = () => {
  const { address } = useAccount();

  // Fetch admin addresses
  const { data: adminAddresses, isLoading: isLoadingAdmins } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "getAdminAddresses",
  });

  // Fetch creator addresses
  const { data: creatorAddresses, isLoading: isLoadingCreators } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "getCreatorAddresses",
  });

  // Fetch owner addresses
  const { data: ownerAddresses, isLoading: isLoadingOwners } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "getOwnerAddresses",
  });

  const admins = (adminAddresses as string[]) || [];
  const creators = (creatorAddresses as string[]) || [];
  const owners = (ownerAddresses as string[]) || [];

  const isLoading = isLoadingAdmins || isLoadingCreators || isLoadingOwners;

  // Helper function to format address
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Helper function to check if address is owner
  const isOwner = (addr: string) => {
    return owners.some((owner) => owner.toLowerCase() === addr.toLowerCase());
  };

  return (
    <Stack gap="1.5rem">
      {/* Admin Addresses */}
      <Stack
        border="1px solid"
        borderColor="fg.subtle"
        fontSize="sm"
        p="1rem"
        rounded="md"
        gap="1rem"
      >
        <Stack gap="0.5rem">
          <Heading size="md">Admin Addresses</Heading>
          <Text fontSize="sm" color="fg.muted">
            Addresses with ADMIN_ROLE or DEFAULT_ADMIN_ROLE
          </Text>
        </Stack>

        {isLoading ? (
          <Text fontSize="sm" color="fg.muted">
            Loading...
          </Text>
        ) : (
          <Table.Root size="sm">
            <Table.Body>
              {owners.map((owner, index) => (
                <Table.Row key={`owner-${index}`}>
                  <Table.Cell>
                    <Text fontFamily="mono" fontSize="xs">
                      {owner}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="purple">DEFAULT_ADMIN</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
              {admins.filter(addr => !owners.includes(addr)).map((admin, index) => (
                <Table.Row key={`admin-${index}`}>
                  <Table.Cell>
                    <Text fontFamily="mono" fontSize="xs">
                      {admin}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="blue">ADMIN_ROLE</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
              {owners.length === 0 && admins.length === 0 && (
                <Table.Row>
                  <Table.Cell>
                    <Text fontSize="sm" color="fg.muted">
                      No admin addresses found
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        )}
      </Stack>

      {/* Creator Addresses */}
      <Stack
        border="1px solid"
        borderColor="fg.subtle"
        fontSize="sm"
        p="1rem"
        rounded="md"
        gap="1rem"
      >
        <Stack gap="0.5rem">
          <Heading size="md">Creator Addresses</Heading>
          <Text fontSize="sm" color="fg.muted">
            Addresses with CREATOR_ROLE (excluding DEFAULT_ADMIN_ROLE)
          </Text>
        </Stack>

        {isLoading ? (
          <Text fontSize="sm" color="fg.muted">
            Loading...
          </Text>
        ) : (
          <Table.Root size="sm">
            <Table.Body>
              {creators.filter(addr => !owners.includes(addr)).map((creator, index) => (
                <Table.Row key={`creator-${index}`}>
                  <Table.Cell>
                    <Text fontFamily="mono" fontSize="xs">
                      {creator}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="green">CREATOR_ROLE</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
              {creators.filter(addr => !owners.includes(addr)).length === 0 && (
                <Table.Row>
                  <Table.Cell>
                    <Text fontSize="sm" color="fg.muted">
                      No creator addresses found
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        )}
      </Stack>
    </Stack>
  );
};

export default RoleHoldersList;

