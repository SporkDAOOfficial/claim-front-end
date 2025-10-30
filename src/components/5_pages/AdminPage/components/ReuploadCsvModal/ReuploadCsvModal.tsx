import { Button, Dialog, Portal, CloseButton, Stack, Text, Input } from "@chakra-ui/react";
import { FileUpload } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useAccount, useSignMessage, useReadContract } from "wagmi";
import type { Epoch } from "../../AdminPage";
import { erc20Abi } from "viem";

export default function ReuploadCsvModal({ epoch }: { epoch: Epoch }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(""); // human readable
  const [submitting, setSubmitting] = useState(false);

  const { data: tokenDecimals } = useReadContract({
    address: epoch.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!epoch.tokenAddress },
  });

  const onFile = (d: { acceptedFiles: File[] }) => setFile(d.acceptedFiles?.[0] || null);

  const handleSubmit = async () => {
    if (!address || !file) return;
    setSubmitting(true);
    try {
      const msg = `Admin epoch reupload ${epoch.id} @ ${Date.now()}`;
      const signature = await signMessageAsync({ message: msg });
      // compute total allocation (base units)
      const decimals = tokenDecimals !== undefined ? Number(tokenDecimals) : 18;
      const totalAllocation = amount ? (BigInt(Math.floor(Number(amount) * 10 ** 6)) * (BigInt(10) ** BigInt(decimals - 6))).toString() : "";

      const fd = new FormData();
      fd.append("file", file);
      fd.append("epochId", String(epoch.id));
      fd.append("address", address);
      fd.append("message", msg);
      fd.append("signature", signature);
      if (totalAllocation) fd.append("totalAllocation", totalAllocation);

      const res = await fetch("/api/epochs-reupload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reupload failed");
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="xs" colorPalette="blue" variant="outline">Re-upload CSV</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Re-upload CSV for Epoch #{epoch.id}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="0.75rem">
                <Text fontSize="xs">Upload a corrected CSV (base units). Optionally set a new total allocation (human amount).</Text>
                <FileUpload.Root onFileChange={onFile}>
                  <FileUpload.HiddenInput />
                  <FileUpload.Trigger asChild>
                    <Button size="sm" variant="outline">Choose File</Button>
                  </FileUpload.Trigger>
                  <FileUpload.List />
                </FileUpload.Root>
                <Input size="sm" placeholder="Total allocation (e.g., 6 for 6 USDC)" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={!file}>Submit</Button>
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




