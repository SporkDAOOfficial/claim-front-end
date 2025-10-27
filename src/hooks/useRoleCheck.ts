import { useReadContract } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";

export const useRoleCheck = (address?: string) => {
  // First, get the role constants from the contract
  const { data: adminRoleHash, isLoading: isAdminRoleLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "ADMIN_ROLE",
    query: {
      enabled: true,
    },
  });

  const { data: creatorRoleHash, isLoading: isCreatorRoleLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "CREATOR_ROLE",
    query: {
      enabled: true,
    },
  });

  const { data: ownerRoleHash, isLoading: isOwnerRoleLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "DEFAULT_ADMIN_ROLE",
    query: {
      enabled: true,
    },
  });

  // Check if address has admin role
  const { data: hasAdminRole, isLoading: isAdminLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "hasRole",
    args: address && adminRoleHash ? [adminRoleHash as `0x${string}`, address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!adminRoleHash,
    },
  });

  // Check if address has creator role
  const { data: hasCreatorRole, isLoading: isCreatorLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "hasRole",
    args: address && creatorRoleHash ? [creatorRoleHash as `0x${string}`, address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!creatorRoleHash,
    },
  });

  // Check if address has DEFAULT_ADMIN_ROLE (full admin/owner)
  const { data: hasOwnerRole, isLoading: isOwnerLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "hasRole",
    args: address && ownerRoleHash ? [ownerRoleHash as `0x${string}`, address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!ownerRoleHash,
    },
  });

  return {
    // ADMIN_ROLE or DEFAULT_ADMIN_ROLE
    isAdmin: (hasAdminRole as boolean) || (hasOwnerRole as boolean) || false,
    // CREATOR_ROLE or DEFAULT_ADMIN_ROLE
    isCreator: (hasCreatorRole as boolean) || (hasOwnerRole as boolean) || false,
    // Only DEFAULT_ADMIN_ROLE
    isOwner: (hasOwnerRole as boolean) || false,
    isLoading: isAdminRoleLoading || isCreatorRoleLoading || isOwnerLoading || isAdminLoading || isCreatorLoading || isOwnerLoading,
  };
};
