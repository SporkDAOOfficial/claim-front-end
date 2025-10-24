import { useReadContract } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";

export const useRoleCheck = (address?: string) => {
  // Check if address has admin role
  const { data: hasAdminRole, isLoading: isAdminLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "hasRole",
    args: address ? ["0x0000000000000000000000000000000000000000000000000000000000000000", address as `0x${string}`] : undefined, // DEFAULT_ADMIN_ROLE
    query: {
      enabled: !!address,
    },
  });

  // Check if address has creator role
  const { data: hasCreatorRole, isLoading: isCreatorLoading } = useReadContract({
    address: memContractAddress as `0x${string}`,
    abi: memAbi,
    functionName: "hasRole",
    args: address ? ["0x0000000000000000000000000000000000000000000000000000000000000001", address as `0x${string}`] : undefined, // CREATOR_ROLE
    query: {
      enabled: !!address,
    },
  });

  return {
    isAdmin: hasAdminRole as boolean || false,
    isCreator: hasCreatorRole as boolean || false,
    isLoading: isAdminLoading || isCreatorLoading,
  };
};
