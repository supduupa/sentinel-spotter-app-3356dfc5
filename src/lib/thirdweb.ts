import { createThirdwebClient, defineChain, getContract } from "thirdweb";

// Thirdweb client - uses client ID from environment
export const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "your-client-id",
});

// Scroll Sepolia chain configuration
export const scrollSepolia = defineChain({
  id: 534351,
  name: "Scroll Sepolia",
  rpc: "https://sepolia-rpc.scroll.io",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Scrollscan",
      url: "https://sepolia.scrollscan.com",
    },
  ],
  testnet: true,
});

// Contract address on Scroll Sepolia
export const CONTRACT_ADDRESS = import.meta.env.VITE_SCROLL_CONTRACT_ADDRESS || "0xf8e81D47203A594245E36C48e151709F0C19fBe8";

// Contract ABI for GalamseyReporter
export const CONTRACT_ABI = [
  {
    type: "function",
    name: "submitReport",
    inputs: [{ name: "reportHash", type: "bytes32" }],
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getRewards",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReportCount",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rewardPerReport",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalReportsSubmitted",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ReportSubmitted",
    inputs: [
      { name: "reporter", type: "address", indexed: true },
      { name: "reportHash", type: "bytes32", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "rewardEarned", type: "uint256", indexed: false },
    ],
  },
] as const;

// Get contract instance
export function getGalamseyContract() {
  return getContract({
    client: thirdwebClient,
    chain: scrollSepolia,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
  });
}

// Helper to format reward points (not ETH)
export function formatRewardPoints(rewardsWei: bigint): string {
  // 10^18 wei = 1 point (similar to ETH formatting)
  const points = Number(rewardsWei) / 1e18;
  return points.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Get explorer URL for a transaction
export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.scrollscan.com/tx/${txHash}`;
}

// Format transaction hash for display
export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}
