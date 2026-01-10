import { useState, useEffect, useCallback } from 'react';
import {
  isWalletAvailable,
  connectWallet,
  getCurrentChainId,
  switchToScrollSepolia,
  getWalletRewards,
  SCROLL_SEPOLIA_CONFIG,
} from '@/lib/blockchain';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  rewards: {
    rewardsWei: bigint;
    rewardsFormatted: string;
    reportCount: number;
  };
  error: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  isCorrectNetwork: false,
  isConnecting: false,
  rewards: {
    rewardsWei: BigInt(0),
    rewardsFormatted: '0',
    reportCount: 0,
  },
  error: null,
};

export function useWallet() {
  const [state, setState] = useState<WalletState>(() => initialState);

  const updateRewards = useCallback(async (address: string) => {
    const rewards = await getWalletRewards(address);
    setState((prev) => ({ ...prev, rewards }));
  }, []);

  const checkNetwork = useCallback(async () => {
    if (!isWalletAvailable()) return false;
    try {
      const chainId = await getCurrentChainId();
      const isCorrect = chainId === SCROLL_SEPOLIA_CONFIG.chainId;
      setState((prev) => ({ ...prev, isCorrectNetwork: isCorrect }));
      return isCorrect;
    } catch {
      return false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isWalletAvailable()) {
      setState((prev) => ({
        ...prev,
        error: 'Please install MetaMask to connect your wallet.',
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const address = await connectWallet();
      if (address) {
        const isCorrect = await checkNetwork();
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address,
          isCorrectNetwork: isCorrect,
          isConnecting: false,
        }));
        await updateRewards(address);
        return address;
      }
      return null;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
      return null;
    }
  }, [checkNetwork, updateRewards]);

  const switchNetwork = useCallback(async () => {
    try {
      await switchToScrollSepolia();
      setState((prev) => ({ ...prev, isCorrectNetwork: true, error: null }));
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to switch network',
      }));
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState(() => initialState);
  }, []);

  const refreshRewards = useCallback(async () => {
    if (state.address) {
      await updateRewards(state.address);
    }
  }, [state.address, updateRewards]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!isWalletAvailable()) return;

      try {
        const accounts = await window.ethereum!.request({
          method: 'eth_accounts',
        }) as string[];

        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          const isCorrect = await checkNetwork();
          setState((prev) => ({
            ...prev,
            isConnected: true,
            address,
            isCorrectNetwork: isCorrect,
          }));
          await updateRewards(address);
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    };

    checkExistingConnection();
  }, [checkNetwork, updateRewards]);

  // Listen for account and network changes
  useEffect(() => {
    if (!isWalletAvailable()) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountsList = accounts as string[];
      if (accountsList.length === 0) {
        disconnect();
      } else if (accountsList[0] !== state.address) {
        const newAddress = accountsList[0];
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address: newAddress,
        }));
        await updateRewards(newAddress);
      }
    };

    const handleChainChanged = () => {
      // Reload the page on chain change as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum!.on('accountsChanged', handleAccountsChanged);
    window.ethereum!.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum!.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.address, disconnect, updateRewards]);

  return {
    ...state,
    isWalletAvailable: isWalletAvailable(),
    connect,
    disconnect,
    switchNetwork,
    refreshRewards,
  };
}
