import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Link2, AlertCircle, Coins, ChevronDown } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WalletConnectProps {
  variant?: 'button' | 'card' | 'compact';
  showRewards?: boolean;
  className?: string;
}

export function WalletConnect({ 
  variant = 'button', 
  showRewards = true,
  className = '' 
}: WalletConnectProps) {
  const {
    isConnected,
    address,
    isCorrectNetwork,
    isConnecting,
    isWalletAvailable,
    rewards,
    error,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isWalletAvailable) {
    if (variant === 'card') {
      return (
        <Card className={`border-warning/30 ${className}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-warning">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">MetaMask Required</p>
                <p className="text-sm text-muted-foreground">
                  Install MetaMask to earn crypto rewards
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
            >
              Install MetaMask
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => window.open('https://metamask.io/download/', '_blank')}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Install MetaMask
      </Button>
    );
  }

  if (!isConnected) {
    if (variant === 'card') {
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
                  Earn rewards for environmental reports
                </p>
              </div>
            </div>
            <Button
              className="w-full gradient-primary"
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Button
        variant={variant === 'compact' ? 'outline' : 'default'}
        size={variant === 'compact' ? 'sm' : 'default'}
        className={className}
        onClick={connect}
        disabled={isConnecting}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  // Connected state
  if (!isCorrectNetwork) {
    return (
      <Button
        variant="warning"
        size={variant === 'compact' ? 'sm' : 'default'}
        className={className}
        onClick={switchNetwork}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Switch to Scroll Sepolia
      </Button>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`border-success/30 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <Link2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium">{formatAddress(address!)}</p>
                <Badge variant="outline" className="text-xs">
                  Scroll Sepolia
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
          
          {showRewards && (
            <div className="bg-accent/50 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Your Rewards</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {rewards.rewardsFormatted}
                </span>
                <span className="text-sm text-muted-foreground">ETH</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {rewards.reportCount} report{rewards.reportCount !== 1 ? 's' : ''} submitted
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact dropdown for header
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={variant === 'compact' ? 'sm' : 'default'} className={className}>
          <Wallet className="w-4 h-4 mr-2" />
          {formatAddress(address!)}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Scroll Sepolia
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showRewards && (
          <>
            <div className="px-2 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Rewards Earned</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{rewards.rewardsFormatted}</span>
                <span className="text-xs text-muted-foreground">ETH</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {rewards.reportCount} report{rewards.reportCount !== 1 ? 's' : ''}
              </p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
