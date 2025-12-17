import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { reportSubmissionSchema, photosSchema } from "@/lib/validations";

const Confirmation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate submissions in React strict mode
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    submitReport();
  }, []);

  const submitReport = async () => {
    if (submitted) return;
    
    setSubmitting(true);
    
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
      // Transform coordinates array [lng, lat] to object {lat, lng}
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
        user_id: user.id
      };

      const validationResult = reportSubmissionSchema.safeParse(submissionData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new Error(firstError.message);
      }

      // Insert the validated report - use explicit object to satisfy TypeScript
      const { data: report, error } = await supabase
        .from('galamsey_reports')
        .insert([{
          date: validationResult.data.date,
          location: validationResult.data.location,
          description: validationResult.data.description,
          gps_coordinates: validationResult.data.gps_coordinates,
          gps_address: validationResult.data.gps_address,
          photos: validationResult.data.photos,
          user_id: validationResult.data.user_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Call AI processing edge function
      try {
        await supabase.functions.invoke('process-report', {
          body: { reportId: report.id, description: validationResult.data.description },
        });
      } catch (aiErr) {
        if (import.meta.env.DEV) {
          console.error('AI processing error:', aiErr);
        }
        // Don't fail the submission if AI processing fails
      }

      // Clear sessionStorage
      sessionStorage.removeItem('reportFormData');
      sessionStorage.removeItem('reportLocation');
      sessionStorage.removeItem('capturedPhotos');

      setSubmitted(true);
      toast({
        title: "Success",
        description: "Your report has been submitted successfully!",
      });

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error submitting report:', error);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    navigate("/");
  };

  return (
    <MobileContainer>
      <HeaderBar title="Confirmation" />
      
      <main className="p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] animate-fade-in">
        <div className="w-full max-w-md">
          {submitting ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                </div>
                <h2 className="font-display font-bold text-xl mb-2">Submitting Report</h2>
                <p className="text-muted-foreground">
                  Please wait while we process your report...
                </p>
              </CardContent>
            </Card>
          ) : submitted ? (
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
                  We couldn't submit your report. Please check your connection and try again.
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