import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReportForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: "",
    location: "",
    description: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    navigate("/report/location");
  };

  const handleBack = () => {
    navigate("/");
  };


  return (
    <MobileContainer>
      <HeaderBar title="NEW REPORT" />
      
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="border-2 border-gray-300 rounded-md p-3 text-base"
            />
          </div>

          <div>
            <Input
              placeholder="Location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="border-2 border-gray-300 rounded-md p-3 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Describe what you observed..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="border-2 border-gray-300 rounded-md p-3 text-base min-h-32 resize-none"
            />
          </div>

          <Button 
            variant="mobile-warning"
            className="flex items-center gap-2"
            onClick={() => navigate("/report/location")}
          >
            <MapPin className="w-4 h-4" />
            Add GPS
          </Button>
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

export default ReportForm;