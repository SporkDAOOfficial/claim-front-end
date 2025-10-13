import { ColorModeButton } from "@/components/ui/color-mode";
import { Icon, Stack } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaOctopusDeploy } from "react-icons/fa";

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
        <Stack direction="row" alignItems="center" gap="1rem">
          <Icon
            size="xl"
            color={router.pathname === "/" ? "cyan.300" : undefined}
          >
            <FaOctopusDeploy />
          </Icon>
        </Stack>
      </Link>
      <Stack direction="row" alignItems="center" gap="2rem">
        <ColorModeButton />
      </Stack>
    </Stack>
  );
};

export default NavBar;
