import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  BookOpen, 
  Target,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw,
  Settings,
  Award,
  Mail,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  userEngagement?: any;
  learningPerformance?: any;
  cyclePerformance?: any;
  financialOverview?: any;
  recentActivity?: any;
  kpis?: any;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: { value: number; positive: boolean };
  isLoading?: boolean;
}

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState('current-cycle');
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current cycle data for context
  const { data: cycleData } = useQuery({
    queryKey: ['/api/admin/cycle-settings'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cycle-settings', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.warn('Could not fetch cycle data - using fallback');
        return { cycles: [] };
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (cycleData?.length > 0) {
      const activeCycle = cycleData.find((c: any) => c.isActive) || cycleData[0];
      setCurrentCycle(activeCycle);
    }
  }, [cycleData]);

  // Helper function for date range parameters
  const getTimeframeParams = () => {
    if (timeframe === 'current-cycle' && currentCycle) {
      return `cycleId=${currentCycle.id}`;
    } else if (timeframe === 'previous-cycle' && cycleData?.length > 1) {
      const previousCycle = cycleData.find((c: any) => !c.isActive);
      return previousCycle ? `cycleId=${previousCycle.id}` : 'timeframe=30';
    } else if (timeframe === 'all-cycles') {
      return 'allCycles=true';
    } else {
      return `timeframe=${timeframe}`;
    }
  };

  // Core Analytics Queries
  const { data: userEngagement, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/admin/analytics/users/engagement', timeframe, currentCycle?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/users/engagement?${getTimeframeParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch user engagement data');
      return response.json();
    }
  });

  const { data: learningPerformance, isLoading: loadingLearning } = useQuery({
    queryKey: ['/api/admin/analytics/learning/performance', timeframe, currentCycle?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/learning/performance?${getTimeframeParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch learning performance data');
      return response.json();
    }
  });

  const { data: cyclePerformance, isLoading: loadingCycles } = useQuery({
    queryKey: ['/api/admin/analytics/cycles/performance', timeframe, currentCycle?.id, Date.now()],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/cycles/performance?${getTimeframeParams()}&_t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch cycle performance data');
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0
  });

  const { data: financialOverview, isLoading: loadingFinancial } = useQuery({
    queryKey: ['/api/admin/analytics/financial/overview', timeframe, currentCycle?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/financial/overview?${getTimeframeParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch financial overview data');
      return response.json();
    }
  });

  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['/api/admin/analytics/activity/recent', timeframe, currentCycle?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/activity/recent?limit=20&${getTimeframeParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch recent activity data');
      return response.json();
    }
  });

  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['/api/admin/analytics/kpis/overview', timeframe, currentCycle?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/kpis/overview?${getTimeframeParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch KPI data');
      return response.json();
    }
  });

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, trend, isLoading }) => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            {subtitle && <Skeleton className="h-4 w-32" />}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "text-xs flex items-center gap-1 mt-1",
              trend.positive ? "text-green-600" : "text-red-600"
            )}>
              <TrendingUp className="h-3 w-3" />
              {formatPercentage(Math.abs(trend.value))} from last period
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Admin Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive platform insights and management controls
          </p>
          {currentCycle && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Current Cycle:</strong> {currentCycle.cycleName} 
                <span className="text-blue-600 ml-2">
                  ({new Date(currentCycle.cycleStartDate).toLocaleDateString()} - {new Date(currentCycle.cycleEndDate).toLocaleDateString()})
                </span>
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-cycle">Current Cycle</SelectItem>
              <SelectItem value="previous-cycle">Previous Cycle</SelectItem>
              <SelectItem value="all-cycles">All Cycles</SelectItem>
              <div className="h-px bg-gray-200 my-1" />
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial Analytics</TabsTrigger>
          <TabsTrigger value="cycles">Cycle Management</TabsTrigger>
          <TabsTrigger value="settings">Quick Actions</TabsTrigger>
        </TabsList>

        {/* Overview Dashboard Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={formatNumber(userEngagement?.data?.totalUsers || 0)}
              subtitle="Registered platform users"
              icon={Users}
              trend={userEngagement?.data?.userGrowthTrend}
              isLoading={loadingUsers}
            />
            <MetricCard
              title="Active Subscribers"
              value={formatNumber(userEngagement?.data?.premiumUsers || 0)}
              subtitle="Premium memberships"
              icon={CreditCard}
              trend={financialOverview?.data?.subscriptionTrend}
              isLoading={loadingFinancial}
            />
            <MetricCard
              title="Cycle Participation"
              value={formatNumber(cyclePerformance?.data?.participatingUsers || 0)}
              subtitle="Users in current cycle"
              icon={Target}
              isLoading={loadingCycles}
            />
            <MetricCard
              title="Monthly Revenue"
              value={formatCurrency(financialOverview?.data?.monthlyRevenue || 0)}
              subtitle="Recurring subscription revenue"
              icon={DollarSign}
              trend={financialOverview?.data?.revenueTrend}
              isLoading={loadingFinancial}
            />
          </div>

          {/* Real-time Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Activity Feed
              </CardTitle>
              <CardDescription>Recent platform activity and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivity?.data?.activities?.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs",
                          activity.type === 'registration' && "bg-green-500",
                          activity.type === 'subscription' && "bg-blue-500",
                          activity.type === 'lesson_completion' && "bg-purple-500",
                          activity.type === 'points_earned' && "bg-orange-500"
                        )}>
                          {activity.type === 'registration' && <Users className="h-4 w-4" />}
                          {activity.type === 'subscription' && <CreditCard className="h-4 w-4" />}
                          {activity.type === 'lesson_completion' && <BookOpen className="h-4 w-4" />}
                          {activity.type === 'points_earned' && <Award className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.userName}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent activity to display
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions Panel
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/cycles">
                  <Button className="w-full h-20 flex-col gap-2" variant="outline">
                    <Calendar className="h-6 w-6" />
                    Manage Cycles
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button className="w-full h-20 flex-col gap-2" variant="outline">
                    <Users className="h-6 w-6" />
                    User Management
                  </Button>
                </Link>
                <Link href="/admin/content">
                  <Button className="w-full h-20 flex-col gap-2" variant="outline">
                    <BookOpen className="h-6 w-6" />
                    Content Management
                  </Button>
                </Link>
                <Link href="/admin/reports">
                  <Button className="w-full h-20 flex-col gap-2" variant="outline">
                    <FileText className="h-6 w-6" />
                    Generate Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Growth Charts */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trends</CardTitle>
                <CardDescription>Registration and subscription patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Growth metrics for selected timeframe
                    </div>
                    {/* Chart would go here - using text for now */}
                    <div className="border rounded p-4 bg-gray-50">
                      <p className="text-sm">User Registration Trend: {userEngagement?.data?.registrationTrend || 'No data'}</p>
                      <p className="text-sm">Premium Conversion Rate: {userEngagement?.data?.conversionRate || 'No data'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Segmentation */}
            <Card>
              <CardHeader>
                <CardTitle>User Segmentation</CardTitle>
                <CardDescription>Free vs premium user behavior analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {userEngagement?.data?.freeUsers || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Free Users</div>
                      </div>
                      <div className="text-center p-4 border rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {userEngagement?.data?.premiumUsers || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Premium Users</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Performance Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Completion Analytics</CardTitle>
              <CardDescription>Content engagement and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLearning ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Learning performance metrics for selected timeframe
                  </div>
                  {/* Content analytics would go here */}
                  <div className="border rounded p-4 bg-gray-50">
                    <p className="text-sm">Average Completion Rate: {learningPerformance?.data?.avgCompletionRate || 'No data'}</p>
                    <p className="text-sm">Most Popular Module: {learningPerformance?.data?.popularModule || 'No data'}</p>
                    <p className="text-sm">Average Time per Lesson: {learningPerformance?.data?.avgTimePerLesson || 'No data'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Analytics Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Dashboard</CardTitle>
                <CardDescription>Financial performance and trends</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFinancial ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 border rounded">
                        <div className="text-lg font-semibold">
                          {formatCurrency(financialOverview?.data?.monthlyRevenue || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Monthly Recurring Revenue</div>
                      </div>
                      <div className="p-4 border rounded">
                        <div className="text-lg font-semibold">
                          {formatCurrency(financialOverview?.data?.totalPayouts || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Payouts Distributed</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Management</CardTitle>
                <CardDescription>Cycle rewards and pending payouts</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFinancial ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Payout status for current cycle
                    </div>
                    <div className="border rounded p-4 bg-gray-50">
                      <p className="text-sm">Pending Payouts: {financialOverview?.data?.pendingPayouts || 0}</p>
                      <p className="text-sm">Completed Payouts: {financialOverview?.data?.completedPayouts || 0}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cycle Management Tab */}
        <TabsContent value="cycles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cycle Performance Analytics</CardTitle>
              <CardDescription>Participation rates and cycle statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCycles ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {cyclePerformance?.data?.participatingUsers || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Participating Users</div>
                    </div>
                    <div className="p-4 border rounded text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(cyclePerformance?.data?.rewardPool || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Reward Pool</div>
                    </div>
                    <div className="p-4 border rounded text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {cyclePerformance?.data?.avgPointsPerUser || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Points per User</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Export & Reports</CardTitle>
                <CardDescription>Generate reports and export data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export User Analytics (CSV)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Financial Report (PDF)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Cycle Performance Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Performance monitoring and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">System Performance: Normal</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Cycle End: 5 days remaining</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Pending Approvals: {kpis?.data?.pendingApprovals || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}