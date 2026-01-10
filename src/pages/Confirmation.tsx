import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Home, Wallet, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { reportSubmissionSchema, photosSchema } from "@/lib/validations";
import { RewardConfirmation } from "@/components/RewardConfirmation";
import { WalletConnect } from "@/components/WalletConnect";
import { 
  hashReportData, 
  submitReportToBlockchain,
  getRewardPerReport,
  getExplorerUrl,
  formatTxHash,
  getContractAddress,
  DEFAULT_CONTRACT_ADDRESS
} from "@/lib/blockchain";

interface SubmissionState {
  status: 'idle' | 'submitting-db' | 'connecting-wallet' | 'submitting-chain' | 'success' | 'partial-success' | 'error';
  dbSuccess: boolean;
  chainSuccess: boolean;
  txHash: string | null;
  reportId: string | null;
  error: string | null;
}

const Confirmation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const wallet = useWallet();
  const hasSubmittedRef = useRef(false);
  
  const [state, setState] = useState<SubmissionState>({
    status: 'idle',
    dbSuccess: false,
    chainSuccess: false,
    txHash: null,
    reportId: null,
    error: null,
  });
  
  const [rewardAmount, setRewardAmount] = useState('10');

  useEffect(() => {
    // Fetch reward amount
    getRewardPerReport().then(setRewardAmount);
  }, []);

  useEffect(() => {
    // Prevent duplicate submissions in React strict mode
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    submitReport();
  }, []);

  const submitReport = async () => {
    setState(prev => ({ ...prev, status: 'submitting-db' }));
    
    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get data from sessionStorage
      const formData = JSON.parse(sessionStorage.getItem('reportFormData') || '{}');
      const locationData = JSON.parse(sessionStorage.getItem('reportLocation') || '{}');
      const photos = JSON.parse(sessionStorage.getItem('capturedPhotos') || '[]');

      // Validate photos
      const photosValidation = photosSchema.safeParse(photos);
      if (!photosValidation.success) {
        const firstError = photosValidation.error.errors[0];
        throw new Error(firstError.message);
      }

      // Prepare and validate the full submission
      const gpsCoordinates = locationData.coordinates 
        ? { lat: locationData.coordinates[1], lng: locationData.coordinates[0] }
        : null;
      
      const submissionData = {
        date: formData.date,
        location: formData.location,
        description: formData.description,
        gps_coordinates: gpsCoordinates,
        gps_address: locationData.address || null,
        photos: photosValidation.data,
        user_id: user.id,
        wallet_address: wallet.address || null,
      };

      const validationResult = reportSubmissionSchema.safeParse(submissionData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new Error(firstError.message);
      }

      // Insert the validated report
      const { data: report, error } = await supabase
        .from('galamsey_reports')
        .insert([{
          date: validationResult.data.date,
          location: validationResult.data.location,
          description: validationResult.data.description,
          gps_coordinates: validationResult.data.gps_coordinates,
          gps_address: validationResult.data.gps_address,
          photos: validationResult.data.photos,
          user_id: validationResult.data.user_id,
          wallet_address: wallet.address || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        dbSuccess: true, 
        reportId: report.id 
      }));

      // Call AI processing edge function (non-blocking)
      supabase.functions.invoke('process-report', {
        body: { reportId: report.id, description: validationResult.data.description },
      }).catch(err => {
        if (import.meta.env.DEV) console.error('AI processing error:', err);
      });

      // Clear sessionStorage
      sessionStorage.removeItem('reportFormData');
      sessionStorage.removeItem('reportLocation');
      sessionStorage.removeItem('capturedPhotos');

      // Check if contract is deployed
      const contractAddress = getContractAddress();
      const isContractDeployed = contractAddress !== DEFAULT_CONTRACT_ADDRESS;

      // If wallet is connected and contract is deployed, submit to blockchain
      if (wallet.isConnected && wallet.isCorrectNetwork && isContractDeployed) {
        await submitToBlockchain(report.id, formData.date, formData.location);
      } else {
        // Success without blockchain
        setState(prev => ({ ...prev, status: 'success' }));
        toast({
          title: "Success",
          description: "Your report has been submitted successfully!",
        });
      }

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error submitting report:', error);
      }
      setState(prev => ({ 
        ...prev, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to submit report',
      }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const submitToBlockchain = async (reportId: string, date: string, location: string) => {
    setState(prev => ({ ...prev, status: 'submitting-chain' }));

    try {
      // Hash report data (no personal info)
      const reportHash = hashReportData({
        reportId,
        date,
        location,
        timestamp: Date.now(),
      });

      // Submit to blockchain
      const { txHash, success } = await submitReportToBlockchain(reportHash);

      if (success && txHash) {
        // Update database with transaction hash
        await supabase
          .from('galamsey_reports')
          .update({ scroll_tx_hash: txHash })
          .eq('id', reportId);

        setState(prev => ({ 
          ...prev, 
          status: 'success',
          chainSuccess: true,
          txHash,
        }));

        // Refresh wallet rewards
        wallet.refreshRewards();

        toast({
          title: "Report Recorded on Blockchain!",
          description: "You earned crypto rewards for this report.",
        });
      }
    } catch (error) {
      // Partial success - DB worked but blockchain failed
      if (import.meta.env.DEV) {
        console.error('Blockchain submission error:', error);
      }
      setState(prev => ({ 
        ...prev, 
        status: 'partial-success',
        error: error instanceof Error ? error.message : 'Blockchain submission failed',
      }));
      toast({
        title: "Report Submitted",
        description: "Report saved, but blockchain recording failed. You can try again later.",
        variant: "default",
      });
    }
  };

  const handleRetryBlockchain = async () => {
    if (state.reportId) {
      const formData = JSON.parse(sessionStorage.getItem('reportFormData') || '{}');
      await submitToBlockchain(state.reportId, formData.date, formData.location);
    }
  };

  const handleDone = () => {
    navigate("/");
  };

  const isLoading = ['submitting-db', 'connecting-wallet', 'submitting-chain'].includes(state.status);

  const getLoadingMessage = () => {
    switch (state.status) {
      case 'submitting-db':
        return 'Submitting your report...';
      case 'connecting-wallet':
        return 'Connecting wallet...';
      case 'submitting-chain':
        return 'Recording on Scroll blockchain...';
      default:
        return 'Processing...';
    }
  };

  return (
    <MobileContainer>
      <HeaderBar title="Confirmation" />
      
      <main className="p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] animate-fade-in">
        <div className="w-full max-w-md space-y-4">
          {isLoading ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                </div>
                <h2 className="font-display font-bold text-xl mb-2">
                  {state.status === 'submitting-chain' ? 'Recording on Blockchain' : 'Submitting Report'}
                </h2>
                <p className="text-muted-foreground">
                  {getLoadingMessage()}
                </p>
                {state.status === 'submitting-chain' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Please confirm the transaction in your wallet
                  </p>
                )}
              </CardContent>
            </Card>
          ) : state.status === 'success' && state.chainSuccess && state.txHash ? (
            <>
              <RewardConfirmation 
                txHash={state.txHash}
                rewardAmount={rewardAmount}
              />
              <Button 
                size="lg"
                className="w-full h-12 font-semibold gradient-primary hover:opacity-90 transition-opacity"
                onClick={handleDone}
              >
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </>
          ) : state.status === 'success' || state.status === 'partial-success' ? (
            <Card className="shadow-soft border-success/30">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto animate-scale-in">
                    <CheckCircle className="w-12 h-12 text-success" />
                  </div>
                </div>
                <h2 className="font-display font-bold text-xl mb-2 text-success">Report Submitted!</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for helping protect our environment. Your report has been received and will be reviewed by our team.
                </p>
                
                {state.status === 'partial-success' && wallet.isConnected && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-warning-foreground mb-2">
                      Blockchain recording failed. Want to try again to earn rewards?
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRetryBlockchain}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Retry Blockchain
                    </Button>
                  </div>
                )}

                {!wallet.isConnected && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect a wallet to earn crypto rewards for future reports!
                    </p>
                    <WalletConnect variant="compact" showRewards={false} />
                  </div>
                )}

                <Button 
                  size="lg"
                  className="w-full h-12 font-semibold gradient-primary hover:opacity-90 transition-opacity"
                  onClick={handleDone}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-soft border-destructive/30">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </div>
                </div>
                <h2 className="font-display font-bold text-xl mb-2 text-destructive">Submission Failed</h2>
                <p className="text-muted-foreground mb-6">
                  {state.error || "We couldn't submit your report. Please check your connection and try again."}
                </p>
                <div className="space-y-3">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="w-full h-12"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  <Button 
                    size="lg"
                    className="w-full h-12 font-semibold"
                    onClick={handleDone}
                  >
                    Return Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </MobileContainer>
  );
};

export default Confirmation;
