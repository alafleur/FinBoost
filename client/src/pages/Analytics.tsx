import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  userEngagement?: any;
  learningPerformance?: any;
  cyclePerformance?: any;
  financialOverview?: any;
  recentActivity?: any;
  kpis?: any;
}

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('30');
  const [currentCycle, setCurrentCycle] = useState<any>(null);

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
      const data = await response.json();
      return data;
    },
    retry: false
  });

  // Set current cycle when data loads
  useEffect(() => {
    if (cycleData?.cycles?.length > 0) {
      const activeCycle = cycleData.cycles.find((c: any) => c.isActive);
      setCurrentCycle(activeCycle);
    }
  }, [cycleData]);

  // Calculate timeframe based on selection
  const getTimeframeParams = () => {
    if (timeframe === 'current-cycle' && currentCycle) {
      return `timeframe=current-cycle&cycleId=${currentCycle.id}`;
    }
    if (timeframe === 'previous-cycle' && cycleData?.cycles?.length > 1) {
      const previousCycle = cycleData.cycles.find((c: any) => !c.isActive);
      if (previousCycle) {
        return `timeframe=previous-cycle&cycleId=${previousCycle.id}`;
      }
    }
    if (timeframe === 'all-cycles') {
      return `timeframe=all-cycles`;
    }
    return `timeframe=${timeframe}`;
  };

  // Fetch analytics data
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
    queryKey: ['/api/admin/analytics/cycles/performance', timeframe, currentCycle?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/cycles/performance?${getTimeframeParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch cycle performance data');
      return response.json();
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    isLoading 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; positive: boolean };
    isLoading?: boolean;
  }) => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-20" />
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user engagement
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

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={kpis?.data?.totalUsers || 0}
          subtitle={`${kpis?.data?.activeUsers || 0} active users`}
          icon={Users}
          trend={{
            value: kpis?.data?.userGrowthRate || 0,
            positive: (kpis?.data?.userGrowthRate || 0) >= 0
          }}
          isLoading={loadingKPIs}
        />
        <StatCard
          title="Premium Subscribers"
          value={kpis?.data?.premiumUsers || 0}
          subtitle={`${formatPercentage(kpis?.data?.conversionRate || 0)} conversion rate`}
          icon={Target}
          isLoading={loadingKPIs}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpis?.data?.totalRevenue || 0)}
          subtitle={`Last ${timeframe} days`}
          icon={DollarSign}
          isLoading={loadingKPIs}
        />
        <StatCard
          title="Completion Rate"
          value={formatPercentage(kpis?.data?.avgCompletionRate || 0)}
          subtitle="Average across all modules"
          icon={BookOpen}
          isLoading={loadingKPIs}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="learning">Learning Performance</TabsTrigger>
          <TabsTrigger value="cycles">Cycle Analytics</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Current Cycle Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Current Cycle
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCycles ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {cyclePerformance?.data?.currentCycleStats?.cycleName || 'No Active Cycle'}
                    </div>
                    <div className="text-2xl font-bold">
                      {cyclePerformance?.data?.currentCycleStats?.participants || 0} participants
                    </div>
                    <div className="text-sm">
                      Pool: {formatCurrency(cyclePerformance?.data?.currentCycleStats?.poolSize || 0)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Growth Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {userEngagement?.data?.registrationTrends?.reduce((sum: number, day: any) => sum + day.count, 0) || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New registrations in last {timeframe} days
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFinancial ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialOverview?.data?.revenueStats?.monthlyRecurring || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Monthly Recurring Revenue
                    </div>
                    <div className="text-sm">
                      {financialOverview?.data?.revenueStats?.newSubscriptions || 0} new subscriptions
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
                <CardDescription>User activity and engagement over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <Badge variant="secondary">{userEngagement?.data?.totalUsers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users:</span>
                      <Badge variant="default">{userEngagement?.data?.activeUsers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium Users:</span>
                      <Badge variant="outline">{userEngagement?.data?.premiumUsers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Users:</span>
                      <Badge variant="secondary">{userEngagement?.data?.freeUsers || 0}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
                <CardDescription>New user sign-ups</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity?.data?.registrations?.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge 
                          variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                          className="ml-auto"
                        >
                          {user.subscriptionStatus === 'active' ? 'Premium' : 'Free'}
                        </Badge>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No recent registrations</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Module Completion Rates</CardTitle>
                <CardDescription>Performance across all learning modules</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLearning ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {learningPerformance?.data?.moduleCompletionRates?.slice(0, 5).map((module: any) => (
                      <div key={module.moduleId} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{module.moduleName}</span>
                          <span>{formatPercentage(module.completionRate || 0)}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(module.completionRate || 0, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {module.completions || 0} completions
                        </div>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No completion data available</div>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Learning engagement by category</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLearning ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {learningPerformance?.data?.categoryStats?.map((category: any) => (
                      <div key={category.category} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{category.category}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold">{category.totalCompletions || 0}</div>
                          <div className="text-xs text-muted-foreground">
                            {category.totalModules || 0} modules
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No category data available</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cycles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Historical Cycle Performance</CardTitle>
                <CardDescription>Past cycle participation and outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCycles ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cyclePerformance?.data?.historicalCycles?.slice(0, 5).map((cycle: any) => (
                      <div key={cycle.cycleId} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{cycle.cycleName}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="outline">{cycle.participants || 0} participants</Badge>
                        </div>
                        <div className="text-sm">
                          Total Points: {cycle.totalPoints || 0}
                        </div>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No historical cycle data available</div>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points Distribution</CardTitle>
                <CardDescription>Current cycle tier analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCycles ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cyclePerformance?.data?.pointsDistribution?.tiers?.map((tier: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tier {index + 1}</span>
                        <div className="text-right">
                          <div className="text-sm">{tier.min}-{tier.max} points</div>
                          <div className="text-xs text-muted-foreground">
                            {tier.percentage}% of pool
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No tier data available</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Financial performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFinancial ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Monthly Recurring:</span>
                      <span className="font-bold">
                        {formatCurrency(financialOverview?.data?.revenueStats?.monthlyRecurring || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Revenue:</span>
                      <span className="font-bold">
                        {formatCurrency(financialOverview?.data?.revenueStats?.newRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Subscriptions:</span>
                      <Badge variant="default">
                        {financialOverview?.data?.revenueStats?.newSubscriptions || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="font-bold">
                        {formatPercentage(financialOverview?.data?.conversionStats?.conversionRate || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Recent reward distributions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFinancial ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {financialOverview?.data?.payoutHistory?.slice(0, 5).map((payout: any) => (
                      <div key={`${payout.cycleId}-${payout.userId}`} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{payout.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(payout.selectionDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {formatCurrency(payout.payoutAmount || 0)}
                        </Badge>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No payout history available</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Activity Feed</CardTitle>
              <CardDescription>Latest user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity?.data?.activities?.map((activity: any) => (
                    <div key={`${activity.type}-${activity.userId}-${activity.timestamp}`} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === 'registration' ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{activity.username}</span> {activity.activity}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge 
                        variant={activity.type === 'registration' ? 'default' : 'secondary'}
                      >
                        {activity.type}
                      </Badge>
                    </div>
                  )) || <div className="text-sm text-muted-foreground">No recent activity</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}