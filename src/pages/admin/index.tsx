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
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toaster } from "@/components/ui/toaster";

export default function Admin() {
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const { register, watch, reset } = useForm();

  const handleFileChange = async (details: { acceptedFiles: File[] }) => {
    const newFile = details.acceptedFiles[0] || null;
    setFile(newFile);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const tokenAddress = watch("tokenAddress");
    const totalAllocation = watch("totalAllocation");
    const claimDeadline = watch("claimDeadline");

    // Convert datetime-local to Unix timestamp (UTC)
    const claimDeadlineTimestamp = claimDeadline
      ? Math.floor(new Date(claimDeadline).getTime() / 1000).toString()
      : null;

    if (file && tokenAddress && totalAllocation && claimDeadlineTimestamp) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tokenAddress", tokenAddress);
        formData.append("totalAllocation", totalAllocation);
        formData.append("claimDeadline", claimDeadlineTimestamp);

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
      console.error("Missing required fields or file");
    }
  };

  return (
    <Stack mt="1rem">
      <Stack
        border="1px solid"
        borderColor="fg.subtle"
        p="1rem"
        rounded="md"
        w="30%"
        gap="1rem"
      >
        <Stack>
          <Heading>Create Epoch</Heading>
        </Stack>
        <Separator />
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
        <Separator />
        {file && (
          <Stack gap="1rem">
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
              <Button onClick={handleSubmit} loading={submitting}>
                Submit
              </Button>
            </Flex>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
