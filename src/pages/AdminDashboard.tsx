import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Calendar, FileText, Image, User, Filter, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

interface Report {
  id: string;
  date: string;
  location: string;
  description: string;
  gps_coordinates: any;
  gps_address: string;
  photos: string[];
  ai_summary: string | null;
  ai_category: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  roles: string[];
}

const CATEGORIES = ['All', 'Water Pollution', 'Forest Destruction', 'Mining Pits', 'Other', 'Unprocessed'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');
  const [loadingData, setLoadingData] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('galamsey_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading reports:', error);
      }
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Enable real-time notifications for admins
  useAdminNotifications(isAdmin, loadReports);

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
      if (import.meta.env.DEV) {
        console.error('Error checking admin status:', error);
      }
      navigate('/');
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
      if (import.meta.env.DEV) {
        console.error('Error loading users:', error);
      }
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
      if (import.meta.env.DEV) {
        console.error('Error updating user role:', error);
      }
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
      if (import.meta.env.DEV) {
        console.error('Error deleting report:', error);
      }
      toast({
        title: "Error",
        description: "Failed to delete report.",
        variant: "destructive",
      });
    }
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (categoryFilter !== 'All') {
        if (categoryFilter === 'Unprocessed') {
          if (report.ai_category) return false;
        } else {
          if (report.ai_category !== categoryFilter) return false;
        }
      }
      if (dateFrom && new Date(report.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(report.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [reports, categoryFilter, dateFrom, dateTo]);

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
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">From</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">To</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-semibold">Galamsey Reports ({filteredReports.length})</h2>
            {filteredReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reports found.</p>
            ) : (
              filteredReports.map((report) => (
                <Card key={report.id} className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Report #{report.id.slice(0, 8)}</span>
                        {report.ai_category && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            report.ai_category === 'Water Pollution' ? 'bg-blue-100 text-blue-800' :
                            report.ai_category === 'Forest Destruction' ? 'bg-green-100 text-green-800' :
                            report.ai_category === 'Mining Pits' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.ai_category}
                          </span>
                        )}
                      </div>
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

                    {/* AI Summary */}
                    {report.ai_summary && (
                      <div className="flex items-start gap-2 bg-muted/50 rounded p-2">
                        <Brain className="w-4 h-4 text-primary mt-0.5" />
                        <p className="text-sm italic">{report.ai_summary}</p>
                      </div>
                    )}

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
