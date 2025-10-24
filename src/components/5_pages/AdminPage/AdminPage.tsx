import { Heading, Separator, Stack, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { isAdmin } from "@/utils/functions";
import LoadingPage from "@/components/1_atoms/LoadingPage/LoadingPage";
import AdminEpochsTable from "./components/AdminEpochsTable/AdminEpochsTable";

import AdminActions from "./components/AdminActions/AdminActions";
import TokenClawback from "./components/TokenClawback/TokenClawback";
import UserEligibilityCheck from "./components/UserEligibilityCheck/UserEligibilityCheck";
import UploadCsv from "./components/UploadCsv/UploadCsv";


export interface Epoch {
  id: number;
  name: string;
  description: string | null;
  tokenAddress: string;
  totalAllocation: string;
  claimDeadline: string;
  merkleRoot: string;
  isActive: boolean;
  createdAt: Date;
  claimsCount: number;
  updatedAt: Date;
}

const AdminPage = () => {
  const [epochs, setEpochs] = useState<Epoch[]>([]);
  const [loadingEpochs, setLoadingEpochs] = useState(false);

  const { register, watch, reset } = useForm();
  const { address, isConnected } = useAccount();

  const fetchEpochs = async () => {
    setLoadingEpochs(true);
    try {
      const response = await fetch("/api/epochs");
      const result = await response.json();
      if (response.ok) {
        setEpochs(result.epochs);
      } else {
        console.error("Error fetching epochs:", result.error);
      }
    } catch (error) {
      console.error("Error calling epochs API:", error);
    } finally {
      setLoadingEpochs(false);
    }
  };

  useEffect(() => {
    if (address && isAdmin(address)) {
      fetchEpochs();
    }
  }, [address]);

  if (!address || !isAdmin(address) || !isConnected) {
    return <></>;
  }

  if (loadingEpochs) {
    return <LoadingPage />;
  }

  return (
    <Stack gap="2rem">
      {/* Create Epoch and Epochs Table Section */}
      <Stack gap="1rem">
        <Heading>Epoch Management</Heading>
        <Stack direction="row" gap="2rem" align="flex-start">
          {/* Create Epoch Form */}
          <Stack gap="1rem">
            <Text fontWeight="semibold" fontSize="lg">Create New Epoch</Text>
            <Stack
              border="1px solid"
              borderColor="fg.subtle"
              fontSize="sm"
              p="1rem"
              rounded="md"
              gap="2rem"
              direction="row"
              w={file ? "60rem" : "30rem"}
              h="22rem"
            >
              <Stack gap="2rem" w="30rem">
                <Stack gap="0.5rem">
                  <Text fontWeight="semibold">Upload CSV</Text>
                  <Text fontSize="xs" color="fg.muted">
                    Upload a CSV file to create a new airdrop epoch. This will
                    generate a Merkle tree for efficient on-chain verification and
                    allow eligible users to claim their tokens.
                  </Text>
                  <Text fontSize="xs" color="fg.muted" mt="0.5rem">
                    <strong>CSV Format Requirements:</strong>
                  </Text>
                  <Text fontSize="xs" color="fg.muted" ml="1rem">
                    • <strong>address:</strong> Ethereum wallet address (0x format)
                  </Text>
                  <Text fontSize="xs" color="fg.muted" ml="1rem">
                    • <strong>amount:</strong> Token amount in wei (smallest unit)
                  </Text>
                </Stack>
                <Flex>
                  <FileUpload.Root
                    key={uploadKey}
                    onFileChange={handleFileChange}
                    colorPalette="blue"
                  >
                    <FileUpload.HiddenInput />
                    <FileUpload.Trigger asChild>
                      <Button variant="outline" size="sm">
                        <HiUpload /> Upload file
                      </Button>
                    </FileUpload.Trigger>
                    <FileUpload.List />
                  </FileUpload.Root>
                </Flex>
              </Stack>
              {file && (
                <Stack gap="1rem" w="30rem" justifyContent="space-between">
                  <Stack gap="1.5rem">
                    <Field.Root>
                      <Field.Label>Campaign Name</Field.Label>
                      <Input size="sm" {...register("name")} />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Token Address</Field.Label>
                      <Input size="sm" {...register("tokenAddress")} />
                    </Field.Root>
                    <Stack direction="row" gap="1rem">
                      <Field.Root>
                        <Field.Label>Total Allocation</Field.Label>
                        <Input
                          size="sm"
                          type="number"
                          step="0.000001"
                          {...register("totalAllocation")}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Claim Deadline</Field.Label>
                        <Input
                          size="sm"
                          placeholder="2025-01-01T12:00"
                          type="datetime-local"
                          {...register("claimDeadline")}
                        />
                      </Field.Root>
                    </Stack>
                  </Stack>
                  <Flex justifyContent="flex-end">
                    <Button
                      onClick={handleSubmit}
                      loading={submitting}
                      disabled={
                        !address ||
                        !isConnected ||
                        watch("name") === "" ||
                        watch("tokenAddress") === "" ||
                        watch("totalAllocation") === "" ||
                        watch("claimDeadline") === ""
                      }
                      size="sm"
                      colorPalette="blue"
                    >
                      Submit
                    </Button>
                  </Flex>
                </Stack>
              )}
            </Stack>
          </Stack>

          {/* Epochs Table */}
          <Stack gap="1rem" flex="1" minW="40rem">
            <Text fontWeight="semibold" fontSize="lg">Existing Epochs</Text>
            {loadingEpochs ? (
              <Text>Loading epochs...</Text>
            ) : (
              <AdminEpochsTable epochs={epochs} />
            )}
          </Stack>
        </Stack>
      </Stack>

      <Separator />

      {/* Admin Actions Section */}
      <AdminActions />

      <Separator />

      {/* Token-based Clawback Section */}
      <TokenClawback />
    </Stack>
  );
};

export default AdminPage;
