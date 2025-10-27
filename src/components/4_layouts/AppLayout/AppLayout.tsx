import { Flex, Theme, Box } from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import NavBar from "@/components/2_molecules/Navbar/NavBar";
import SEO from "@/components/1_atoms/SEO/SEO";

interface AppLayoutProps {
  children: React.ReactNode;
  seo?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  };
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, seo }) => {
  const { colorMode } = useColorMode();

  return (
    <>
      <SEO {...seo} />
      <Toaster />
      <Theme appearance={colorMode} suppressHydrationWarning>
        <Box
          minHeight="100vh"
          background="linear-gradient(180deg, #0a0a0f 0%, #1a0a1f 100%)"
          position="relative"
          _before={{
            content: '""',
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(118, 75, 162, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(102, 126, 234, 0.06) 0%, transparent 50%),
              radial-gradient(circle at 50% 20%, rgba(240, 147, 251, 0.05) 0%, transparent 50%)
            `,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <Flex
            flexDirection="column"
            minHeight="100vh"
            position="relative"
            zIndex={1}
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
        </Box>
      </Theme>
    </>
  );
};

export default AppLayout;
