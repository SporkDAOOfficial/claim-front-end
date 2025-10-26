import { Skeleton, Text } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";

interface TokenNameSymbolProps {
  tokenAddress: `0x${string}`;
}

const TokenNameSymbol = ({ tokenAddress }: TokenNameSymbolProps) => {
  // Fetch token name from token address contract
  const { data: tokenNameResult, isLoading: isLoadingTokenName } =
    useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "name",
      query: { enabled: !!tokenAddress },
    });

  // Fetch token name from token address contract
  const { data: tokenSymbolResult, isLoading: isLoadingTokenSymbol } =
    useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
      query: { enabled: !!tokenAddress },
    });

  return isLoadingTokenName || isLoadingTokenSymbol ? (
    <Skeleton height="20px" width="10rem" />
  ) : (
    <Tooltip content={tokenAddress as string}>
      <Text cursor="pointer">{`${tokenNameResult} (${tokenSymbolResult})`}</Text>
    </Tooltip>
  );
};

export default TokenNameSymbol;
