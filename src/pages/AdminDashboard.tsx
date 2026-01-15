import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HeaderBar } from "@/components/ui/header-bar";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Calendar, FileText, Image, User, Filter, Brain, Droplets, Trees, Mountain, HelpCircle, Trash2, Shield, Loader2, CalendarIcon, ExternalLink, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  scroll_tx_hash: string | null;
  wallet_address: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  roles: string[];
}

const CATEGORIES = ['All', 'Water Pollution', 'Forest Destruction', 'Mining Pits', 'Other', 'Unprocessed'];

const getCategoryIcon = (category: string | null) => {
  switch (category) {
    case 'Water Pollution':
      return <Droplets className="w-3 h-3" />;
    case 'Forest Destruction':
      return <Trees className="w-3 h-3" />;
    case 'Mining Pits':
      return <Mountain className="w-3 h-3" />;
    default:
      return <HelpCircle className="w-3 h-3" />;
  }
};

const getCategoryColor = (category: string | null) => {
  switch (category) {
    case 'Water Pollution':
      return 'bg-info/10 text-info border-info/30';
    case 'Forest Destruction':
      return 'bg-success/10 text-success border-success/30';
    case 'Mining Pits':
      return 'bg-warning/10 text-warning border-warning/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

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
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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
      // Use parameterless function to prevent checking other users' admin status
      const { data, error } = await supabase.rpc('is_current_user_admin');
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
      if (dateFrom && new Date(report.date) < dateFrom) return false;
      if (dateTo && new Date(report.date) > dateTo) return false;
      return true;
    });
  }, [reports, categoryFilter, dateFrom, dateTo]);

  if (loading || loadingData) {
    return (
      <MobileContainer>
        <HeaderBar title="Admin Dashboard" showBack onBack={() => navigate("/")} />
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileContainer>
    );
  }

  if (!isAdmin) {
    return (
      <MobileContainer>
        <HeaderBar title="Access Denied" showBack onBack={() => navigate("/")} />
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium">You don't have permission to access this page.</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <HeaderBar title="Admin Dashboard" showBack onBack={() => navigate("/")} />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reports')}
            className={`flex-1 h-12 ${activeTab === 'reports' ? 'gradient-primary' : ''}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Reports
            <Badge variant="secondary" className="ml-2">{reports.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className={`flex-1 h-12 ${activeTab === 'users' ? 'gradient-primary' : ''}`}
          >
            <User className="w-4 h-4 mr-2" />
            Users
            <Badge variant="secondary" className="ml-2">{users.length}</Badge>
          </Button>
        </div>

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filters Card */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Filter Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-10 mt-1 justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-10 mt-1 justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Count */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">Reports</h2>
              <span className="text-sm text-muted-foreground">{filteredReports.length} results</span>
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reports found matching your filters.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="shadow-soft overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono text-muted-foreground">
                              #{report.id.slice(0, 8)}
                            </span>
                            {report.ai_category && (
                              <Badge 
                                variant="outline" 
                                className={`${getCategoryColor(report.ai_category)} flex items-center gap-1`}
                              >
                                {getCategoryIcon(report.ai_category)}
                                {report.ai_category}
                              </Badge>
                            )}
                            {!report.ai_category && (
                              <Badge variant="outline" className="bg-muted/50">
                                Unprocessed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteReport(report.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Date & Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span>{new Date(report.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">{report.location}</p>
                            {report.gps_address && (
                              <p className="text-muted-foreground text-xs">{report.gps_address}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Summary */}
                      {report.ai_summary && (
                        <div className="p-3 bg-accent rounded-lg">
                          <div className="flex items-start gap-2">
                            <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm italic text-accent-foreground">{report.ai_summary}</p>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{report.description}</p>
                      </div>

                      {/* Photos */}
                      {report.photos && report.photos.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Image className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="flex flex-wrap gap-2">
                            {report.photos.slice(0, 4).map((photo, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={photo}
                                  alt={`Report photo ${index + 1}`}
                                  className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border"
                                />
                              </div>
                            ))}
                            {report.photos.length > 4 && (
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center">
                                <span className="text-sm text-muted-foreground">+{report.photos.length - 4}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Blockchain Status & Timestamp */}
                      <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(report.created_at).toLocaleString()}
                        </p>
                        {report.scroll_tx_hash && (
                          <a
                            href={`https://sepolia.scrollscan.com/tx/${report.scroll_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Link2 className="w-3 h-3" />
                            Recorded on Scroll
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg">User Management</h2>
            
            {users.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No users found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {users.map((userProfile) => (
                  <Card key={userProfile.id} className="shadow-soft">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{userProfile.full_name || userProfile.email}</p>
                            <p className="text-sm text-muted-foreground truncate">{userProfile.email}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {userProfile.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={role === 'admin' ? 'default' : 'secondary'}
                                  className={role === 'admin' ? 'gradient-primary' : ''}
                                >
                                  {role}
                                </Badge>
                              ))}
                              {userProfile.roles.length === 0 && (
                                <Badge variant="outline">user</Badge>
                              )}
                            </div>
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
                          className="flex-shrink-0"
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
      </main>
    </MobileContainer>
  );
};

export default AdminDashboard;