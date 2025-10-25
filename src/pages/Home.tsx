import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";
import environmentalDamage from "@/assets/environmental-damage.jpg";

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking admin status:', error);
      }
      setIsAdmin(false);
    }
  };

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

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
        <div className="pt-8 space-y-3">
          <Button 
            variant="mobile"
            className="w-full"
            onClick={() => navigate("/report")}
          >
            Report Galamsey
          </Button>
          
          {/* Admin Dashboard Button */}
          {user && isAdmin && (
            <Button 
              variant="default"
              className="w-full flex items-center gap-2"
              onClick={() => navigate("/admin")}
            >
              <Settings className="w-4 h-4" />
              Admin Dashboard
            </Button>
          )}
          
          {/* Auth Button */}
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleAuthAction}
          >
            {user ? "Sign Out" : "Sign In"}
          </Button>
          
          {user && (
            <p className="text-center text-sm text-muted-foreground">
              Signed in as {user.email}
              {isAdmin && " (Admin)"}
            </p>
          )}
        </div>
      </div>
    </MobileContainer>
  );
};

export default Home;