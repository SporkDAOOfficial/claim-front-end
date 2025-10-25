import { ADMIN_ADDRESSES } from "./consts";
import { formatUnits } from "viem";
import { polygon, base } from "wagmi/chains";

export const isAdmin = (address: string) => {
  return ADMIN_ADDRESSES.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
};

export const formatNumber = (amount: string | number) => {
  return parseFloat(amount.toString()).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatWeiToNumber = (
  weiAmount: string | number,
  decimals: number = 18
) => {
  const weiString = weiAmount.toString();
  const formatted = formatUnits(BigInt(weiString), decimals);
  return parseFloat(formatted);
};

export const getChainFromEnv = () => {
  if (process.env.NEXT_PUBLIC_CHAIN_ID === "polygon") {
    return polygon;
  }
  return polygon;
};
