import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Confirmation = () => {
  const navigate = useNavigate();

  const handleDone = () => {
    navigate("/");
  };

  return (
    <MobileContainer>
      <HeaderBar title="CONFIRMATION" />
      
      <div className="p-6 flex flex-col items-center justify-center min-h-96 space-y-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          
          <div className="border-2 border-blue-500 border-dashed rounded-lg p-8 bg-blue-50">
            <div className="text-center text-gray-700 font-medium">
              Your report has been submitted
            </div>
          </div>
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