import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Calendar, FileText, Image, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  date: string;
  location: string;
  description: string;
  gps_coordinates: any;
  gps_address: string;
  photos: string[];
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  roles: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
      if (error) throw error;
      
      if (data) {
        setIsAdmin(true);
        loadReports();
        loadUsers();
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have admin permissions to access this page.",
          variant: "destructive",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('galamsey_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        roles: (rolesData || [])
          .filter(role => role.user_id === profile.user_id)
          .map(role => role.role)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const toggleUserAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `User ${isCurrentlyAdmin ? 'removed from' : 'added to'} admin role.`,
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('galamsey_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully.",
      });
      
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report.",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingData) {
    return (
      <MobileContainer>
        <HeaderBar title="ADMIN DASHBOARD" />
        <div className="p-6 text-center">Loading...</div>
      </MobileContainer>
    );
  }

  if (!isAdmin) {
    return (
      <MobileContainer>
        <HeaderBar title="ACCESS DENIED" />
        <div className="p-6 text-center">
          <p className="text-destructive">You don't have permission to access this page.</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <HeaderBar title="ADMIN DASHBOARD" />
      
      <div className="p-6 space-y-6">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reports')}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Reports ({reports.length})
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className="flex-1"
          >
            <User className="w-4 h-4 mr-2" />
            Users ({users.length})
          </Button>
        </div>

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Galamsey Reports</h2>
            {reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reports found.</p>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-sm font-medium">Report #{report.id.slice(0, 8)}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                      >
                        Delete
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(report.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="text-sm">
                        <p className="font-medium">{report.location}</p>
                        {report.gps_address && (
                          <p className="text-muted-foreground">{report.gps_address}</p>
                        )}
                        {report.gps_coordinates && (
                          <p className="text-xs text-muted-foreground">
                            GPS: {report.gps_coordinates.lat?.toFixed(6)}, {report.gps_coordinates.lng?.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                      <p className="text-sm">{report.description}</p>
                    </div>

                    {report.photos && report.photos.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Image className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex flex-wrap gap-2">
                          {report.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Report photo ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(report.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No users found.</p>
            ) : (
              users.map((userProfile) => (
                <Card key={userProfile.id} className="w-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{userProfile.full_name || userProfile.email}</p>
                        <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                        <div className="flex gap-1 mt-1">
                          {userProfile.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-1 text-xs rounded ${
                                role === 'admin' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-secondary text-secondary-foreground'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant={userProfile.roles.includes('admin') ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleUserAdmin(
                          userProfile.user_id, 
                          userProfile.roles.includes('admin')
                        )}
                        disabled={userProfile.user_id === user?.id}
                      >
                        {userProfile.roles.includes('admin') ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </div>
    </MobileContainer>
  );
};

export default AdminDashboard;