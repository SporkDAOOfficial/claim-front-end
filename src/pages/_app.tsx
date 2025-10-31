import AppLayout from "@/components/4_layouts/AppLayout/AppLayout";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { system } from "@/theme/chakraTheme";
import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import {
  darkTheme,
  RainbowKitProvider,
  Theme,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { walletConnectWallet, metaMaskWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";
import { UnicornAutoConnect, unicornConnector } from "@unicorn.eth/autoconnect";
import { useConnect } from 'wagmi';
import "@rainbow-me/rainbowkit/styles.css";
import { getChainFromEnv } from "@/utils/functions";
import { Analytics } from "@vercel/analytics/next";
import dynamic from 'next/dynamic';

// Import UnicornAutoConnect dynamically to avoid SSR issues
const UnicornAutoConnectClient = dynamic(
  () => import("@unicorn.eth/autoconnect").then(mod => ({
    default: mod.UnicornAutoConnect
  })),
  { ssr: false }
);



// Create config function that gets called at runtime
const chain = getChainFromEnv();
console.log("Chain:",  chain);
const createWagmiConfig = () => {
    // Map chain ID to Thirdweb chain name
  const getChainName = () => {
    const chainMap: Record<number, string> = {
      8453: 'base',
      137: 'polygon',
      1: 'mainnet'
    };
    return chainMap[chain.id] || 'polygon';
  };
  const chainName = getChainName ();
  console.log("Chain Name:",  chainName);


    const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';
    const rkConnectors = connectorsForWallets(
      [
        {
          groupName: 'Recommended',
          wallets: [walletConnectWallet, metaMaskWallet, injectedWallet],
        },
      ],
      { appName: 'SporkDAO Patronage Claims', projectId }
    );

    const connectors = [
      ...rkConnectors,
    ];

    // Only add Unicorn connector if environment variables are set
    if (process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID) {
      connectors.push(
        unicornConnector({
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
          factoryAddress: process.env.NEXT_PUBLIC_THIRDWEB_FACTORY_ADDRESS || "0xD771615c873ba5a2149D5312448cE01D677Ee48A",
          defaultChain: chain.id,
        })
      );
    }

    const config = createConfig({
      chains: [chain],
      connectors,
      transports: {
        [chain.id]: http(),
      } as Record<number, ReturnType<typeof http>>,
      ssr: true,
    });

    return config;

};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rainbowKitTheme: Theme = darkTheme({
  accentColor: "#A3CFFF",
  accentColorForeground: "black",
});

// Create config once and reuse it
const wagmiConfig = createWagmiConfig();

export default function App({ Component, pageProps }: AppProps) {

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme}>
          <UnicornAutoConnectClient
            debug={true}
            onConnect={(wallet) => console.log('✅ Unicorn wallet connected:', wallet)}
            onError={(error) => console.error('❌ Unicorn connection error:', error)}
          />
          <ChakraProvider value={system}>
            <ColorModeProvider>
              <AppLayout>
                <Component {...pageProps} />
              </AppLayout>
            </ColorModeProvider>
          </ChakraProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}