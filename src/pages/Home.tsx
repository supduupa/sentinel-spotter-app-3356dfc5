import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Shield, FileWarning, Leaf } from "lucide-react";
import environmentalDamage from "@/assets/environmental-damage.jpg";
import { ThirdwebWalletConnect } from "@/components/ThirdwebWalletConnect";

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
      // Use parameterless function to prevent checking other users' admin status
      const { data, error } = await supabase.rpc('is_current_user_admin');
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
      <HeaderBar 
        title="Galamsey Reporter" 
        rightElement={<ThirdwebWalletConnect variant="compact" showRewards={true} />}
      />
      
      <main className="animate-fade-in">
        {/* Hero Section */}
        <div className="relative">
          <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden">
            <img 
              src={environmentalDamage}
              alt="Environmental damage from illegal mining"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
          
          {/* Overlay Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-warning/20 backdrop-blur-sm">
                <FileWarning className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm font-medium text-warning">Environmental Alert</span>
            </div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
              Report Illegal Mining Activities
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Help protect our environment and earn crypto rewards
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Wallet Card - Show when user is logged in */}
          {user && (
            <ThirdwebWalletConnect variant="card" showRewards={true} className="mb-4" />
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Button 
              variant="default"
              size="lg"
              className="h-auto py-4 flex-col gap-2 gradient-primary hover:opacity-90 transition-opacity shadow-soft"
              onClick={() => navigate("/report")}
            >
              <Shield className="w-6 h-6" />
              <span className="font-semibold">Say No to Galamsey</span>
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="h-auto py-4 flex-col gap-2 border-2 hover:bg-accent transition-colors"
              onClick={() => navigate("/report")}
            >
              <Leaf className="w-6 h-6" />
              <span className="font-semibold">Protect Nature</span>
            </Button>
          </div>

          {/* Main CTA */}
          <div className="space-y-3 pt-4">
            <Button 
              size="lg"
              className="w-full h-14 text-base font-semibold gradient-warning text-warning-foreground hover:opacity-90 transition-opacity shadow-soft"
              onClick={() => navigate("/report")}
            >
              <FileWarning className="w-5 h-5 mr-2" />
              Report Galamsey Activity
            </Button>
            
            {/* Admin Dashboard Button */}
            {user && isAdmin && (
              <Button 
                variant="secondary"
                size="lg"
                className="w-full h-12 font-medium shadow-soft"
                onClick={() => navigate("/admin")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            
            {/* Auth Button */}
            <Button 
              variant="ghost"
              size="lg"
              className="w-full h-12"
              onClick={handleAuthAction}
            >
              {user ? "Sign Out" : "Sign In"}
            </Button>
            
            {user && (
              <p className="text-center text-sm text-muted-foreground pt-2">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>
                {isAdmin && <span className="ml-1 text-primary">(Admin)</span>}
              </p>
            )}
          </div>
        </div>
      </main>
    </MobileContainer>
  );
};

export default Home;
