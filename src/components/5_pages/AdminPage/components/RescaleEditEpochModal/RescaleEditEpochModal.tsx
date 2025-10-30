import { Button, Input, Stack, Text, SimpleGrid, Dialog, Portal, CloseButton } from "@chakra-ui/react";
import { useState } from "react";
import { useAccount, useSignMessage, useReadContract } from "wagmi";
import { erc20Abi } from "viem";
import { toaster } from "@/components/ui/toaster";
import type { Epoch } from "../../AdminPage";

export default function RescaleEditEpochModal({ epoch }: { epoch: Epoch }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [decimals, setDecimals] = useState("6");
  const [dryRun, setDryRun] = useState(true);
  const [name, setName] = useState(epoch.name);
  const [totalAllocation, setTotalAllocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect token decimals from the epoch's token contract
  const { data: decimalsResult } = useReadContract({
    address: epoch.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!epoch.tokenAddress },
  });

  if (decimalsResult !== undefined && decimals === "6") {
    // Initialize once when component first loads and default is untouched
    const d = Number(decimalsResult);
    if (!Number.isNaN(d)) {
      // setDecimals in a microtask to avoid setState during render warnings
      queueMicrotask(() => setDecimals(String(d)));
    }
  }

  const callApi = async (body: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/epochs-rescale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      toaster.create({ title: json.message || "Success", type: "success" });
      console.log("Epoch admin API response:", json);
    } catch (e) {
      console.error(e);
      toaster.create({ title: (e as Error).message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescale = async () => {
    if (!address) return toaster.create({ title: "Connect wallet", type: "error" });
    const msg = `Admin epoch rescale ${epoch.id} @ ${Date.now()}`;
    const signature = await signMessageAsync({ message: msg });
    await callApi({
      action: "rescale",
      epochId: epoch.id,
      decimals: Number(decimals),
      dryRun,
      address,
      message: msg,
      signature,
    });
  };

  const handleUpdate = async () => {
    if (!address) return toaster.create({ title: "Connect wallet", type: "error" });
    const msg = `Admin epoch update ${epoch.id} @ ${Date.now()}`;
    const signature = await signMessageAsync({ message: msg });
    const payload: any = { action: "update", epochId: epoch.id, address, message: msg, signature };
    if (name && name !== epoch.name) payload.name = name;
    if (totalAllocation) payload.totalAllocation = totalAllocation; // base units
    await callApi(payload);
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="xs" variant="outline" colorPalette="blue">Edit Epoch</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Fix or Update Epoch #{epoch.id}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="1rem">
                <Text fontSize="xs">Rescale amounts (multiply by 10^decimals). Use dry run to preview first.</Text>
                <SimpleGrid columns={3} gap="0.5rem">
                  <Stack>
                    <Text fontSize="xs">Decimals</Text>
                    <Input size="sm" type="number" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
                  </Stack>
                  <Stack>
                    <Text fontSize="xs">Dry Run</Text>
                    <Input size="sm" type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
                  </Stack>
                </SimpleGrid>
                <Button size="sm" onClick={handleRescale} loading={isSubmitting}>Rescale</Button>

                <Text fontSize="xs">Update fields (leave blank to skip).</Text>
                <Stack>
                  <Text fontSize="xs">Name</Text>
                  <Input size="sm" value={name} onChange={(e) => setName(e.target.value)} />
                </Stack>
                <Stack>
                  <Text fontSize="xs">Total Allocation (base units)</Text>
                  <Input size="sm" placeholder="e.g., 1.00 for 1 USDC" value={totalAllocation} onChange={(e) => setTotalAllocation(e.target.value)} />
                </Stack>
                {/* Active toggle intentionally removed per request */}
                <Button size="sm" variant="outline" onClick={handleUpdate} loading={isSubmitting}>Update</Button>
              </Stack>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}


