import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Search, MapPin, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LocationMap from "@/components/LocationMap";
import { useToast } from "@/hooks/use-toast";

const LocationTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    coordinates: [number, number];
    address: string;
  } | null>(null);

  const handleNext = () => {
    if (!selectedLocation) {
      toast({
        title: "Location required",
        description: "Please select a location on the map before proceeding",
        variant: "destructive",
      });
      return;
    }
    
    // Store location data for use in next steps (sessionStorage - more secure)
    sessionStorage.setItem('reportLocation', JSON.stringify(selectedLocation));
    navigate("/report/photos");
  };

  const handleLocationSelect = (coordinates: [number, number], address: string) => {
    setSelectedLocation({ coordinates, address });
  };

  return (
    <MobileContainer>
      <HeaderBar title="Track Location" showBack onBack={() => navigate("/report")} />
      
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
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">2</div>
            <span className="text-sm font-medium hidden sm:inline">Location</span>
          </div>
          <div className="w-8 h-0.5 bg-border" />
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold">3</div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Photos</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <Label htmlFor="search" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                Search Location
              </Label>
              <Input
                id="search"
                placeholder="Search for a location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="h-12 text-base"
              />
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="shadow-soft overflow-hidden">
            <CardContent className="p-0">
              <div className="h-64 md:h-80 lg:h-96">
                <LocationMap 
                  searchLocation={searchLocation}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected Location Display */}
          {selectedLocation && (
            <Card className="shadow-soft border-primary/30 bg-accent animate-scale-in">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Selected Location</p>
                    <p className="text-sm text-muted-foreground mt-1 break-words">{selectedLocation.address}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {selectedLocation.coordinates[1].toFixed(6)}, {selectedLocation.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-3">
          <Button 
            size="lg"
            className="w-full h-14 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-soft"
            onClick={handleNext}
          >
            Continue to Photos
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>
    </MobileContainer>
  );
};

export default LocationTracker;