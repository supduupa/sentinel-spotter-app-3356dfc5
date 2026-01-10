import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ExternalLink, CheckCircle, PartyPopper } from 'lucide-react';
import { getExplorerUrl, formatTxHash } from '@/lib/blockchain';

interface RewardConfirmationProps {
  txHash: string;
  rewardAmount: string;
  onDone?: () => void;
}

export function RewardConfirmation({ 
  txHash, 
  rewardAmount = '10',
  onDone 
}: RewardConfirmationProps) {
  const explorerUrl = getExplorerUrl(txHash);

  return (
    <Card className="border-success/30 shadow-soft overflow-hidden">
      <div className="bg-gradient-to-r from-success/10 to-primary/10 p-4">
        <div className="flex items-center justify-center gap-2 text-success">
          <PartyPopper className="w-6 h-6" />
          <span className="font-display font-bold text-lg">Reward Earned!</span>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <Coins className="w-8 h-8 text-success" />
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-foreground">
              {rewardAmount}
            </span>
            <span className="text-lg text-muted-foreground">ETH</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Testnet tokens credited to your wallet
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Transaction</span>
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1 text-success" />
              Confirmed
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono">{formatTxHash(txHash)}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => window.open(explorerUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mb-4"
        >
          View on Scroll Explorer
          <ExternalLink className="w-3 h-3" />
        </a>

        {onDone && (
          <Button onClick={onDone} className="w-full gradient-primary">
            Continue
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
