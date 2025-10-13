import {
  Button,
  Field,
  FileUpload,
  Flex,
  Heading,
  Input,
  Separator,
  Stack,
  Text,
  Table,
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toaster } from "@/components/ui/toaster";
import { useAccount, useSignMessage } from "wagmi";
import { isAdmin } from "@/utils/functions";
import LoadingPage from "@/components/1_atoms/LoadingPage/LoadingPage";

interface Epoch {
  id: number;
  name: string;
  description: string;
  tokenAddress: string;
  totalAllocation: string;
  claimDeadline: string;
  merkleRoot: string;
  isActive: boolean;
  createdAt: string;
  claimsCount: number;
}

const AdminPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [epochs, setEpochs] = useState<Epoch[]>([]);
  const [loadingEpochs, setLoadingEpochs] = useState(false);

  const { register, watch, reset } = useForm();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleFileChange = async (details: { acceptedFiles: File[] }) => {
    const newFile = details.acceptedFiles[0] || null;
    setFile(newFile);
  };

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

  const handleSubmit = async () => {
    setSubmitting(true);
    const tokenAddress = watch("tokenAddress");
    const totalAllocation = watch("totalAllocation");
    const claimDeadline = watch("claimDeadline");

    // Check if wallet is connected
    if (!isConnected || !address) {
      toaster.create({
        title: "Please connect your wallet first",
        type: "error",
      });
      setSubmitting(false);
      return;
    }

    // Convert datetime-local to Unix timestamp (UTC)
    const claimDeadlineTimestamp = claimDeadline
      ? Math.floor(new Date(claimDeadline).getTime() / 1000).toString()
      : null;

    if (file && tokenAddress && totalAllocation && claimDeadlineTimestamp) {
      try {
        // Create message to sign
        const message = `Create Epoch - Token: ${tokenAddress} - Deadline: ${claimDeadlineTimestamp} - Timestamp: ${Date.now()}`;

        // Request signature from user
        const signature = await signMessageAsync({ message });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("tokenAddress", tokenAddress);
        formData.append("totalAllocation", totalAllocation);
        formData.append("claimDeadline", claimDeadlineTimestamp);
        formData.append("signature", signature);
        formData.append("address", address);
        formData.append("message", message);

        const response = await fetch("/api/merkle-tree", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("Full API Response:", result);

        // Check if the response is successful
        if (!response.ok) {
          console.error("API Error:", result);
          alert(`Error: ${result.error || "Unknown error occurred"}`);
          return;
        }

        // Check if epoch data exists in response
        if (!result.epoch) {
          console.error("No epoch data in response:", result);
          alert("Error: No epoch data received from server");
          return;
        }

        const epochId = result.epoch.id;
        const epochDeadline = result.epoch.claimDeadline;
        const epochTokenAddress = result.epoch.tokenAddress;
        const epochTotalAllocation = result.epoch.totalAllocation;
        const merkleRoot = result.merkleTree.root;

        console.log("Epoch ID:", epochId);
        console.log("Epoch Deadline:", epochDeadline);
        console.log("Token Address:", epochTokenAddress);
        console.log("Total Allocation:", epochTotalAllocation);
        console.log("Merkle Root:", merkleRoot);

        toaster.create({
          title: "Epoch created successfully",
          type: "success",
        });

        setFile(null);
        setUploadKey((prev) => prev + 1); // Force FileUpload to remount

        // Reset form fields with explicit values
        reset({
          tokenAddress: "",
          totalAllocation: "",
          claimDeadline: "",
        });

        // Refresh epochs list
        fetchEpochs();
      } catch (error) {
        console.error("Error uploading file:", error);
        toaster.create({
          title: "Error creating epoch",
          type: "error",
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      toaster.create({
        title: "Missing required fields or file",
        type: "error",
      });
    }
  };

  if (address && !isAdmin(address)) {
    return <></>;
  }

  if (loadingEpochs) {
    return <LoadingPage />;
  }

  return (
    <Stack gap="2rem">
      <Heading>Create Epoch</Heading>
      <Stack
        border="1px solid"
        bg="bg.panel"
        fontSize="sm"
        p="1rem"
        rounded="md"
        w="30%"
        gap="1rem"
      >
        <Stack>
          <Text>Upload CSV</Text>
          <Flex>
            <FileUpload.Root key={uploadKey} onFileChange={handleFileChange}>
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
          <Stack gap="1rem">
            <Separator />
            <Stack gap="1rem">
              <Field.Root>
                <Field.Label>Token Address</Field.Label>
                <Input
                  placeholder="0x5432g890..."
                  {...register("tokenAddress")}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Total Allocation</Field.Label>
                <Input placeholder="12000" {...register("totalAllocation")} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Claim Deadline</Field.Label>
                <Input
                  placeholder="2025-01-01T12:00"
                  type="datetime-local"
                  {...register("claimDeadline")}
                />
              </Field.Root>
            </Stack>
            <Separator />
            <Flex justifyContent="flex-end">
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={
                  !address ||
                  !isConnected ||
                  watch("tokenAddress") === "" ||
                  watch("totalAllocation") === "" ||
                  watch("claimDeadline") === ""
                }
              >
                Submit
              </Button>
            </Flex>
          </Stack>
        )}
      </Stack>
      <Separator />
      <Stack gap="1rem">
        <Heading>Created Epochs</Heading>
        {loadingEpochs ? (
          <Text>Loading epochs...</Text>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Token Address</Table.ColumnHeader>
                <Table.ColumnHeader>Total Allocation</Table.ColumnHeader>
                <Table.ColumnHeader>Claim Deadline</Table.ColumnHeader>
                <Table.ColumnHeader>Claims Count</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {epochs.map((epoch) => (
                <Table.Row key={epoch.id}>
                  <Table.Cell>{epoch.id}</Table.Cell>
                  <Table.Cell>{epoch.name}</Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="xs">
                    {epoch.tokenAddress.slice(0, 6)}...
                    {epoch.tokenAddress.slice(-4)}
                  </Table.Cell>
                  <Table.Cell>{epoch.totalAllocation}</Table.Cell>
                  <Table.Cell>
                    {new Date(
                      parseInt(epoch.claimDeadline) * 1000
                    ).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>{epoch.claimsCount}</Table.Cell>
                  <Table.Cell>
                    <Text color={epoch.isActive ? "green.500" : "red.500"}>
                      {epoch.isActive ? "Active" : "Inactive"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(epoch.createdAt).toLocaleDateString()}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Stack>
    </Stack>
  );
};

export default AdminPage;
