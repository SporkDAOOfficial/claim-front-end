export const ADMIN_ADDRESSES = [
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_1 as string,
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_2 as string,
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_3 as string,
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_4 as string,
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_5 as string,
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_6 as string,
].filter(Boolean) as string[];;
