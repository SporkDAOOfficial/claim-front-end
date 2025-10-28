import { ADMIN_ADDRESSES } from "./consts";
import { formatUnits } from "viem";
import { polygon, base } from "wagmi/chains";

export const isAdmin = (address: string) => {
  return ADMIN_ADDRESSES.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
};

export const formatNumber = (amount: string | number, decimals?: number) => {
  const num = parseFloat(amount.toString());
  
  // If decimals are specified, use them for formatting
  if (decimals !== undefined) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: Math.min(2, decimals),
      maximumFractionDigits: decimals,
    });
  }
  
  // Default behavior: show 2 decimals
  return num.toLocaleString("en-US", {
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

export const isDeadlinePassed = (deadline: string) => {
  const deadlineTimestamp = parseInt(deadline) * 1000;
  const deadlineDate = new Date(deadlineTimestamp);
  return Date.now() > deadlineDate.getTime();
};
