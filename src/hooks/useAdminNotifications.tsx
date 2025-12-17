import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
}

export const useAdminNotifications = (isAdmin: boolean, onNewReport?: () => void) => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!isAdmin || !user) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log('Setting up admin notifications for user:', user.id);
    }

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
          if (import.meta.env.DEV) {
            console.log('New report received:', payload);
          }
          
          const newReport = payload.new;
          toast({
            title: "🚨 New Report Submitted",
            description: `Location: ${newReport.location}`,
            duration: 10000, // Show for 10 seconds
          });
          
          // Trigger report refresh callback
          onNewReport?.();
        }
      )
      .subscribe();

    return () => {
      if (import.meta.env.DEV) {
        console.log('Cleaning up admin notifications');
      }
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user, toast]);
};