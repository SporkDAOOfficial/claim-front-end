import { createPublicClient, http } from "viem";
import { base, polygon } from "viem/chains";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";

/**
 * Get the chain from environment variables
 */
function getChain() {
  if (process.env.NEXT_PUBLIC_CHAIN_ID === "polygon") {
    return polygon;
  }
  return base;
}

/**
 * Create a public client for backend contract reads
 */
function createClient() {
  const chain = getChain();
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Check if an address has a specific role on the contract
 */
export async function hasRole(roleBytes: string, address: string): Promise<boolean> {
  if (!memContractAddress || !address) {
    return false;
  }

  const client = createClient();
  
  try {
    const result = await client.readContract({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "hasRole",
      args: [roleBytes as `0x${string}`, address as `0x${string}`],
    });

    return Boolean(result);
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
}

/**
 * Get the role hash from the contract
 */
export async function getRoleHash(roleName: "ADMIN_ROLE" | "CREATOR_ROLE" | "DEFAULT_ADMIN_ROLE"): Promise<string | null> {
  if (!memContractAddress) {
    return null;
  }

  const client = createClient();
  
  try {
    const result = await client.readContract({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: roleName,
    });

    return result as string;
  } catch (error) {
    console.error(`Error getting ${roleName}:`, error);
    return null;
  }
}

/**
 * Check if an address has admin or owner role
 */
export async function isAdmin(address: string): Promise<boolean> {
  const adminRoleHash = await getRoleHash("ADMIN_ROLE");
  const ownerRoleHash = await getRoleHash("DEFAULT_ADMIN_ROLE");

  if (!adminRoleHash || !ownerRoleHash) {
    return false;
  }

  const hasAdminRole = await hasRole(adminRoleHash, address);
  const hasOwnerRole = await hasRole(ownerRoleHash, address);

  return hasAdminRole || hasOwnerRole;
}

/**
 * Check if an address has admin or owner role
 */
export async function isCreator(address: string): Promise<boolean> {
    const creatorRoleHash = await getRoleHash("CREATOR_ROLE");
  
    if (!creatorRoleHash) {
      return false;
    }

    const hasCreatorRole = await hasRole(creatorRoleHash, address);
  
    return true;
  }

