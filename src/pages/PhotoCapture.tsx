import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Upload, CheckCircle, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE_MB = 5;

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
    
    // Store photos for use in confirmation (sessionStorage - more secure)
    sessionStorage.setItem('capturedPhotos', JSON.stringify(photos));
    navigate("/report/confirmation");
  };

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Check photo limit
      if (photos.length + files.length > MAX_PHOTOS) {
        toast({
          title: "Too many photos",
          description: `Maximum ${MAX_PHOTOS} photos allowed.`,
          variant: "destructive",
        });
        return;
      }

      Array.from(files).forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please select image files only.",
            variant: "destructive",
          });
          return;
        }

        // Validate file size (5MB limit)
        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `Photo must be less than ${MAX_PHOTO_SIZE_MB}MB.`,
            variant: "destructive",
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPhotos(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <MobileContainer>
      <HeaderBar title="Capture Evidence" showBack onBack={() => navigate("/report/location")} />
      
      <main className="p-4 md:p-6 lg:p-8 animate-slide-up">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Details</span>
          </div>
          <div className="w-8 h-0.5 bg-primary" />
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Location</span>
          </div>
          <div className="w-8 h-0.5 bg-primary" />
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">3</div>
            <span className="text-sm font-medium hidden sm:inline">Photos</span>
          </div>
        </div>

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

        <div className="space-y-4">
          {/* Camera Capture Area */}
          {photos.length === 0 ? (
            <Card 
              className="shadow-soft cursor-pointer hover:shadow-md transition-shadow"
              onClick={handlePhotoCapture}
            >
              <CardContent className="p-0">
                <div className="h-64 md:h-80 flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg bg-accent/30 m-4">
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Camera className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-base font-medium text-foreground mb-1">Tap to capture photos</p>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Document the environmental damage with clear photos
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Photo Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group animate-scale-in">
                    <div className="aspect-square rounded-lg overflow-hidden shadow-soft">
                      <img
                        src={photo}
                        alt={`Captured evidence ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Add More Button */}
                {photos.length < MAX_PHOTOS && (
                  <div 
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                    onClick={handlePhotoCapture}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo Count */}
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent">
                  <ImageIcon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {photos.length === 0 
                      ? "No photos captured yet"
                      : `${photos.length} photo${photos.length > 1 ? 's' : ''} captured`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum {MAX_PHOTOS} photos, {MAX_PHOTO_SIZE_MB}MB each
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="mt-6 space-y-3">
          <Button 
            size="lg"
            className="w-full h-14 text-base font-semibold gradient-warning text-warning-foreground hover:opacity-90 transition-opacity shadow-soft"
            onClick={handleSubmit}
          >
            Submit Report
          </Button>
        </div>
      </main>
    </MobileContainer>
  );
};

export default PhotoCapture;