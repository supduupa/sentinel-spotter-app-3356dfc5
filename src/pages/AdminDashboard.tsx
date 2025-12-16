import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Calendar, FileText, Image, User, Filter, Brain, Trash2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Report {
  id: string;
  date: string;
  location: string;
  description: string;
  gps_lat: number | null;
  gps_long: number | null;
  photos: string[] | null;
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
  const { user, loading, signOut } = useAuth();
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
          description: "You don't have admin permissions.",
          variant: "destructive",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
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
      console.error('Error loading users:', error);
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

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Category filter
      if (categoryFilter !== 'All') {
        if (categoryFilter === 'Unprocessed') {
          if (report.ai_category) return false;
        } else {
          if (report.ai_category !== categoryFilter) return false;
        }
      }
      
      // Date filters
      if (dateFrom && new Date(report.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(report.date) > new Date(dateTo)) return false;
      
      return true;
    });
  }, [reports, categoryFilter, dateFrom, dateTo]);

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'Water Pollution': return 'bg-blue-500';
      case 'Forest Destruction': return 'bg-green-600';
      case 'Mining Pits': return 'bg-amber-600';
      case 'Other': return 'bg-gray-500';
      default: return 'bg-muted';
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">You don't have permission to access this page.</p>
            <Button className="mt-4" onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reports')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Reports ({reports.length})
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            <User className="w-4 h-4 mr-2" />
            Users ({users.length})
          </Button>
        </div>

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
                {(categoryFilter !== 'All' || dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setCategoryFilter('All');
                      setDateFrom('');
                      setDateTo('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Galamsey Reports ({filteredReports.length})
              </h2>
              
              {filteredReports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No reports found matching your filters.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredReports.map((report) => (
                    <Card key={report.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Photo */}
                          {report.photos && report.photos.length > 0 && (
                            <div className="lg:w-48 flex-shrink-0">
                              <img
                                src={report.photos[0]}
                                alt="Report photo"
                                className="w-full h-32 lg:h-full object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    #{report.id.slice(0, 8)}
                                  </span>
                                  {report.ai_category && (
                                    <Badge className={getCategoryColor(report.ai_category)}>
                                      {report.ai_category}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(report.date).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {report.location}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteReport(report.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* AI Summary */}
                            {report.ai_summary && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm flex items-start gap-2">
                                  <Brain className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                  <span className="italic">{report.ai_summary}</span>
                                </p>
                              </div>
                            )}

                            {/* Description */}
                            <p className="text-sm">{report.description}</p>

                            {/* GPS */}
                            {(report.gps_lat || report.gps_long) && (
                              <p className="text-xs text-muted-foreground">
                                GPS: {report.gps_lat?.toFixed(6)}, {report.gps_long?.toFixed(6)}
                              </p>
                            )}

                            {/* Timestamp */}
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            {users.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No users found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {users.map((userProfile) => (
                  <Card key={userProfile.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{userProfile.full_name || userProfile.email}</p>
                          <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                          <div className="flex gap-1 mt-2">
                            {userProfile.roles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === 'admin' ? 'default' : 'secondary'}
                              >
                                {role}
                              </Badge>
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back to Public Form */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          Back to Report Form
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
