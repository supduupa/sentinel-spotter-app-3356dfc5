import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin, Calendar, FileText, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { reportFormSchema } from "@/lib/validations";

const ReportForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: "",
    location: "",
    description: ""
  });

  useEffect(() => {
    // Load data from localStorage if returning from other steps
    const savedData = localStorage.getItem('reportFormData');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    // Save to localStorage
    localStorage.setItem('reportFormData', JSON.stringify(newData));
  };

  const handleNext = () => {
    // Validate form data with zod
    const validationResult = reportFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }
    
    // Save validated data to localStorage
    localStorage.setItem('reportFormData', JSON.stringify(validationResult.data));
    navigate("/report/location");
  };

  return (
    <MobileContainer>
      <HeaderBar title="New Report" showBack onBack={() => navigate("/")} />
      
      <main className="p-4 md:p-6 lg:p-8 animate-slide-up">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">1</div>
            <span className="text-sm font-medium hidden sm:inline">Details</span>
          </div>
          <div className="w-8 h-0.5 bg-border" />
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold">2</div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Location</span>
          </div>
          <div className="w-8 h-0.5 bg-border" />
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold">3</div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Photos</span>
          </div>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-4 md:p-6 space-y-5">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
              <Info className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-accent-foreground">
                Provide details about the illegal mining activity you witnessed. Your report helps protect our environment.
              </p>
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Date of Incident
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">When did you observe the activity?</p>
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location Name
              </Label>
              <Input
                id="location"
                placeholder="e.g., Near Obuasi, Ashanti Region"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">Describe where the activity is taking place</p>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what you observed in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="min-h-32 text-base resize-none"
              />
              <p className="text-xs text-muted-foreground">Include details about the type of activity, equipment used, and number of people involved</p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-6 space-y-3">
          <Button 
            size="lg"
            className="w-full h-14 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-soft"
            onClick={handleNext}
          >
            Continue to Location
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>
    </MobileContainer>
  );
};

export default ReportForm;