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
import { UnicornAutoConnect } from "@unicorn.eth/autoconnect";
import "@rainbow-me/rainbowkit/styles.css";
import { getChainFromEnv } from "@/utils/functions";

// Create config function that gets called at runtime
const createWagmiConfig = () => {
  const chain = getChainFromEnv();

  return process.env.NODE_ENV === "development"
    ? createConfig({
        chains: [chain],
        connectors: [
          injected({
            shimDisconnect: false,
          }),
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
            showQrModal: true,
          }),
        ],
        transports: {
          [chain.id]: http(),
        } as Record<number, ReturnType<typeof http>>,
        ssr: true,
      })
    : getDefaultConfig({
        appName: "MEM",
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
        chains: [chain],
        ssr: true,
      });
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
          <ChakraProvider value={system}>
            <ColorModeProvider>
              <AppLayout>
                <Component {...pageProps} />
                <UnicornAutoConnect
                  clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || ""}
                  factoryAddress={
                    process.env.NEXT_PUBLIC_THIRDWEB_FACTORY_ADDRESS || ""
                  }
                  defaultChain="polygon"
                />
              </AppLayout>
            </ColorModeProvider>
          </ChakraProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
