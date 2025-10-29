import AppLayout from "@/components/4_layouts/AppLayout/AppLayout";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { system } from "@/theme/chakraTheme";
import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
  Theme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";
import { UnicornAutoConnect, unicornConnector } from "@unicorn.eth/autoconnect";
import "@rainbow-me/rainbowkit/styles.css";
import { getChainFromEnv } from "@/utils/functions";
import { Analytics } from "@vercel/analytics/next"

// Create config function that gets called at runtime
const createWagmiConfig = () => {
  const chain = getChainFromEnv();

    // Map chain ID to Thirdweb chain name
  const getChainName = () => {
    const chainMap: Record<number, string> = {
      8453: 'base',
      137: 'polygon',
      1: 'mainnet',
      42161: 'arbitrum',
      10: 'optimism',
    };
    return chainMap[chain.id] || 'polygon';
  };
  const chainName = getChainName ();
  console.log("Chain Name:",  chainName);  

  if (process.env.NODE_ENV === "development") {
    const config = createConfig({
      chains: [chain],
      connectors: [
        injected({
          target: 'metaMask',
          shimDisconnect: true,
        }),
        walletConnect({
          projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
          showQrModal: true,
        }),
        // Add Unicorn connector directly in connectors array
        unicornConnector({
          chains: [chain],
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
          factoryAddress: process.env.NEXT_PUBLIC_THIRDWEB_FACTORY_ADDRESS || "0xD771615c873ba5a2149D5312448cE01D677Ee48A",
          debug: true,
          defaultChain: chainName,
        }),
      ],
      transports: {
        [chain.id]: http(),
      } as Record<number, ReturnType<typeof http>>,
      ssr: true,
    });
    
    return config;
  } else {
    const config = getDefaultConfig({
      appName: "SporkDAO Patronage Claims",
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
      chains: [chain],
      ssr: true,
    });
    
    // For production with getDefaultConfig, push the connector after
    config.connectors.push(
      unicornConnector({
        chains: [chain],
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
        factoryAddress: process.env.NEXT_PUBLIC_THIRDWEB_FACTORY_ADDRESS || "0xD771615c873ba5a2149D5312448cE01D677Ee48A",
        defaultChain: chainName,
        debug: false,
      })
    );
    
    return config;
  }
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
          <UnicornAutoConnect 
            clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID} 
            factoryAddress={process.env.NEXT_PUBLIC_THIRDWEB_FACTORY_ADDRESS}
            defaultChain="polygon"
            debug={true}
            timeout={30000}
            onSuccess={() => console.log('🦄 Unicorn wallet auto-connected!')}
            onError={(err) => console.error('❌ Unicorn auto-connect failed:', err)}
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