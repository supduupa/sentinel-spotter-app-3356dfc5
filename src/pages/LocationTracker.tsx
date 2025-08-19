import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { ArrowRight } from "lucide-react";
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
        description: "Please select a location before proceeding",
        variant: "destructive",
      });
      return;
    }
    
    // Store location data for use in next steps
    localStorage.setItem('reportLocation', JSON.stringify(selectedLocation));
    navigate("/report/photos");
  };

  const handleLocationSelect = (coordinates: [number, number], address: string) => {
    setSelectedLocation({ coordinates, address });
  };

  return (
    <MobileContainer>
      <HeaderBar title="Track Location" />
      
      <div className="p-6 space-y-6">
        <div>
          <Input
            placeholder="Search for location"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="border-2 border-blue-500 rounded-md p-3 text-base"
          />
        </div>

        <LocationMap 
          searchLocation={searchLocation}
          onLocationSelect={handleLocationSelect}
        />

        {selectedLocation && (
          <div className="bg-primary/10 rounded-lg p-3">
            <div className="text-sm font-medium text-primary">Selected Location:</div>
            <div className="text-xs text-muted-foreground mt-1">{selectedLocation.address}</div>
            <div className="text-xs text-muted-foreground">
              {selectedLocation.coordinates[1].toFixed(6)}, {selectedLocation.coordinates[0].toFixed(6)}
            </div>
          </div>
        )}

        <div className="pt-8">
          <Button 
            variant="mobile"
            className="w-full flex items-center gap-2"
            onClick={handleNext}
          >
            NEXT
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};

export default LocationTracker;