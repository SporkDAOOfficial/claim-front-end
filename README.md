# SporkDAO Patronage Claims Frontend

Next.js + RainbowKit/Wagmi app with optional Unicorn wallet auto-connect.

## Prerequisites

- Node.js 20+ (NVM recommended)
- Environment variables set in `.env.local`:

```bash
NEXT_PUBLIC_WC_PROJECT_ID=...
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...
NEXT_PUBLIC_THIRDWEB_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_CHAIN="base" # or polygon, mainnet, etc
```

## Install

Because `@unicorn.eth/autoconnect` currently declares peer dependencies for React 18 while this app uses React 19, you may need to bypass peer resolution. Two options:

### npm (recommended here)

```bash
npm install --legacy-peer-deps
```

If you already ran install and hit ERESOLVE, re-run with the flag:

```bash
npm ci --legacy-peer-deps || npm install --legacy-peer-deps
```

### Yarn Classic

Yarn 1 ignores peer dependency failures by default. Simply run:

```bash
yarn install
```

If you prefer strict resolution with Yarn Berry/Modern, configure `packageExtensions` accordingly or fall back to `npm install --legacy-peer-deps`.

## Development

```bash
npm run dev
# or
yarn dev
```

App runs at http://localhost:3000.

## Build

```bash
npm run build
```

## Notes on Unicorn Wallet

- Unicorn is required by product requirements.
- The package exports runtime APIs compatible with React 19, but its peer deps target React 18, hence the install flag above.
- We add a small local type augmentation at `src/types/unicorn-autoconnect.d.ts` to expose `unicornConnector` in TypeScript.

## Tech Stack

- Next.js 15
- React 19
- RainbowKit / Wagmi v2
- Prisma
- Chakra UI

## Troubleshooting

- Install errors (ERESOLVE): use `npm install --legacy-peer-deps`.
- Types complaining about `unicornConnector`: ensure `src/types/unicorn-autoconnect.d.ts` exists and `tsconfig.json` includes `**/*.d.ts` (default here).
