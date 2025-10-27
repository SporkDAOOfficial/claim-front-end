import { Skeleton, Text } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";
import * as React from "react";

interface TokenNameSymbolProps {
  tokenAddress: `0x${string}`;
  showDecimals?: boolean;
  onDecimalsFetched?: (decimals: number) => void;
}

const TokenNameSymbol = ({ tokenAddress, showDecimals = false, onDecimalsFetched }: TokenNameSymbolProps) => {
  // Fetch token name from token address contract
  const { data: tokenNameResult, isLoading: isLoadingTokenName } =
    useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "name",
      query: { enabled: !!tokenAddress },
    });

  // Fetch token symbol from token address contract
  const { data: tokenSymbolResult, isLoading: isLoadingTokenSymbol } =
    useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
      query: { enabled: !!tokenAddress },
    });

  // Fetch token decimals
  const { data: tokenDecimalsResult, isLoading: isLoadingTokenDecimals } =
    useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
      query: { enabled: !!tokenAddress },
    });

  // Call callback when decimals are fetched
  React.useEffect(() => {
    if (tokenDecimalsResult !== undefined && onDecimalsFetched) {
      onDecimalsFetched(Number(tokenDecimalsResult));
    }
  }, [tokenDecimalsResult, onDecimalsFetched]);

  const decimals = tokenDecimalsResult ? Number(tokenDecimalsResult) : 18;

  return isLoadingTokenName || isLoadingTokenSymbol || (showDecimals && isLoadingTokenDecimals) ? (
    <Skeleton height="20px" width="10rem" />
  ) : (
    <Tooltip content={tokenAddress as string}>
      <Text cursor="pointer" color="gray.300" _hover={{ color: "pink.400" }}>
        {`${tokenNameResult} (${tokenSymbolResult})${showDecimals ? ` [${decimals} decimals]` : ""}`}
      </Text>
    </Tooltip>
  );
};

export default TokenNameSymbol;
