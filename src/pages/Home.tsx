import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { useNavigate } from "react-router-dom";
import environmentalDamage from "@/assets/environmental-damage.jpg";

const Home = () => {
  const navigate = useNavigate();

  return (
    <MobileContainer>
      <HeaderBar title="Community Reporting App" />
      
      <div className="p-4 space-y-6">
        {/* Hero Image */}
        <div className="relative rounded-lg overflow-hidden shadow-lg">
          <img 
            src={environmentalDamage}
            alt="Environmental damage from illegal mining"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button 
            variant="mobile-warning"
            onClick={() => navigate("/report")}
          >
            Say no to Galamsey
          </Button>
          <Button 
            variant="mobile"
            onClick={() => navigate("/report")}
          >
            Let go
          </Button>
        </div>

        {/* Report Button */}
        <div className="pt-8">
          <Button 
            variant="mobile"
            className="w-full"
            onClick={() => navigate("/report")}
          >
            Report Galamsey
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};

export default Home;