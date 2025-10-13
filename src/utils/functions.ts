import { ADMIN_ADDRESSES } from "./consts";

export const isAdmin = (address: string) => {
  return ADMIN_ADDRESSES.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
};
