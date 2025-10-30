import {
  Button,
  Field,
  FileUpload,
  Flex,
  Input,
  Stack,
  Text,
  Box,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import {
  FieldValues,
  UseFormRegister,
  UseFormReset,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { HiUpload } from "react-icons/hi";
import { parseUnits } from "viem";
import { toaster } from "@/components/ui/toaster";
import { useSignMessage } from "wagmi";
import { erc20Abi } from "viem";
import { useReadContract } from "wagmi";

interface Epoch {
  id: number;
  tokenAddress: string;
  name: string;
}

interface UploadCsvProps {
  register: UseFormRegister<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  reset: UseFormReset<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  fetchEpochs: () => void;
  address: string;
  isConnected: boolean;
  epochs: Epoch[];
}

interface CsvRow {
  address: string;
  amount: string;
}

const UploadCsv = ({
  register,
  watch,
  reset,
  setValue,
  fetchEpochs,
  address,
  isConnected,
  epochs,
}: UploadCsvProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([]);

  const { signMessageAsync } = useSignMessage();

  // Get unique token addresses from epochs
  const uniqueTokenAddresses = useMemo(() => {
    const tokenSet = new Set<string>();
    epochs.forEach((epoch) => {
      if (epoch.tokenAddress) {
        tokenSet.add(epoch.tokenAddress);
      }
    });
    return Array.from(tokenSet);
  }, [epochs]);

  // Get selected token address from form
  const selectedTokenAddress = watch("tokenAddress");

  // Fetch token decimals for the selected token
  const { data: tokenDecimalsResult, error: decimalsError } = useReadContract({
    address: selectedTokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!selectedTokenAddress },
  });

  const handleTokenSelect = (address: string) => {
    setValue("tokenAddress", address);
  };

  // Component to fetch and display token name/symbol for dropdown
  const TokenOption = ({ address }: { address: string }) => {
    const { data: name } = useReadContract({
      address: address as `0x${string}`,
      abi: erc20Abi,
      functionName: "name",
      query: { enabled: !!address },
    });

    const { data: symbol } = useReadContract({
      address: address as `0x${string}`,
      abi: erc20Abi,
      functionName: "symbol",
      query: { enabled: !!address },
    });

    const displayText = name && symbol ? `${name} (${symbol})` : address;

    return (
      <option value={address} onClick={() => handleTokenSelect(address)}>
        {displayText}
      </option>
    );
  };

  const handleFileChange = async (details: { acceptedFiles: File[] }) => {
    const newFile = details.acceptedFiles[0] || null;
    setFile(newFile);

    // Parse and preview CSV data
    if (newFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length > 0) {
          // Parse header to find address and amount columns
          const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
          const addressIndex = header.findIndex((h) => h.includes("address"));
          const amountIndex = header.findIndex((h) => h.includes("amount"));

          if (addressIndex !== -1 && amountIndex !== -1) {
            // Parse data rows (limit to 50 rows for preview)
            const dataRows = lines
              .slice(1, 51)
              .map((line) => {
                const values = line.split(",").map((v) => v.trim());
                return {
                  address: values[addressIndex] || "",
                  amount: values[amountIndex] || "",
                };
              })
              .filter((row) => row.address && row.amount);

            setCsvPreview(dataRows);
          }
        }
      };
      reader.readAsText(newFile);
    } else {
      setCsvPreview([]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const name = watch("name");
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

    // Check if there was an error fetching token decimals
    if (decimalsError) {
      toaster.create({
        title: "Error loading token decimals. Please check the token address.",
        type: "error",
      });
      setSubmitting(false);
      return;
    }

    // Convert totalAllocation from regular number to wei using dynamic decimals
    const decimals = tokenDecimalsResult !== undefined ? Number(tokenDecimalsResult) : undefined;
    const totalAllocationInWei =
      totalAllocation && decimals !== undefined
        ? parseUnits(totalAllocation, decimals).toString()
        : null;

    // Convert datetime-local to Unix timestamp (UTC)
    // datetime-local gives us a string in format "YYYY-MM-DDTHH:mm" in local time
    // new Date() automatically converts this to UTC
    const claimDeadlineTimestamp = claimDeadline
      ? Math.floor(new Date(claimDeadline).getTime() / 1000).toString()
      : null;

    // Log for debugging
    if (claimDeadline && claimDeadlineTimestamp !== null) {
      console.log("Local datetime input:", claimDeadline);
      console.log("UTC timestamp:", claimDeadlineTimestamp);
      console.log(
        "UTC date:",
        new Date(parseInt(claimDeadlineTimestamp!) * 1000).toISOString()
      );
    }

    if (
      file &&
      tokenAddress &&
      totalAllocationInWei &&
      claimDeadlineTimestamp
    ) {
      try {
        // Create message to sign
        const message = `Create Epoch - Token: ${tokenAddress} - Deadline: ${claimDeadlineTimestamp} - Timestamp: ${Date.now()}`;

        // Request signature from user
        const signature = await signMessageAsync({ message });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name || "Epoch");
        formData.append("tokenAddress", tokenAddress);
        formData.append("totalAllocation", totalAllocationInWei);
        formData.append("claimDeadline", claimDeadlineTimestamp);
        formData.append("signature", signature);
        formData.append("address", address);
        formData.append("message", message);

        const response = await fetch("/api/merkle-tree", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

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

        toaster.create({
          title: "Epoch created successfully",
          type: "success",
        });

        setFile(null);
        setUploadKey((prev) => prev + 1); // Force FileUpload to remount

        // Reset form fields with explicit values
        reset({
          name: "",
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

  return (
    <Stack
      border="1px solid"
      borderColor="fg.subtle"
      fontSize="sm"
      p={{ base: "0.75rem", md: "1rem" }}
      rounded="md"
      gap={{ base: "1rem", md: "2rem" }}
      direction={{ base: "column", lg: "row" }}
      w={{ base: "100%", lg: file ? "75rem" : "30rem" }}
      h={{ base: "auto", lg: file ? "32rem" : "22rem" }}
      maxW={{ base: "100%", lg: "75rem" }}
    >
      <Stack
        gap={{ base: "1rem", md: "2rem" }}
        w={{ base: "100%", lg: "30rem" }}
      >
        <Stack gap="0.5rem">
          <Text fontWeight="semibold">Upload CSV</Text>
          <Text fontSize="xs" color="fg.muted">
            Upload a CSV file to create a new airdrop epoch. This will generate
            a Merkle tree for efficient on-chain verification and allow eligible
            users to claim their tokens.
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
        <Stack
          gap={{ base: "1rem", md: "1.5rem" }}
          w={{ base: "100%", lg: "45rem" }}
        >
          <Stack
            direction={{ base: "column", lg: "row" }}
            gap={{ base: "1.5rem", md: "2rem" }}
          >
            <Stack gap="1rem" w={{ base: "100%", lg: "24rem" }}>
              <Field.Root>
                <Field.Label>Campaign Name</Field.Label>
                <Input size="sm" {...register("name")} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Token Address</Field.Label>
                {uniqueTokenAddresses.length > 0 && (
                  <Stack gap="0.5rem" mb="0.5rem">
                    <select
                      onChange={(e) =>
                        e.target.value && handleTokenSelect(e.target.value)
                      }
                      style={{
                        fontSize: "0.875rem",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid",
                        backgroundColor: "var(--chakra-colors-bg)",
                        color: "var(--chakra-colors-fg)",
                      }}
                    >
                      <option value="">
                        Quick select from recent tokens...
                      </option>
                      {uniqueTokenAddresses.map((address) => (
                        <TokenOption key={address} address={address} />
                      ))}
                    </select>
                  </Stack>
                )}
                <Input
                  size="sm"
                  placeholder="0x..."
                  {...register("tokenAddress")}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Total Allocation</Field.Label>
                <Input
                  size="sm"
                  type="number"
                  step="0.000001"
                  placeholder="Enter human-readable amount (e.g., 1.23)"
                  {...register("totalAllocation")}
                />
                {selectedTokenAddress && (
                  <Text fontSize="xs" color="fg.muted" mt="0.25rem">
                    {tokenDecimalsResult !== undefined
                      ? `Using token decimals: ${Number(tokenDecimalsResult)}`
                      : "Fetching token decimals..."}
                  </Text>
                )}
              </Field.Root>

              <Field.Root>
                <Field.Label>Claim Deadline (Local Time)</Field.Label>
                <Input
                  size="sm"
                  type="datetime-local"
                  {...register("claimDeadline")}
                />
              </Field.Root>
            </Stack>

            {/* CSV Preview */}
            {csvPreview.length > 0 && (
              <Stack w={{ base: "100%", lg: "22rem" }} gap="0.5rem">
                <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                  CSV Preview ({csvPreview.length} rows)
                </Text>
                <Box
                  border="1px solid"
                  borderColor="fg.subtle"
                  borderRadius="md"
                  maxH="25rem"
                  overflowY="auto"
                  fontSize="xs"
                >
                  <Stack gap="0">
                    <Flex
                      direction="row"
                      gap="0.5rem"
                      px="0.75rem"
                      py="0.5rem"
                      bg="bg.subtle"
                      position="sticky"
                      top={0}
                      zIndex={1}
                    >
                      <Text fontWeight="bold" flex="1" title="Address">
                        Address
                      </Text>
                      <Text
                        fontWeight="bold"
                        w="10rem"
                        flexShrink={0}
                        title="Amount"
                      >
                        Amount
                      </Text>
                    </Flex>
                    {csvPreview.map((row, index) => (
                      <Flex
                        key={index}
                        direction="row"
                        gap="0.5rem"
                        px="0.75rem"
                        py="0.5rem"
                        borderBottom="1px solid"
                        borderColor="fg.subtle"
                        _hover={{ bg: "bg.subtle" }}
                        alignItems="flex-start"
                      >
                        <Text
                          flex="1"
                          fontFamily="mono"
                          fontSize="xs"
                          wordBreak="break-all"
                          title={row.address}
                        >
                          {row.address}
                        </Text>
                        <Text
                          w="10rem"
                          fontSize="xs"
                          fontFamily="mono"
                          wordBreak="break-all"
                          flexShrink={0}
                          title={row.amount}
                        >
                          {row.amount}
                        </Text>
                      </Flex>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Stack>

          <Flex justifyContent="flex-end" w="100%">
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={
                !address ||
                !isConnected ||
                watch("name") === "" ||
                watch("tokenAddress") === "" ||
                watch("totalAllocation") === "" ||
                watch("claimDeadline") === "" ||
                tokenDecimalsResult === undefined
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
  );
};

export default UploadCsv;
