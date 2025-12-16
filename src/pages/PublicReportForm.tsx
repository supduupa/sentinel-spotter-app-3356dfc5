import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, FileText, Upload, Loader2, AlertTriangle } from "lucide-react";

const PublicReportForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    gps_lat: '',
    gps_long: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_lat: position.coords.latitude.toString(),
            gps_long: position.coords.longitude.toString(),
          }));
          toast({
            title: "Location captured",
            description: "GPS coordinates have been filled in.",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not get your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in location and description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photo if exists
      let photoUrl: string | null = null;
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Convert to base64 for storage
        const reader = new FileReader();
        photoUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });
      }

      // Insert report
      const { data: report, error: insertError } = await supabase
        .from('galamsey_reports')
        .insert({
          date: formData.date,
          location: formData.location,
          description: formData.description,
          gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
          gps_long: formData.gps_long ? parseFloat(formData.gps_long) : null,
          photos: photoUrl ? [photoUrl] : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Report submitted",
        description: "Processing with AI...",
      });

      // Call AI processing edge function
      try {
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('process-report', {
          body: { reportId: report.id, description: formData.description },
        });

        if (aiError) {
          console.error('AI processing error:', aiError);
        } else {
          toast({
            title: "AI Processing Complete",
            description: `Category: ${aiResult.ai_category}`,
          });
        }
      } catch (aiErr) {
        console.error('AI function error:', aiErr);
      }

      toast({
        title: "Success!",
        description: "Your report has been submitted successfully.",
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        location: '',
        description: '',
        gps_lat: '',
        gps_long: '',
      });
      setPhoto(null);
      setPhotoPreview(null);

    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit report.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h1 className="text-3xl font-bold text-foreground">Report Galamsey</h1>
          </div>
          <p className="text-muted-foreground">
            Help protect our environment by reporting illegal mining activities
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submit a Report
            </CardTitle>
            <CardDescription>
              No login required. All reports are anonymous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Incident
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Near Obuasi, Ashanti Region"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* GPS Coordinates */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  GPS Coordinates
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="gps_lat"
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={formData.gps_lat}
                    onChange={handleInputChange}
                  />
                  <Input
                    name="gps_long"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={formData.gps_long}
                    onChange={handleInputChange}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getLocation}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use My Current Location
                </Button>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the illegal mining activity you observed..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Photo Evidence (Optional)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
                {photoPreview && (
                  <div className="mt-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            Admin Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicReportForm;
