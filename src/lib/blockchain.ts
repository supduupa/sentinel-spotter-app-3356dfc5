import { ethers } from 'ethers';

// Scroll Sepolia Network Configuration
export const SCROLL_SEPOLIA_CONFIG = {
  chainId: 534351,
  chainIdHex: '0x8274f',
  chainName: 'Scroll Sepolia',
  rpcUrls: ['https://sepolia-rpc.scroll.io'],
  blockExplorerUrls: ['https://sepolia.scrollscan.com'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Contract ABI (minimal interface for our functions)
export const CONTRACT_ABI = [
  'function submitReport(bytes32 reportHash) external returns (bool)',
  'function getRewards(address user) external view returns (uint256)',
  'function getReportCount(address user) external view returns (uint256)',
  'function getUserReports(address user) external view returns (bytes32[])',
  'function isReportSubmitted(bytes32 reportHash) external view returns (bool)',
  'function rewardPerReport() external view returns (uint256)',
  'function totalReportsSubmitted() external view returns (uint256)',
  'event ReportSubmitted(address indexed reporter, bytes32 indexed reportHash, uint256 timestamp, uint256 rewardEarned)',
];

// Deployed contract address on Scroll Sepolia
export const DEFAULT_CONTRACT_ADDRESS = '0xf8e81D47203A594245E36C48e151709F0C19fBe8';

/**
 * Check if a valid contract is configured
 */
export function isContractConfigured(): boolean {
  const address = getContractAddress();
  return ethers.isAddress(address);
}

/**
 * Get the contract address from environment or default
 */
export function getContractAddress(): string {
  // Check for environment variable first
  const envAddress = import.meta.env.VITE_SCROLL_CONTRACT_ADDRESS;
  if (envAddress && ethers.isAddress(envAddress)) {
    return envAddress;
  }
  return DEFAULT_CONTRACT_ADDRESS;
}

/**
 * Check if MetaMask or another web3 wallet is available
 */
export function isWalletAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

/**
 * Request wallet connection and return the connected address
 */
export async function connectWallet(): Promise<string | null> {
  if (!isWalletAvailable()) {
    throw new Error('No Web3 wallet detected. Please install MetaMask.');
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0] || null;
  } catch (error) {
    if ((error as { code?: number }).code === 4001) {
      throw new Error('Wallet connection rejected by user.');
    }
    throw error;
  }
}

/**
 * Get the current chain ID
 */
export async function getCurrentChainId(): Promise<number> {
  if (!isWalletAvailable()) {
    throw new Error('No Web3 wallet detected');
  }

  const chainIdHex = await window.ethereum!.request({ method: 'eth_chainId' });
  return parseInt(chainIdHex as string, 16);
}

/**
 * Switch to Scroll Sepolia network
 */
export async function switchToScrollSepolia(): Promise<boolean> {
  if (!isWalletAvailable()) {
    throw new Error('No Web3 wallet detected');
  }

  try {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SCROLL_SEPOLIA_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError) {
    // Chain not added yet, try to add it
    if ((switchError as { code?: number }).code === 4902) {
      try {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SCROLL_SEPOLIA_CONFIG.chainIdHex,
              chainName: SCROLL_SEPOLIA_CONFIG.chainName,
              rpcUrls: SCROLL_SEPOLIA_CONFIG.rpcUrls,
              blockExplorerUrls: SCROLL_SEPOLIA_CONFIG.blockExplorerUrls,
              nativeCurrency: SCROLL_SEPOLIA_CONFIG.nativeCurrency,
            },
          ],
        });
        return true;
      } catch (addError) {
        throw new Error('Failed to add Scroll Sepolia network');
      }
    }
    throw switchError;
  }
}

/**
 * Get an ethers provider connected to the wallet
 */
export function getProvider(): ethers.BrowserProvider | null {
  if (!isWalletAvailable()) {
    return null;
  }
  return new ethers.BrowserProvider(window.ethereum!);
}

/**
 * Get a signer for the connected wallet
 */
export async function getSigner(): Promise<ethers.Signer | null> {
  const provider = getProvider();
  if (!provider) {
    return null;
  }
  return provider.getSigner();
}

/**
 * Get the contract instance
 */
export async function getContract(): Promise<ethers.Contract | null> {
  const signer = await getSigner();
  if (!signer) {
    return null;
  }

  const contractAddress = getContractAddress();
  if (!isContractConfigured()) {
    console.warn('Contract address not configured');
    return null;
  }

  return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
}

/**
 * Get a read-only contract instance (no signer needed)
 */
export function getReadOnlyContract(): ethers.Contract | null {
  if (!isContractConfigured()) {
    return null;
  }

  const contractAddress = getContractAddress();
  const provider = new ethers.JsonRpcProvider(SCROLL_SEPOLIA_CONFIG.rpcUrls[0]);
  return new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
}

/**
 * Hash report data for on-chain submission
 * Only non-personal data is hashed for privacy
 */
export function hashReportData(reportData: {
  reportId: string;
  date: string;
  location: string;
  timestamp: number;
}): string {
  const dataToHash = JSON.stringify({
    reportId: reportData.reportId,
    date: reportData.date,
    location: reportData.location,
    timestamp: reportData.timestamp,
  });
  
  return ethers.keccak256(ethers.toUtf8Bytes(dataToHash));
}

/**
 * Submit a report to the blockchain
 */
export async function submitReportToBlockchain(reportHash: string): Promise<{
  txHash: string;
  success: boolean;
}> {
  const contract = await getContract();
  if (!contract) {
    throw new Error('Contract not available. Please connect your wallet.');
  }

  // Ensure we're on the right network
  const chainId = await getCurrentChainId();
  if (chainId !== SCROLL_SEPOLIA_CONFIG.chainId) {
    await switchToScrollSepolia();
  }

  try {
    const tx = await contract.submitReport(reportHash);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      success: true,
    };
  } catch (error) {
    console.error('Blockchain submission error:', error);
    throw error;
  }
}

/**
 * Get rewards for a wallet address
 */
export async function getWalletRewards(address: string): Promise<{
  rewardsWei: bigint;
  rewardsFormatted: string;
  reportCount: number;
}> {
  const contract = getReadOnlyContract();
  if (!contract) {
    return {
      rewardsWei: BigInt(0),
      rewardsFormatted: '0',
      reportCount: 0,
    };
  }

  try {
    const [rewards, count] = await Promise.all([
      contract.getRewards(address),
      contract.getReportCount(address),
    ]);

    return {
      rewardsWei: rewards,
      rewardsFormatted: ethers.formatEther(rewards),
      reportCount: Number(count),
    };
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return {
      rewardsWei: BigInt(0),
      rewardsFormatted: '0',
      reportCount: 0,
    };
  }
}

/**
 * Get the current reward per report
 */
export async function getRewardPerReport(): Promise<string> {
  const contract = getReadOnlyContract();
  if (!contract) {
    return '10'; // Default value
  }

  try {
    const reward = await contract.rewardPerReport();
    return ethers.formatEther(reward);
  } catch (error) {
    return '10';
  }
}

/**
 * Format a transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get the block explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `${SCROLL_SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
}

// Extend window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
