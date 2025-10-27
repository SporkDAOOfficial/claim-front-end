import { Flex, Theme } from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import Head from "next/head";

interface StandaloneLayoutProps {
  children: React.ReactNode;
}

const StandaloneLayout: React.FC<StandaloneLayoutProps> = ({ children }) => {
  const { colorMode } = useColorMode();

  return (
    <>
      <Head>
        <title>SporkDAO Patronage Claims</title>
        <meta name="description" content="Claim your member patronage tokens from previous years" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster />
      <Theme appearance={colorMode} suppressHydrationWarning>
        <Flex
          flexDirection="column"
          minHeight="100vh"
          px={{
            base: "1rem",
            md: "1.5rem",
            lg: "2rem",
          }}
        >
          <Flex display="flex" flexDirection="column" flex="1">
            {children}
          </Flex>
        </Flex>
      </Theme>
    </>
  );
};

export default StandaloneLayout;

