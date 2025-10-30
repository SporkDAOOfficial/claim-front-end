import { Heading, Separator, Stack, Text, Flex, Container, Box, Image } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ClaimWithEpoch } from "@/pages/api/claims";
import LoadingPage from "@/components/1_atoms/LoadingPage/LoadingPage";
import { getAddress } from "viem";
import ClaimsTable from "./components/ClaimsTable/ClaimsTable";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SEO from "@/components/1_atoms/SEO/SEO";
import Link from "next/link";

// Add global styles for animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }
    @keyframes floatReverse {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(-5deg); }
    }
  `;
  document.head.appendChild(style);
}

const ClaimPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [claims, setClaims] = useState<ClaimWithEpoch[]>([]);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setIsLoading(true);

        if (!address) return;

        const response = await fetch(
          `/api/claims?address=${address ? getAddress(address) : ""}`
        );
        const result = await response.json();

        if (response.ok) {
          setClaims(result.claims);
        } else {
          console.error("Error fetching claims:", result.error);
        }
      } catch (error) {
        console.error("Error calling claims API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, [address]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <SEO />
      {/* Hero Section with Background Image */}
      <Box
        position="relative"
        backgroundImage="url('/images/hero/bg_png.png')"
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        py={{ base: "4rem", md: "6rem", lg: "10rem" }}
        mb={{ base: "2rem", md: "3rem", lg: "4rem" }}
        mx={{
          base: "-1rem",
          md: "-1.5rem",
          lg: "-2rem",
        }}
        px={{
          base: "1rem",
          md: "1.5rem",
          lg: "2rem",
        }}
        overflow="hidden"
        borderBottom="2px solid"
        borderColor="purple.900"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, rgba(10, 10, 15, 0.85) 0%, rgba(26, 10, 31, 0.9) 100%)",
          pointerEvents: "none",
        }}
        _after={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(118, 75, 162, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(102, 126, 234, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(240, 147, 251, 0.08) 0%, transparent 70%)
          `,
          pointerEvents: "none",
        }}
      >
        {/* Floating character decorations - hidden on mobile */}
        <Image
          src="/images/hero/capt_jumping_1.png"
          alt=""
          position="absolute"
          right={{ base: "-10%", md: "5%" }}
          top="15%"
          height={{ base: "0px", md: "150px", lg: "200px" }}
          opacity={0.4}
          animation="float 6s ease-in-out infinite"
          filter="drop-shadow(0 8px 24px rgba(0,0,0,0.2))"
          style={{
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <Image
          src="/images/hero/bg_png.png"
          alt=""
          position="absolute"
          left={{ base: "-10%", md: "8%" }}
          bottom="20%"
          height={{ base: "0px", md: "100px", lg: "150px" }}
          opacity={0.35}
          width={{ base: "0px", md: "80%", lg: "100%" }}
          animation="floatReverse 8s ease-in-out infinite"
          filter="drop-shadow(0 8px 24px rgba(0,0,0,0.2))"
        />
        
        <Container maxW="container.xs" position="relative" zIndex={1} px={0}>
          <Stack gap={{ base: "1rem", md: "1.5rem", lg: "2rem" }} textAlign="center" color="white" alignItems="center">
            {/* SporkDAO Logo */}
            <Image 
              src="/images/hero/SporkDAO_logo.svg" 
              alt="SporkDAO"
              height={{ base: "60px", md: "80px", lg: "100px" }}
              filter="drop-shadow(0 0 30px rgba(240, 147, 251, 0.5)) brightness(1.1)"
            />
            
            <Heading 
              size={{ base: "2xl", md: "3xl", lg: "5xl" }} 
              fontWeight="extrabold"
              letterSpacing="-0.02em"
              textShadow="0 0 40px rgba(118, 75, 162, 0.8)"
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SporkDAO Patronage Claims
            </Heading>
            <Text as="div" fontSize={{ base: "lg", md: "xl", lg: "2xl" }} opacity={0.95} fontWeight="medium" maxW="800px" mx="auto" px={{ base: "1rem", md: 0 }}>
            Claim SporkDAO Member Rewards:
            <Text fontSize={{ base: "md", md: "lg", lg: "xl" }} opacity={0.95} fontWeight="medium" maxW="800px" mx="auto" px={{ base: "1rem", md: 0 }}>
                - $SPORK tokens from previous years at ETHDenver
            </Text>
            <Text fontSize={{ base: "md", md: "lg", lg: "xl" }} opacity={0.95} fontWeight="medium" maxW="800px" mx="auto" px={{ base: "1rem", md: 0 }}>
                - Patronage distributions for staked $SPORK
            </Text>
            </Text>
            <Text fontSize={{ base: "xs", md: "sm", lg: "md" }} opacity={0.6} letterSpacing="0.1em" textTransform="uppercase">
            For more information about SporkDAO and Patronage claims, visit <Link href="https://sporkdao.org" target="_blank" rel="noopener noreferrer"><Text as="span" color="pink.400" fontWeight="bold">SporkDAO.org</Text></Link>
            </Text>
          </Stack>
        </Container>
        
        {/* Geometric accent elements */}
        <Box
          position="absolute"
          right="5%"
          bottom="15%"
          width="8px"
          height="120px"
          background="linear-gradient(180deg, rgba(240, 147, 251, 0.5) 0%, transparent 100%)"
          transform="rotate(-45deg)"
        />
        <Box
          position="absolute"
          left="8%"
          top="25%"
          width="6px"
          height="80px"
          background="linear-gradient(180deg, rgba(102, 126, 234, 0.6) 0%, transparent 100%)"
          transform="rotate(45deg)"
        />
      </Box>

      <Box py={{ base: "2rem", md: "3rem" }} pb={{ base: "3rem", md: "6rem" }}>
        <Container maxW="container.xl">
          <Stack gap={{ base: "2rem", md: "3rem" }}>
            {/* Wallet Connection Section */}
            {!isConnected && (
            <Box
              border="1px solid"
              borderColor="purple.700"
              borderRadius="lg"
              p={{ base: "2rem", md: "3rem", lg: "4rem" }}
              background="rgba(0, 0, 0, 0.4)"
              backdropFilter="blur(20px)"
              boxShadow="0 8px 32px rgba(118, 75, 162, 0.3), 0 0 0 1px rgba(102, 126, 234, 0.1)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: "-50px",
                right: "-50px",
                width: "200px",
                height: "200px",
                background: "radial-gradient(circle, rgba(240, 147, 251, 0.15) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
              _after={{
                content: '""',
                position: "absolute",
                bottom: "-30px",
                left: "-30px",
                width: "150px",
                height: "150px",
                background: "radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
              _hover={{
                borderColor: "purple.600",
                boxShadow: "0 8px 48px rgba(118, 75, 162, 0.4), 0 0 0 1px rgba(102, 126, 234, 0.2)",
              }}
            >
              <Flex
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
                gap={{ base: "1.5rem", md: "2rem", lg: "2.5rem" }}
                position="relative"
                zIndex={1}
              >
                <Stack gap={{ base: "1rem", md: "1.5rem" }} textAlign="center">
                  <Heading 
                    size={{ base: "xl", md: "2xl" }}
                    style={{
                      background: "linear-gradient(135deg, #f093fb 0%, #667eea 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Connect Your Wallet
                  </Heading>
                  <Text fontSize={{ base: "md", md: "lg" }} color="gray.300" maxW="550px" fontWeight="medium" px={{ base: "1rem", md: 0 }}>
                    Connect your Ethereum wallet to view and claim your membership patronage tokens from previous ETH Denver events
                  </Text>
                </Stack>
                <Box transform={{ base: "scale(1)", md: "scale(1.05)", lg: "scale(1.1)" }}>
                  <ConnectButton />
                </Box>
              </Flex>
            </Box>
          )}

          {/* Connected but no claims or no address */}
          {isConnected && address && claims.length === 0 && (
            <Box
              border="1px solid"
              borderColor="purple.700"
              borderRadius="lg"
              p="3rem"
              background="rgba(0, 0, 0, 0.3)"
              backdropFilter="blur(20px)"
              boxShadow="0 8px 32px rgba(118, 75, 162, 0.2)"
            >
              <Flex
                justifyContent="center"
                alignItems="center"
                minH="20rem"
                flexDirection="column"
                gap="1rem"
              >
                <Text fontSize="lg" color="gray.400">
                  No claims available for this wallet address
                </Text>
              </Flex>
            </Box>
          )}

          {/* Claims Table */}
          {isConnected && address && claims.length > 0 && (
            <Stack gap={{ base: "2rem", md: "3rem" }}>
              <Stack direction={{ base: "column", sm: "row" }} justifyContent={{ base: "flex-start", sm: "space-between" }} alignItems={{ base: "flex-start", sm: "center" }} flexWrap="wrap" gap="1rem">
                <Heading 
                  size={{ base: "xl", md: "2xl" }}
                  fontWeight="bold"
                  style={{
                    background: "linear-gradient(135deg, #f093fb 0%, #667eea 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Your Claims
                </Heading>
                <Box
                  background="linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
                  px={{ base: "1.5rem", md: "2rem" }}
                  py={{ base: "0.5rem", md: "0.75rem" }}
                  borderRadius="full"
                  boxShadow="0 4px 20px rgba(118, 75, 162, 0.3)"
                >
                  <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="white">
                    {claims.length} {claims.length === 1 ? "claim" : "claims"} found
                  </Text>
                </Box>
              </Stack>
              <Box
                border="1px solid"
                borderColor="purple.700"
                borderRadius="lg"
                p={{ base: "1rem", md: "1.5rem", lg: "2rem" }}
                background="rgba(0, 0, 0, 0.3)"
                backdropFilter="blur(20px)"
                boxShadow="0 8px 32px rgba(118, 75, 162, 0.2), inset 0 0 0 1px rgba(102, 126, 234, 0.1)"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                  borderRadius: "lg lg 0 0",
                }}
                position="relative"
                overflow="auto"
              >
                <ClaimsTable claims={claims} />
              </Box>
            </Stack>
          )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default ClaimPage;

