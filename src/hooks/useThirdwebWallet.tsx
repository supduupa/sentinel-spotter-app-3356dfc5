import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain, useReadContract, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { getGalamseyContract, scrollSepolia, formatRewardPoints } from "@/lib/thirdweb";
import { keccak256, toBytes } from "thirdweb/utils";
import { useCallback, useMemo } from "react";

export interface ThirdwebWalletState {
  isConnected: boolean;
  address: string | null;
  isCorrectNetwork: boolean;
  rewards: {
    rewardsWei: bigint;
    rewardsFormatted: string;
    reportCount: number;
  };
}

export function useThirdwebWallet() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const { mutateAsync: sendTransaction, isPending: isSubmitting } = useSendTransaction();

  const contract = getGalamseyContract();
  const isCorrectNetwork = activeChain?.id === scrollSepolia.id;

  // Read rewards from contract
  const { data: rewards, refetch: refetchRewards } = useReadContract({
    contract,
    method: "getRewards",
    params: account?.address ? [account.address] : undefined,
    queryOptions: {
      enabled: !!account?.address && isCorrectNetwork,
    },
  });

  const { data: reportCount, refetch: refetchReportCount } = useReadContract({
    contract,
    method: "getReportCount",
    params: account?.address ? [account.address] : undefined,
    queryOptions: {
      enabled: !!account?.address && isCorrectNetwork,
    },
  });

  // Read reward per report
  const { data: rewardPerReport } = useReadContract({
    contract,
    method: "rewardPerReport",
    params: [],
    queryOptions: {
      enabled: isCorrectNetwork,
    },
  });

  // Safe value extractors
  const getRewardsValue = (): bigint => {
    if (rewards === undefined || rewards === null) return BigInt(0);
    if (typeof rewards === "bigint") return rewards;
    return BigInt(0);
  };

  const getReportCountValue = (): number => {
    if (reportCount === undefined || reportCount === null) return 0;
    if (typeof reportCount === "bigint") return Number(reportCount);
    return 0;
  };

  const getRewardPerReportValue = (): bigint => {
    if (rewardPerReport === undefined || rewardPerReport === null) return BigInt(10 * 1e18);
    if (typeof rewardPerReport === "bigint") return rewardPerReport;
    return BigInt(10 * 1e18);
  };

  // Switch to Scroll Sepolia
  const switchNetwork = useCallback(async () => {
    try {
      await switchChain(scrollSepolia);
      return true;
    } catch (error) {
      console.error("Failed to switch network:", error);
      return false;
    }
  }, [switchChain]);

  // Refresh rewards
  const refreshRewards = useCallback(async () => {
    await Promise.all([refetchRewards(), refetchReportCount()]);
  }, [refetchRewards, refetchReportCount]);

  // Hash report data
  const hashReportData = useCallback((data: {
    reportId: string;
    date: string;
    location: string;
    timestamp: number;
  }): `0x${string}` => {
    const dataToHash = JSON.stringify({
      reportId: data.reportId,
      date: data.date,
      location: data.location,
      timestamp: data.timestamp,
    });
    return keccak256(toBytes(dataToHash));
  }, []);

  // Submit report to blockchain
  const submitReportToBlockchain = useCallback(async (reportHash: `0x${string}`): Promise<{
    txHash: string;
    success: boolean;
  }> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    if (!isCorrectNetwork) {
      const switched = await switchNetwork();
      if (!switched) {
        throw new Error("Please switch to Scroll Sepolia network");
      }
    }

    const transaction = prepareContractCall({
      contract,
      method: "submitReport",
      params: [reportHash],
    });

    const result = await sendTransaction(transaction);
    
    return {
      txHash: result.transactionHash,
      success: true,
    };
  }, [account, isCorrectNetwork, switchNetwork, contract, sendTransaction]);

  const state = useMemo<ThirdwebWalletState>(() => ({
    isConnected: !!account,
    address: account?.address || null,
    isCorrectNetwork,
    rewards: {
      rewardsWei: getRewardsValue(),
      rewardsFormatted: formatRewardPoints(getRewardsValue()),
      reportCount: getReportCountValue(),
    },
  }), [account, isCorrectNetwork, rewards, reportCount]);

  return {
    ...state,
    switchNetwork,
    refreshRewards,
    hashReportData,
    submitReportToBlockchain,
    isSubmitting,
    rewardPerReport: formatRewardPoints(getRewardPerReportValue()),
  };
}
