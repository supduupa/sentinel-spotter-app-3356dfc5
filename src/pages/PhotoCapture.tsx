import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { ArrowRight, ArrowLeft, Camera, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PhotoCapture = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (photos.length === 0) {
      toast({
        title: "No photos captured",
        description: "Please take at least one photo before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    // Store photos for use in confirmation
    localStorage.setItem('capturedPhotos', JSON.stringify(photos));
    navigate("/report/confirmation");
  };

  const handleBack = () => {
    navigate("/report/location");
  };

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setPhotos(prev => [...prev, result]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <MobileContainer>
      <HeaderBar title="Take Pictures" />
      
      <div className="p-6 space-y-6">
        {/* Hidden file input for camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Camera Capture Button */}
        {photos.length === 0 && (
          <div className="border-2 border-primary border-dashed rounded-lg h-64 flex flex-col items-center justify-center bg-muted/30">
            <div className="text-center text-muted-foreground mb-4">
              Tap to capture evidence photos
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePhotoCapture}
              className="h-16 w-16 border-2 border-primary/20 rounded-lg hover:border-primary/40"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        )}

        {/* Captured Photos Grid */}
        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Captured evidence ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={handlePhotoCapture}
              className="w-full flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Add More Photos
            </Button>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {photos.length === 0 
            ? "Take photos to document the environmental issue"
            : `${photos.length} photo${photos.length > 1 ? 's' : ''} captured`
          }
        </div>

        <div className="pt-8 space-y-3">
          <Button 
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            BACK
          </Button>
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