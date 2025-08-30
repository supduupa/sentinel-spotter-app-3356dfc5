import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
}

export const useAdminNotifications = (isAdmin: boolean) => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!isAdmin || !user) {
      return;
    }

    console.log('Setting up admin notifications for user:', user.id);

    // Subscribe to real-time changes on galamsey_reports table
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'galamsey_reports'
        },
        (payload: RealtimePayload) => {
          console.log('New report received:', payload);
          
          const newReport = payload.new;
          toast({
            title: "🚨 New Report Submitted",
            description: `Location: ${newReport.location}`,
            duration: 10000, // Show for 10 seconds
          });
          
          // Refresh the reports list to show the new report
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin notifications');
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user, toast]);
};