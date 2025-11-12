import { ColorModeButton, useColorMode } from "@/components/ui/color-mode";
import { Stack, Text, Image, Box } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRoleCheck } from "@/hooks/useRoleCheck";

const NavBar = () => {
  const router = useRouter();
  const { address } = useAccount();
  const { isAdmin, isLoading } = useRoleCheck(address);
  const { colorMode } = useColorMode();

  return (
    <Box
      w="100%"
      borderBottom="1px solid"
      borderColor={colorMode === "dark" ? "purple.900" : "purple.200"}
      background={
        colorMode === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.8)"
      }
      backdropFilter="blur(10px)"
    >
      <Stack
        maxW="container.xl"
        mx="auto"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        py={{ base: "1rem", md: "1.5rem" }}
        px={{ base: "1rem", md: "1.5rem", lg: "2rem" }}
        gap={{ base: "1rem", md: "2rem" }}
      >
        <Stack direction="row" alignItems="center" gap={{ base: "1rem", md: "2rem" }}>
          <a href="https://ethdenver.com" target="_blank" rel="noopener noreferrer">
            <Image
              src="/images/hero/ethdenver_logo.svg"
              alt="ETHDenver"
              height={{ base: "32px", md: "40px" }}
              filter={colorMode === "dark" ? "brightness(1.2)" : "brightness(0.9)"}
            />
          </a>
          <Link href="/">
            <Text
              _hover={{ opacity: 0.8 }}
              fontWeight="bold"
              fontSize={{ base: "xs", md: "sm" }}
              letterSpacing="0.05em"
              textTransform="uppercase"
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #667eea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              <Text as="span" display={{ base: "none", md: "inline" }}>Member Claims</Text>
              <Text as="span" display={{ base: "inline", md: "none" }}>Claims</Text>
            </Text>
          </Link>
        </Stack>

        <Stack direction="row" alignItems="center" gap={{ base: "0.75rem", md: "1.5rem", lg: "2rem" }}>
          {address && !isLoading && isAdmin && (
            <Link href="/admin">
              <Text
                _hover={{
                  textDecoration: "underline",
                  opacity: 0.8
                }}
                fontWeight="bold"
                color={
                  router.pathname === "/admin"
                    ? colorMode === "dark"
                      ? "pink.400"
                      : "pink.600"
                    : colorMode === "dark"
                    ? "white"
                    : "gray.800"
                }
                fontSize="sm"
                letterSpacing="0.05em"
                textTransform="uppercase"
              >
                Admin
              </Text>
            </Link>
          )}
          <ConnectButton />
          <ColorModeButton />
        </Stack>
      </Stack>
    </Box>
  );
};

export default NavBar;
