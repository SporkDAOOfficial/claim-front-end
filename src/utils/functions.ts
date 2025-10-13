import { ADMIN_ADDRESSES } from "./consts";

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
