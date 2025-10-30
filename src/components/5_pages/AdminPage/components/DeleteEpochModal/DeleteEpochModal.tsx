import { Button, Dialog, Portal, CloseButton, Stack, Text } from "@chakra-ui/react";
import { useAccount, useSignMessage } from "wagmi";
import { toaster } from "@/components/ui/toaster";
import type { Epoch } from "../../AdminPage";

export default function DeleteEpochModal({ epoch, disabled }: { epoch: Epoch; disabled?: boolean; }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleDelete = async () => {
    if (!address) {
      toaster.create({ title: "Connect wallet", type: "error" });
      return;
    }
    try {
      const message = `Admin epoch delete ${epoch.id} @ ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/epochs-rescale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", epochId: epoch.id, address, message, signature }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      toaster.create({ title: `Epoch ${epoch.id} deleted`, type: "success" });
      window.location.reload();
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="xs" colorPalette="red" variant="outline" disabled={disabled}>Delete Epoch</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete Epoch #{epoch.id}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="0.75rem">
                <Text fontSize="sm">This will remove this epoch and all associated claims from the database.</Text>
                <Text fontSize="xs">Name: {epoch.name}</Text>
                <Text fontSize="xs">Token: {epoch.tokenAddress}</Text>
                <Button size="sm" colorPalette="red" onClick={handleDelete}>Confirm Delete</Button>
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




