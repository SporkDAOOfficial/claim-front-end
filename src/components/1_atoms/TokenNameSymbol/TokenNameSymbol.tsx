import useGetTokenNameAndSymbol from "@/hooks/useGetTokenNameAndSymbol";
import { Skeleton, Text } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";

interface TokenNameSymbolProps {
  tokenAddress: `0x${string}`;
}

const TokenNameSymbol = ({ tokenAddress }: TokenNameSymbolProps) => {
  const {
    tokenName,
    tokenSymbol,
    isLoading: isLoadingTokenNameAndSymbol,
  } = useGetTokenNameAndSymbol({
    tokenAddress,
  });

  return isLoadingTokenNameAndSymbol ? (
    <Skeleton height="20px" width="10rem" />
  ) : (
    <Tooltip content={tokenAddress as string}>
      <Text cursor="pointer">{`${tokenName} (${tokenSymbol})`}</Text>
    </Tooltip>
  );
};

export default TokenNameSymbol;
