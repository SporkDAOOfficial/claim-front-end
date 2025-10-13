import { Flex, Theme } from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import NavBar from "@/components/2_molecules/Navbar/NavBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { colorMode } = useColorMode();

  return (
    <>
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
          <NavBar />
          <Flex display="flex" flexDirection="column" flex="1">
            {children}
          </Flex>
          <Flex h="2rem" w="100%" />
        </Flex>
      </Theme>
    </>
  );
};

export default AppLayout;
