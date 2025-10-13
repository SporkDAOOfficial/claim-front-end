import { Spinner, Stack, Text } from "@chakra-ui/react";

const LoadingPage = () => {
  return (
    <Stack h="80vh" justifyContent="center" alignItems="center" mt="1rem">
      <Stack alignItems="center" gap="1rem">
        <Spinner size="xl" />
        <Text>Loading</Text>
      </Stack>
    </Stack>
  );
};

export default LoadingPage;
