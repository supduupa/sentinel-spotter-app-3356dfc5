import { ConnectButton, useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain, useReadContract } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, AlertCircle, Coins, Trophy } from "lucide-react";
import { thirdwebClient, scrollSepolia, getGalamseyContract, formatRewardPoints } from "@/lib/thirdweb";

interface ThirdwebWalletConnectProps {
  variant?: "button" | "card" | "compact";
  showRewards?: boolean;
  className?: string;
}

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
];

export function ThirdwebWalletConnect({
  variant = "button",
  showRewards = true,
  className = "",
}: ThirdwebWalletConnectProps) {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const isCorrectNetwork = activeChain?.id === scrollSepolia.id;

  // Read rewards from contract
  const contract = getGalamseyContract();
  const { data: rewards, isLoading: rewardsLoading } = useReadContract({
    contract,
    method: "getRewards",
    params: account?.address ? [account.address] : undefined,
    queryOptions: {
      enabled: !!account?.address && isCorrectNetwork,
    },
  });

  const { data: reportCount } = useReadContract({
    contract,
    method: "getReportCount",
    params: account?.address ? [account.address] : undefined,
    queryOptions: {
      enabled: !!account?.address && isCorrectNetwork,
    },
  });

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      await switchChain(scrollSepolia);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // Safe reward formatting
  const getRewardsValue = (): bigint => {
    if (rewards === undefined || rewards === null) return BigInt(0);
    if (typeof rewards === "bigint") return rewards;
    if (typeof rewards === "boolean") return BigInt(0);
    return BigInt(0);
  };

  const getReportCountValue = (): number => {
    if (reportCount === undefined || reportCount === null) return 0;
    if (typeof reportCount === "bigint") return Number(reportCount);
    if (typeof reportCount === "boolean") return 0;
    return 0;
  };

  // If not connected, show connect button
  if (!account) {
    if (variant === "card") {
      return (
        <Card className={`border-primary/30 ${className}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Connect Wallet</p>
                <p className="text-sm text-muted-foreground">
                  Earn reward points for environmental reports
                </p>
              </div>
            </div>
            <ConnectButton
              client={thirdwebClient}
              wallets={wallets}
              chain={scrollSepolia}
              connectButton={{
                className: "!w-full !bg-primary !text-primary-foreground !rounded-md !py-2 !font-medium hover:!opacity-90",
                label: "Connect MetaMask",
              }}
              connectModal={{
                size: "compact",
                title: "Connect Wallet",
                showThirdwebBranding: false,
              }}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <ConnectButton
        client={thirdwebClient}
        wallets={wallets}
        chain={scrollSepolia}
        connectButton={{
          className: `!bg-primary !text-primary-foreground !rounded-md !py-2 !px-4 !font-medium hover:!opacity-90 ${className}`,
          label: variant === "compact" ? "Connect" : "Connect Wallet",
        }}
        connectModal={{
          size: "compact",
          title: "Connect Wallet",
          showThirdwebBranding: false,
        }}
      />
    );
  }

  // Connected but wrong network
  if (!isCorrectNetwork) {
    return (
      <Button
        variant="destructive"
        size={variant === "compact" ? "sm" : "default"}
        className={className}
        onClick={handleSwitchNetwork}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Switch to Scroll Sepolia
      </Button>
    );
  }

  // Connected and on correct network
  if (variant === "card") {
    return (
      <Card className={`border-success/30 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <Wallet className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium">{formatAddress(account.address)}</p>
                <Badge variant="outline" className="text-xs">
                  Scroll Sepolia
                </Badge>
              </div>
            </div>
            <ConnectButton
              client={thirdwebClient}
              wallets={wallets}
              chain={scrollSepolia}
              detailsButton={{
                className: "!bg-transparent !p-0",
                render: () => (
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                ),
              }}
            />
          </div>

          {showRewards && (
            <div className="bg-accent/50 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Your Reward Points</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {rewardsLoading ? "..." : formatRewardPoints(getRewardsValue())}
                </span>
                <span className="text-sm text-muted-foreground">points</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getReportCountValue()} report{getReportCountValue() !== 1 ? "s" : ""} submitted
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact variant for header
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showRewards && (
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md">
          <Coins className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-primary">
            {rewardsLoading ? "..." : formatRewardPoints(getRewardsValue())} pts
          </span>
        </div>
      )}
      <ConnectButton
        client={thirdwebClient}
        wallets={wallets}
        chain={scrollSepolia}
        detailsButton={{
          className: "!bg-secondary !text-secondary-foreground !rounded-md !py-1.5 !px-3 !text-sm !font-medium",
        }}
        connectModal={{
          size: "compact",
          title: "Connect Wallet",
          showThirdwebBranding: false,
        }}
      />
    </div>
  );
}
