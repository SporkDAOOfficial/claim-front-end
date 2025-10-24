import { Heading, Separator, Stack, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { isAdmin } from "@/utils/functions";
import LoadingPage from "@/components/1_atoms/LoadingPage/LoadingPage";
import AdminEpochsTable from "./components/AdminEpochsTable/AdminEpochsTable";
import UserEligibilityCheck from "./components/UserEligibilityCheck/UserEligibilityCheck";
import UploadCsv from "./components/UploadCsv/UploadCsv";
import AdminActions from "./components/AdminActions/AdminActions";
import TokenClawback from "./components/TokenClawback/TokenClawback";

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
      <Heading>Create Epoch</Heading>
      <Stack direction="row" gap="1rem">
        <UploadCsv
          register={register}
          watch={watch}
          reset={reset}
          fetchEpochs={fetchEpochs}
          address={address}
          isConnected={isConnected}
        />
        <UserEligibilityCheck
          watch={watch}
          register={register}
          epochs={epochs}
        />
      </Stack>
      <Separator />
      <Stack gap="1rem">
        <Heading>Created Epochs</Heading>
        {loadingEpochs ? (
          <Text>Loading epochs...</Text>
        ) : (
          <AdminEpochsTable epochs={epochs} />
        )}
      </Stack>
      <AdminActions />
      <TokenClawback />
    </Stack>
  );
};

export default AdminPage;
