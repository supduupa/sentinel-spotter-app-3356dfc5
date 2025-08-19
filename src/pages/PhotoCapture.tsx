import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { ArrowRight, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PhotoCapture = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<string[]>([]);

  const handleSubmit = () => {
    navigate("/report/confirmation");
  };

  const handlePhotoCapture = () => {
    // This would normally trigger camera capture
    // For demo purposes, we'll just show a placeholder
    console.log("Camera capture triggered");
  };

  return (
    <MobileContainer>
      <HeaderBar title="Take Pictures" />
      
      <div className="p-6 space-y-6">
        {/* Photo Placeholder */}
        <div className="border-2 border-blue-500 border-dashed rounded-lg h-64 flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center text-gray-600 mb-4">
            Photo Place Holder
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePhotoCapture}
            className="h-12 w-12 border-2 border-gray-400 rounded-lg"
          >
            <Camera className="h-6 w-6" />
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600">
          Tap the camera icon to capture evidence photos
        </div>

        <div className="pt-8">
          <Button 
            variant="mobile"
            className="w-full flex items-center gap-2"
            onClick={handleSubmit}
          >
            SUBMIT
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};

export default PhotoCapture;