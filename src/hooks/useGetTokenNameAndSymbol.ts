import { useReadContract } from "wagmi";

const useGetTokenNameAndSymbol = ({
  tokenAddress,
}: {
  tokenAddress: `0x${string}`;
}) => {
  // Fetch token name from token address contract
  const { data: tokenNameResult, isLoading: isLoadingTokenName } =
    useReadContract({
      address: tokenAddress,
      abi: [
        {
          constant: true,
          inputs: [],
          name: "name",
          outputs: [{ name: "", type: "string" }],
          type: "function",
        },
      ],
      functionName: "name",
      query: { enabled: !!tokenAddress },
    });

  // Fetch token name from token address contract
  const { data: tokenSymbolResult, isLoading: isLoadingTokenSymbol } =
    useReadContract({
      address: tokenAddress,
      abi: [
        {
          constant: true,
          inputs: [],
          name: "symbol",
          outputs: [{ name: "", type: "string" }],
          type: "function",
        },
      ],
      functionName: "symbol",
      query: { enabled: !!tokenAddress },
    });

  return {
    tokenName: tokenNameResult || "",
    tokenSymbol: tokenSymbolResult || "",
    isLoading: isLoadingTokenName || isLoadingTokenSymbol,
  };
};

export default useGetTokenNameAndSymbol;
