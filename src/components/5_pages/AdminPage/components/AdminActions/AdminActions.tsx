import {
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  SimpleGrid,
} from "@chakra-ui/react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { memAbi } from "@/web3/abis/mem_abi";
import { memContractAddress } from "@/web3/contractAddresses";
import { useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";

const AdminActions = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [adminAddress, setAdminAddress] = useState("");
  const [creatorAddress, setCreatorAddress] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false);
  const [isGrantingCreator, setIsGrantingCreator] = useState(false);
  const [isRevokingAdmin, setIsRevokingAdmin] = useState(false);
  const [isRevokingCreator, setIsRevokingCreator] = useState(false);

  // Emergency recovery
  const {
    writeContract: writeEmergencyRecovery,
    data: recoveryHash,
    isPending: isRecoveryPending,
  } = useWriteContract();

  // Grant admin role
  const {
    writeContract: writeGrantAdmin,
    data: grantAdminHash,
    isPending: isGrantAdminPending,
  } = useWriteContract();

  // Grant creator role
  const {
    writeContract: writeGrantCreator,
    data: grantCreatorHash,
    isPending: isGrantCreatorPending,
  } = useWriteContract();

  // Revoke admin role
  const {
    writeContract: writeRevokeAdmin,
    data: revokeAdminHash,
    isPending: isRevokeAdminPending,
  } = useWriteContract();

  // Revoke creator role
  const {
    writeContract: writeRevokeCreator,
    data: revokeCreatorHash,
    isPending: isRevokeCreatorPending,
  } = useWriteContract();

  // Wait for recovery transaction
  const { isLoading: isRecoveryConfirming, isSuccess: isRecoverySuccess } =
    useWaitForTransactionReceipt({
      hash: recoveryHash,
    });

  // Wait for grant admin transaction
  const { isLoading: isGrantAdminConfirming, isSuccess: isGrantAdminSuccess } =
    useWaitForTransactionReceipt({
      hash: grantAdminHash,
    });

  // Wait for grant creator transaction
  const {
    isLoading: isGrantCreatorConfirming,
    isSuccess: isGrantCreatorSuccess,
  } = useWaitForTransactionReceipt({
    hash: grantCreatorHash,
  });

  // Wait for revoke admin transaction
  const {
    isLoading: isRevokeAdminConfirming,
    isSuccess: isRevokeAdminSuccess,
  } = useWaitForTransactionReceipt({
    hash: revokeAdminHash,
  });

  // Wait for revoke creator transaction
  const {
    isLoading: isRevokeCreatorConfirming,
    isSuccess: isRevokeCreatorSuccess,
  } = useWaitForTransactionReceipt({
    hash: revokeCreatorHash,
  });

  // Handle emergency recovery
  const handleEmergencyRecovery = () => {
    if (!tokenAddress || isRecovering) return;

    setIsRecovering(true);
    writeEmergencyRecovery({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "emergencyTokenRecovery",
      args: [tokenAddress as `0x${string}`],
    });
  };

  // Handle grant admin role
  const handleGrantAdmin = () => {
    if (!adminAddress || isGrantingAdmin) return;

    setIsGrantingAdmin(true);
    writeGrantAdmin({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "grantAdminRole",
      args: [adminAddress as `0x${string}`],
    });
  };

  // Handle grant creator role
  const handleGrantCreator = () => {
    if (!creatorAddress || isGrantingCreator) return;

    setIsGrantingCreator(true);
    writeGrantCreator({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "grantCreatorRole",
      args: [creatorAddress as `0x${string}`],
    });
  };

  // Handle revoke admin role
  const handleRevokeAdmin = () => {
    if (!adminAddress || isRevokingAdmin) return;

    setIsRevokingAdmin(true);
    writeRevokeAdmin({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "revokeAdminRole",
      args: [adminAddress as `0x${string}`],
    });
  };

  // Handle revoke creator role
  const handleRevokeCreator = () => {
    if (!creatorAddress || isRevokingCreator) return;

    setIsRevokingCreator(true);
    writeRevokeCreator({
      address: memContractAddress as `0x${string}`,
      abi: memAbi,
      functionName: "revokeCreatorRole",
      args: [creatorAddress as `0x${string}`],
    });
  };

  // Handle successful recovery
  useEffect(() => {
    if (isRecoverySuccess) {
      setIsRecovering(false);
      setTokenAddress("");
      toaster.create({
        title: "Emergency recovery completed successfully!",
        type: "success",
      });
    }
  }, [isRecoverySuccess]);

  // Handle successful grant admin
  useEffect(() => {
    if (isGrantAdminSuccess) {
      setIsGrantingAdmin(false);
      setAdminAddress("");
      toaster.create({
        title: "Admin role granted successfully!",
        type: "success",
      });
    }
  }, [isGrantAdminSuccess]);

  // Handle successful grant creator
  useEffect(() => {
    if (isGrantCreatorSuccess) {
      setIsGrantingCreator(false);
      setCreatorAddress("");
      toaster.create({
        title: "Creator role granted successfully!",
        type: "success",
      });
    }
  }, [isGrantCreatorSuccess]);

  // Handle successful revoke admin
  useEffect(() => {
    if (isRevokeAdminSuccess) {
      setIsRevokingAdmin(false);
      setAdminAddress("");
      toaster.create({
        title: "Admin role revoked successfully!",
        type: "success",
      });
    }
  }, [isRevokeAdminSuccess]);

  // Handle successful revoke creator
  useEffect(() => {
    if (isRevokeCreatorSuccess) {
      setIsRevokingCreator(false);
      setCreatorAddress("");
      toaster.create({
        title: "Creator role revoked successfully!",
        type: "success",
      });
    }
  }, [isRevokeCreatorSuccess]);

  // Update loading states
  useEffect(() => {
    if (isRecoveryPending || isRecoveryConfirming) {
      setIsRecovering(true);
    } else if (
      !isRecoveryPending &&
      !isRecoveryConfirming &&
      !isRecoverySuccess
    ) {
      setIsRecovering(false);
    }
  }, [isRecoveryPending, isRecoveryConfirming, isRecoverySuccess]);

  useEffect(() => {
    if (isGrantAdminPending || isGrantAdminConfirming) {
      setIsGrantingAdmin(true);
    } else if (
      !isGrantAdminPending &&
      !isGrantAdminConfirming &&
      !isGrantAdminSuccess
    ) {
      setIsGrantingAdmin(false);
    }
  }, [isGrantAdminPending, isGrantAdminConfirming, isGrantAdminSuccess]);

  useEffect(() => {
    if (isGrantCreatorPending || isGrantCreatorConfirming) {
      setIsGrantingCreator(true);
    } else if (
      !isGrantCreatorPending &&
      !isGrantCreatorConfirming &&
      !isGrantCreatorSuccess
    ) {
      setIsGrantingCreator(false);
    }
  }, [isGrantCreatorPending, isGrantCreatorConfirming, isGrantCreatorSuccess]);

  useEffect(() => {
    if (isRevokeAdminPending || isRevokeAdminConfirming) {
      setIsRevokingAdmin(true);
    } else if (
      !isRevokeAdminPending &&
      !isRevokeAdminConfirming &&
      !isRevokeAdminSuccess
    ) {
      setIsRevokingAdmin(false);
    }
  }, [isRevokeAdminPending, isRevokeAdminConfirming, isRevokeAdminSuccess]);

  useEffect(() => {
    if (isRevokeCreatorPending || isRevokeCreatorConfirming) {
      setIsRevokingCreator(true);
    } else if (
      !isRevokeCreatorPending &&
      !isRevokeCreatorConfirming &&
      !isRevokeCreatorSuccess
    ) {
      setIsRevokingCreator(false);
    }
  }, [
    isRevokeCreatorPending,
    isRevokeCreatorConfirming,
    isRevokeCreatorSuccess,
  ]);

  return (
    <Stack>
      <Heading size="lg">Admin Actions</Heading>
      <SimpleGrid columns={2} gap="2rem">
        {/* Emergency Recovery Section */}
        <Stack
          border="1px solid"
          borderColor="fg.subtle"
          fontSize="sm"
          p="1rem"
          rounded="md"
          gap="1rem"
        >
          <Stack gap="0.5rem">
            <Heading size="md">Emergency Token Recovery</Heading>
            <Text fontSize="sm" color="fg.muted">
              Recover tokens from expired epochs that have unclaimed amounts.
              This will transfer all unclaimed tokens back to the contract
              admin.
            </Text>
          </Stack>

          <Field.Root>
            <Field.Label>Token Address</Field.Label>
            <Input
              size="sm"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
          </Field.Root>

          <Flex justifyContent="flex-end">
            <Button
              onClick={handleEmergencyRecovery}
              loading={isRecovering}
              disabled={!tokenAddress || isRecovering}
              colorPalette="red"
              variant="outline"
              size="xs"
            >
              {isRecovering ? "Recovering..." : "Emergency Recovery"}
            </Button>
          </Flex>
        </Stack>

        {/* Role Management Section */}
        <Stack
          border="1px solid"
          borderColor="fg.subtle"
          fontSize="sm"
          p="1rem"
          rounded="md"
          gap="1rem"
        >
          <Stack gap="0.5rem">
            <Heading size="md">Role Management</Heading>
            <Text fontSize="sm" color="fg.muted">
              Grant or revoke admin and creator roles. Admin roles can manage
              epochs and perform emergency operations. Creator roles can create
              new epochs.
            </Text>
          </Stack>

          <Stack direction="row" gap="1rem">
            <Field.Root flex="1">
              <Field.Label>Admin Address</Field.Label>
              <Input
                size="sm"
                placeholder="0x..."
                value={adminAddress}
                onChange={(e) => setAdminAddress(e.target.value)}
              />
            </Field.Root>

            <Field.Root flex="1">
              <Field.Label>Creator Address</Field.Label>
              <Input
                size="sm"
                placeholder="0x..."
                value={creatorAddress}
                onChange={(e) => setCreatorAddress(e.target.value)}
              />
            </Field.Root>
          </Stack>

          <Flex gap="0.5rem" justifyContent="flex-end" wrap="wrap">
            <Button
              onClick={handleGrantAdmin}
              loading={isGrantingAdmin}
              disabled={!adminAddress || isGrantingAdmin}
              colorPalette="blue"
              variant="outline"
              size="xs"
            >
              {isGrantingAdmin ? "Granting..." : "Grant Admin"}
            </Button>

            <Button
              onClick={handleRevokeAdmin}
              loading={isRevokingAdmin}
              disabled={!adminAddress || isRevokingAdmin}
              colorPalette="red"
              variant="outline"
              size="xs"
            >
              {isRevokingAdmin ? "Revoking..." : "Revoke Admin"}
            </Button>

            <Button
              onClick={handleGrantCreator}
              loading={isGrantingCreator}
              disabled={!creatorAddress || isGrantingCreator}
              colorPalette="green"
              variant="outline"
              size="xs"
            >
              {isGrantingCreator ? "Granting..." : "Grant Creator"}
            </Button>

            <Button
              onClick={handleRevokeCreator}
              loading={isRevokingCreator}
              disabled={!creatorAddress || isRevokingCreator}
              colorPalette="orange"
              variant="outline"
              size="xs"
            >
              {isRevokingCreator ? "Revoking..." : "Revoke Creator"}
            </Button>
          </Flex>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
};

export default AdminActions;
