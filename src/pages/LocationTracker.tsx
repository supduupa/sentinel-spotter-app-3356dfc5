import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LocationTracker = () => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");

  const handleNext = () => {
    navigate("/report/photos");
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

        {/* Map Placeholder */}
        <div className="bg-green-100 rounded-lg h-64 flex items-center justify-center border-2 border-blue-500">
          <div className="text-center text-gray-600">
            <div className="text-sm mb-2">Interactive Map</div>
            <div className="text-xs">GPS location will be captured here</div>
            <div className="text-xs mt-2 italic">
              (Map integration available when location services are enabled)
            </div>
          </div>
        </div>

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