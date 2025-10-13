import { ColorModeButton } from "@/components/ui/color-mode";
import { Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaOctopusDeploy } from "react-icons/fa";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NavBar = () => {
  const router = useRouter();

  return (
    <Stack
      w="100%"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      py="1rem"
    >
      <Link href="/">
        <Stack
          direction="row"
          alignItems="center"
          gap="1rem"
          justifyContent="space-between"
        >
          <Icon
            size="xl"
            color={router.pathname === "/" ? "cyan.300" : undefined}
          >
            <FaOctopusDeploy />
          </Icon>
        </Stack>
      </Link>

      <Stack direction="row" alignItems="center" gap="2rem">
        <Link href="/claim">
          <Text _hover={{ textDecoration: "underline" }} fontWeight="bold">
            Claim
          </Text>
        </Link>
        <Link href="/admin">
          <Text _hover={{ textDecoration: "underline" }} fontWeight="bold">
            Admin
          </Text>
        </Link>
        <ConnectButton />
        <ColorModeButton />
      </Stack>
    </Stack>
  );
};

export default NavBar;
