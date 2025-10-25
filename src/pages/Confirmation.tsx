import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Confirmation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
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

      // Get data from localStorage
      const formData = JSON.parse(localStorage.getItem('reportFormData') || '{}');
      const locationData = JSON.parse(localStorage.getItem('selectedLocation') || '{}');
      const photos = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');

      if (!formData.date || !formData.location || !formData.description) {
        throw new Error('Missing form data');
      }

      // Insert the report with user_id
      const { error } = await supabase
        .from('galamsey_reports')
        .insert([
          {
            date: formData.date,
            location: formData.location,
            description: formData.description,
            gps_coordinates: locationData.coordinates || null,
            gps_address: locationData.address || null,
            photos: photos || [],
            user_id: user.id
          }
        ]);

      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem('reportFormData');
      localStorage.removeItem('selectedLocation');
      localStorage.removeItem('capturedPhotos');

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
        description: "Failed to submit report. Please try again.",
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
      <HeaderBar title="CONFIRMATION" />
      
      <div className="p-6 flex flex-col items-center justify-center min-h-96 space-y-8">
        <div className="text-center">
          {submitting ? (
            <div>
              <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="border-2 border-yellow-500 border-dashed rounded-lg p-8 bg-yellow-50">
                <div className="text-center text-gray-700 font-medium">
                  Submitting your report...
                </div>
              </div>
            </div>
          ) : submitted ? (
            <div>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <div className="border-2 border-green-500 border-dashed rounded-lg p-8 bg-green-50">
                <div className="text-center text-gray-700 font-medium">
                  Your report has been submitted successfully!
                </div>
              </div>
            </div>
          ) : (
            <div>
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <div className="border-2 border-red-500 border-dashed rounded-lg p-8 bg-red-50">
                <div className="text-center text-gray-700 font-medium">
                  Failed to submit report. Please try again.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full pt-8">
          <Button 
            variant="mobile"
            className="w-full flex items-center gap-2"
            onClick={handleDone}
          >
            <ArrowLeft className="w-4 h-4" />
            DONE
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};

export default Confirmation;