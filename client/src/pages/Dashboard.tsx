import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Users, 
  Upload, 
  Star,
  DollarSign,
  Award,
  Target,
  Activity,
  Crown,
  Medal,
  Settings,
  HelpCircle,
  MessageCircle,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FinBoostLogo } from "@/components/ui/finboost-logo";
import PointsSummary from "@/components/PointsSummary";
import PointsHistory from "@/components/PointsHistory";
import Leaderboard from "@/components/Leaderboard";
import ReferralSystem from "@/components/ReferralSystem";
import StreakDisplay from "@/components/StreakDisplay";
import PointsActions from "@/components/PointsActions";
import UpgradePrompt from "@/components/UpgradePrompt";
import ExpandedLeaderboard from "@/components/ExpandedLeaderboard";
import { educationContent } from "@/data/educationContent";
import { getUserAccessInfo, canAccessModule, getUpgradeMessage, shouldShowUpgradePrompt, type UserForAccess } from "@shared/userAccess";

// Custom hook to determine if the screen is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  totalPoints: number;
  currentMonthPoints: number;
  tier: string;
  currentStreak?: number;
  longestStreak?: number;
  subscriptionStatus?: string;
  theoreticalPoints?: number;
  membershipBonusReceived?: boolean;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [tierThresholds, setTierThresholds] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<any[]>([]);
  const [poolData, setPoolData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [distributionInfo, setDistributionInfo] = useState<{
    nextDate: string;
    timeRemaining: { days: number; hours: number; minutes: number; totalMs: number };
    settings: { [key: string]: string };
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [publishedModules, setPublishedModules] = useState<any[]>([]);
  const [supportForm, setSupportForm] = useState({
    category: "",
    message: ""
  });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [showSupportSuccess, setShowSupportSuccess] = useState(false);
  const [showExpandedLeaderboard, setShowExpandedLeaderboard] = useState(false);

  const LeaderboardSidebar = () => {
    if (!leaderboardData) return null;

    return (
      <div className="w-full h-full bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 space-y-6" style={{ paddingTop: '1.5rem' }}>
          {/* Tier Progress Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="font-heading font-bold text-lg mb-4 text-gray-800 mt-1">Tier Thresholds</h3>
            <p className="text-xs text-gray-600 mb-3">Dynamic thresholds based on user percentiles</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                <span className="text-blue-700 font-semibold">Tier 1</span>
                <span className="text-blue-600">{tierThresholds?.tier1 || 0}+ pts</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                <span className="text-blue-700 font-semibold">Tier 2</span>
                <span className="text-blue-600">{tierThresholds?.tier2 || 0} - {tierThresholds?.tier1 ? tierThresholds.tier1 - 1 : 0} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                <span className="text-blue-700 font-semibold">Tier 3</span>
                <span className="text-blue-600">0 - {tierThresholds?.tier2 ? tierThresholds.tier2 - 1 : 0} pts</span>
              </div>
            </div>
            {user && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-blue-800">Your Status</span>
                  <Badge className={`${getTierColor(user.tier)} text-white text-xs`}>
                    {getTierDisplayName(user.tier)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700">Total Points:</span>
                  <span className="text-xs font-bold text-blue-800">{user.totalPoints}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-blue-700">This Month:</span>
                  <span className="text-xs font-medium text-blue-800">{user.currentMonthPoints}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            {/* View Full Leaderboard Button - Above Heading */}
            <div className="mb-4">
              <Button 
                onClick={() => setShowExpandedLeaderboard(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
              >
                <Trophy className="h-5 w-5 mr-2" />
                View Full Leaderboard
              </Button>
            </div>

            <h3 className="font-heading font-bold text-lg mb-4">Leaderboard</h3>
            <div className="space-y-1">
              {leaderboardData.leaderboard?.slice(0, 10).map((entry: any, index: number) => (
                <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  leaderboardData.currentUser && entry.id === leaderboardData.currentUser.id 
                    ? 'bg-blue-100 border border-blue-300' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500 w-6">#{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium truncate">{entry.username}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{entry.points} pts</span>
                </div>
              ))}
            </div>

            {leaderboardData.currentUser && leaderboardData.currentUser.rank > 10 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-blue-600 w-6">#{leaderboardData.currentUser.rank}</span>
                    <span className="text-sm font-semibold text-blue-800">{leaderboardData.currentUser.username} (You)</span>
                  </div>
                  <span className="text-xs font-bold text-blue-800">{leaderboardData.currentUser.points} pts</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log('🔄 DASHBOARD: useEffect triggered');

    const initializeDashboard = async () => {
      const token = localStorage.getItem('token');
      console.log('🔄 DASHBOARD: Token check:', !!token);

      if (!token) {
        console.log('🔄 DASHBOARD: No token, redirecting to auth');
        setLocation('/auth');
        return;
      }

      console.log('🔄 DASHBOARD: Starting fetchDashboardData...');
      try {
        const authSuccess = await fetchDashboardData();
        console.log('🔄 DASHBOARD: fetchDashboardData result:', authSuccess);

        if (authSuccess) {
          console.log('🚀 DASHBOARD: Auth successful, fetching additional data...');
          await Promise.all([
            fetchLessonProgress(),
            fetchDistributionInfo(),
            fetchPublishedModules()
          ]);
        } else {
          console.log('🚀 DASHBOARD: Auth failed, redirecting to login...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLocation('/auth');
        }
      } catch (error) {
        console.error('❌ DASHBOARD: Error in initialization:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLocation('/auth');
      }
    };

    initializeDashboard();

    const refreshInterval = setInterval(() => {
      fetchSecondaryData();
    }, 1800000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Update countdown timer only when needed (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      if (distributionInfo) {
        fetchDistributionInfo();
      }
    }, 900000); // Update every 15 minutes

    return () => clearInterval(interval);
  }, [distributionInfo]);

  // Consolidated data fetching to reduce API calls
  const fetchDashboardData = async () => {
    try {
      console.log('🔄 DASHBOARD: Starting fetchDashboardData...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔄 DASHBOARD: No token found in fetchDashboardData');
        return false;
      }

      console.log('🔄 DASHBOARD: Making parallel API calls...');
      // Fetch only essential data in a single batch
      const [userResponse, poolResponse] = await Promise.all([
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/pool/monthly')
      ]);

      console.log('🔄 DASHBOARD: Auth response status:', userResponse.status);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
        console.log('✅ DASHBOARD: User data set successfully');
      } else {
        console.log('❌ DASHBOARD: Auth failed in fetchDashboardData');
        return false;
      }

      if (poolResponse.ok) {
        const poolResponse_data = await poolResponse.json();
        setPoolData(poolResponse_data.pool);
      }

      // Load secondary data only after initial load
      setTimeout(() => {
        fetchSecondaryData();
      }, 1000);

      console.log('✅ DASHBOARD: fetchDashboardData completed successfully');
      return true; // Indicates successful authentication

    } catch (error) {
      console.error('❌ DASHBOARD: Error fetching dashboard data:', error);
      return false;
    }
  };

  const fetchSecondaryData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [leaderboardResponse, thresholdsResponse] = await Promise.all([
        fetch('/api/leaderboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/tiers/thresholds')
      ]);

      if (leaderboardResponse.ok) {
        const data = await leaderboardResponse.json();
        setLeaderboardData(data);
      }

      if (thresholdsResponse.ok) {
        const data = await thresholdsResponse.json();
        setTierThresholds(data.thresholds);
      }
    } catch (error) {
      console.error('Error fetching secondary data:', error);
    }
  };

  const fetchLessonProgress = async () => {
    try {
      console.log('🔄 DASHBOARD: Starting fetchLessonProgress...');
      const token = localStorage.getItem('token');
      console.log('🔄 DASHBOARD: Token exists:', !!token);
      if (!token) {
        console.log('🔄 DASHBOARD: No token found, skipping progress fetch');
        return;
      }

      console.log('🔄 DASHBOARD: Making API call to /api/user/progress...');
      const response = await fetch('/api/user/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('🔄 DASHBOARD: API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ DASHBOARD: Full API response:', data);
        console.log('✅ DASHBOARD: Progress array length:', data.progress?.length || 0);
        console.log('✅ DASHBOARD: Setting lesson progress to:', data.progress);
        setLessonProgress(data.progress || []);
        console.log('✅ DASHBOARD: State updated with progress data');
      } else {
        console.error('❌ DASHBOARD: API call failed with status:', response.status);
        const errorText = await response.text();
        console.error('❌ DASHBOARD: Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ DASHBOARD: Error fetching lesson progress:', error);
    }
  };

  const fetchPoolData = async () => {
    try {
      const response = await fetch('/api/pool/monthly');
      if (response.ok) {
        const data = await response.json();
        setPoolData(data.pool);
      }
    } catch (error) {
      console.error('Error fetching pool data:', error);
    }
  };

  const fetchPublishedModules = async () => {
    try {
      const response = await fetch('/api/modules');
      if (response.ok) {
        const data = await response.json();
        setPublishedModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error fetching published modules:', error);
    }
  };

  const fetchDistributionInfo = async () => {
    try {
      const response = await fetch('/api/pool/next-distribution');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDistributionInfo(data.distribution);
        }
      }
    } catch (error) {
      console.error('Error fetching distribution info:', error);
    }
  };

  // Handle support ticket submission
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.category || !supportForm.message.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingSupport(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || '',
          email: user?.email || '',
          category: supportForm.category,
          message: supportForm.message
        })
      });

      if (response.ok) {
        setShowSupportSuccess(true);
        setSupportForm({ category: "", message: "" });
        toast({
          title: "Support ticket submitted",
          description: "We'll get back to you within 24 hours!",
        });
      } else {
        throw new Error('Failed to submit support request');
      }
    } catch (error) {
      console.error('Support submission error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const getTierColor = (tier?: string) => {
    // Use consistent blue colors for all tiers
    return 'bg-gradient-to-r from-blue-500 to-blue-600';
  };

  const getTierDisplayName = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'tier3':
        return 'Tier 3';
      case 'tier2':
        return 'Tier 2';
      case 'tier1':
      default:
        return 'Tier 1';
    }
  };

  // Get the completed lesson IDs from lessonProgress with complete mapping
  const moduleToLessonMap: { [key: number]: string } = {
    1: 'budgeting-basics',
    2: 'emergency-fund',
    3: 'investment-basics',
    4: 'credit-management',
    5: 'retirement-planning',
    6: 'tax-optimization',
    7: 'credit-basics',
    8: 'understanding-credit-scores',
    9: 'debt-snowball-vs-avalanche',
    10: 'smart-expense-cutting',
    11: 'zero-based-budgeting',
    12: 'envelope-budgeting',
    13: 'high-yield-savings',
    14: 'cd-laddering',
    15: 'sinking-funds',
    16: 'roth-vs-traditional-ira',
    17: 'index-fund-investing',
    18: 'asset-allocation',
    19: 'dollar-cost-averaging',
    20: 'options-trading-basics',
    21: 'smart-goal-setting',
    22: 'estate-planning-basics',
    23: 'insurance-essentials',
    24: 'managing-student-loans',
    25: 'charitable-giving-strategies',
    26: 'home-buying-process',
    27: 'retirement-income-planning',
    28: 'emergency-fund-detailed',
    29: 'budgeting-basics-detailed',
    30: 'investment-basics-detailed',
    31: 'credit-management-detailed',
    32: 'retirement-planning-detailed',
    33: 'tax-optimization-detailed',
    34: 'building-emergency-fund',
    35: 'debt-consolidation'
  };

  const completedModuleIds = lessonProgress
    .filter(progress => progress.completed)
    .map(progress => Number(progress.moduleId)); // Ensure numeric comparison

  // Debug completion data structure with more detail
  console.log('📊 DASHBOARD STATE: Lesson Progress Data:', lessonProgress);
  console.log('📊 DASHBOARD STATE: Completed Module IDs (converted to numbers):', completedModuleIds);
  console.log('📊 DASHBOARD STATE: Published Module IDs:', publishedModules.map(m => ({ id: m.id, title: m.title })));
  console.log('📊 DASHBOARD STATE: Progress details:', lessonProgress.map(p => ({ 
    moduleId: p.moduleId, 
    completed: p.completed, 
    type: typeof p.moduleId 
  })));

  // Test the completion matching logic directly
  if (lessonProgress.length > 0 && publishedModules.length > 0) {
    const testModule = publishedModules.find(m => m.id === 52); // Test with first visible module
    const isTestCompleted = completedModuleIds.includes(52);
    console.log('🧪 DASHBOARD TEST: Module 52 completed?', isTestCompleted);
    console.log('🧪 DASHBOARD TEST: Available completed IDs:', completedModuleIds);
  }





  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FinBoostLogo size="lg" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold">{user?.firstName || user?.username}</p>
              </div>
              {user?.email === 'lafleur.andrew@gmail.com' && (
                <Button variant="outline" onClick={() => setLocation('/admin')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/profile')}
              >
                Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setLocation('/auth');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 ${!isMobile ? 'pr-80' : ''}`}>
          <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8">
              <h2 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl mb-2">
                Welcome to your FinBoost Dashboard! 🚀
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Track your progress, earn points, and win monthly rewards for building better financial habits.
              </p>
            </div>

            {/* Upgrade Prompt for Free Users */}
            {user && shouldShowUpgradePrompt(user, window.location.pathname) && (
              <div className="mb-6 sm:mb-8">
                <UpgradePrompt 
                  theoreticalPoints={user.theoreticalPoints || 0}
                  currentMonthPoints={user.currentMonthPoints || 0}
                  membershipJoinBonus={100}
                />
              </div>
            )}

            {/* Monthly Reward Pool */}
            <div className="mb-6 sm:mb-8">
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-purple-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Monthly Reward Pool
                    {user && !getUserAccessInfo(user).canAccessRewardsPool && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                        Premium Only
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    {user && getUserAccessInfo(user).canAccessRewardsPool 
                      ? "Community funds distributed monthly based on participation and achievement"
                      : "Join premium membership to compete for monthly rewards"
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Pool */}
                    <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-purple-800 mb-1">Total Pool</h4>
                        <div className="text-2xl font-bold text-purple-900">
                          ${poolData && poolData.totalPool ? poolData.totalPool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">Community rewards</p>
                      </div>
                    </div>

                    {/* Tier 1 Pool */}
                    <div className="bg-gradient-to-br from-blue-100 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Tier 1 Pool</h4>
                        <div className="text-xl font-bold text-blue-900">
                          ${poolData && poolData.tier1Pool ? poolData.tier1Pool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Top 33% performers</p>
                      </div>
                    </div>

                    {/* Tier 2 Pool */}
                    <div className="bg-gradient-to-br from-blue-100 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Tier 2 Pool</h4>
                        <div className="text-xl font-bold text-blue-900">
                          ${poolData && poolData.tier2Pool ? poolData.tier2Pool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Middle 33% performers</p>
                      </div>
                    </div>

                    {/* Tier 3 Pool */}
                    <div className="bg-gradient-to-br from-blue-100 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Tier 3 Pool</h4>
                        <div className="text-xl font-bold text-blue-900">
                          ${poolData && poolData.tier3Pool ? poolData.tier3Pool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Bottom 33% performers</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Community Power Display */}
                      <div className="bg-green-100 rounded-lg p-4 text-center">
                        <div className="text-4xl font-bold text-green-900 mb-1">
                          {poolData && poolData.totalUsers ? poolData.totalUsers.toLocaleString() : '0'}
                        </div>
                        <p className="text-sm font-bold text-green-800 uppercase tracking-wide">
                          🚀 Community Power
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Members building wealth together
                        </p>
                      </div>

                      {/* Payout Countdown */}
                      <div className="bg-emerald-100 rounded-lg p-4 text-center">
                        <div className="text-4xl font-bold text-emerald-900 mb-1">
                          {distributionInfo?.timeRemaining?.days || 0}
                        </div>
                        <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
                          💰 Days to Rewards Distribution
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                          {distributionInfo?.nextDate ? new Date(distributionInfo.nextDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Next month'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Prompt for Free Users */}
            {user && user.subscriptionStatus !== 'active' && (
              <div className="mb-6">
                <UpgradePrompt 
                  theoreticalPoints={user.theoreticalPoints || 0}
                  currentMonthPoints={user.currentMonthPoints || 0}
                />
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Button 
                  onClick={() => {
                    if (isMobile) {
                      setActiveTab('support');
                    } else {
                      setLocation('/support');
                    }
                  }}
                  variant="outline" 
                  className="w-full h-12 text-left flex items-center justify-between border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Need Help?</div>
                      <div className="text-xs text-blue-600">Submit a support ticket</div>
                    </div>
                  </div>
                  <MessageCircle className="h-4 w-4 text-blue-400" />
                </Button>
              </div>
              <div className="flex-1">
                <Button 
                  onClick={() => setLocation('/education')}
                  variant="outline" 
                  className="w-full h-12 text-left flex items-center justify-between border-green-200 hover:border-green-300 hover:bg-green-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-green-900">Learn & Earn</div>
                      <div className="text-xs text-green-600">Complete lessons for points</div>
                    </div>
                  </div>
                  <Target className="h-4 w-4 text-green-400" />
                </Button>
              </div>
            </div>

            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Monthly Tier</CardTitle>
                  <Trophy className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={`${getTierColor(user?.tier || 'tier1')} text-white capitalize text-lg px-3 py-1`}>
                      {getTierDisplayName(user?.tier || 'tier1')}
                    </Badge>
                  </div>
                  <p className="text-xs text-orange-700">
                    Lifetime points: {user?.totalPoints || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Monthly Points</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">{user?.currentMonthPoints || 0}</div>
                  <p className="text-xs text-green-700">
                    Total points: {user?.totalPoints || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-800">Rewards</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-800">${(user as any)?.totalRewards || 0}</div>
                  <p className="text-xs text-emerald-700">
                    Total earned
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Progress</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">
                    {publishedModules.length > 0 ? Math.round((completedModuleIds.length / publishedModules.length) * 100) : 0}%
                  </div>
                  <p className="text-xs text-blue-700">
                    {completedModuleIds.length} of {publishedModules.length} lessons
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Points to Next Tier</CardTitle>
                  <Star className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800">
                    {(() => {
                      if (!user || !tierThresholds) return 0;

                      const currentPoints = user.currentMonthPoints || 0;
                      const currentTier = user.tier || 'tier3';

                      // tier1 is the highest tier, tier3 is the lowest
                      switch(currentTier) {
                        case 'tier3': 
                          return Math.max(0, tierThresholds.tier2 - currentPoints);
                        case 'tier2': 
                          return Math.max(0, tierThresholds.tier1 - currentPoints);
                        case 'tier1': 
                          return 0; // Highest tier users show 0 points to next tier
                        default: 
                          return Math.max(0, tierThresholds.tier2 - currentPoints);
                      }
                    })()}
                  </div>
                  <p className="text-xs text-purple-700">
                    {user?.tier === 'tier1' ? 'Top tier reached' : 'Points needed to advance'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Navigation Tabs - Show at top on mobile */}
            {isMobile ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                  <TabsTrigger value="overview" className="text-xs px-1 py-2">Overview</TabsTrigger>
                  <TabsTrigger value="earn" className="text-xs px-1 py-2">Earn</TabsTrigger>
                  <TabsTrigger value="referrals" className="text-xs px-1 py-2">Referrals</TabsTrigger>
                  <TabsTrigger value="leaderboard" className="text-xs px-1 py-2">Board</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs px-1 py-2">Activity</TabsTrigger>
                  <TabsTrigger value="support" className="text-xs px-1 py-2">Support</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="space-y-6">
                    <StreakDisplay 
                      currentStreak={user?.currentStreak || 0}
                      longestStreak={user?.longestStreak || 0}
                    />

                    {/* Monthly Pool Info for Mobile Overview */}
                    {poolData && (
                      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold text-purple-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                            Monthly Pool
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center mb-4">
                            <div className="text-3xl font-bold text-purple-900 mb-1">
                              ${poolData && poolData.totalPool ? poolData.totalPool.toLocaleString() : '0'}
                            </div>
                            <p className="text-sm text-purple-700">Total Community Pool</p>
                          </div>

                          {distributionInfo && (
                            <div className="bg-green-100 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-green-900 mb-1">
                                {distributionInfo.timeRemaining.days}
                              </div>
                              <p className="text-sm font-bold text-green-800">
                                Days Until Distribution
                              </p>
                            </div>
                          )}

                          <div className="mt-4 text-center">
                            <div className="text-2xl font-bold text-green-900 mb-1">
                              {poolData && poolData.totalUsers ? poolData.totalUsers.toLocaleString() : '0'}
                            </div>
                            <p className="text-sm font-bold text-green-800">
                              Active Members
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* User Tier Status */}
                    {user && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Your Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Current Tier:</span>
                              <Badge className={`${getTierColor(user.tier)} text-white`}>
                                {getTierDisplayName(user.tier)}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Total Points:</span>
                              <span className="font-bold">{user.totalPoints}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">This Month:</span>
                              <span className="font-medium">{user.currentMonthPoints}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="earn" className="space-y-6">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 sm:mb-0">
                        Lessons
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-fit">
                          {completedModuleIds.length} of {publishedModules.length} completed
                        </Badge>
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <div className="flex gap-2">
                        <select 
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="">All Categories</option>
                          <option value="Budgeting">Budgeting</option>
                          <option value="Credit">Credit</option>
                          <option value="Investing">Investing</option>
                          <option value="Saving">Saving</option>
                          <option value="Planning">Planning</option>
                          <option value="Taxes">Taxes</option>
                          <option value="Debt">Debt</option>
                          <option value="Insurance">Insurance</option>
                        </select>
                      </div>
                    </div>


                    {/* Test Navigation Button */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <Button 
                        onClick={() => {
                          alert('Test button clicked!');
                          setLocation('/lesson/1');
                        }}
                        className="mb-2"
                      >
                        TEST: Go to Lesson 1
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {publishedModules
                        .filter(module => selectedCategory === "" || module.category === selectedCategory)
                        .map(module => {
                          const isCompleted = completedModuleIds.includes(module.id);
                          const canAccess = user ? canAccessModule(user, module) : false;
                          const accessInfo = user ? getUserAccessInfo(user) : null;
                          const isPremiumModule = module.accessType === 'premium';

                          return (
                            <Card 
                              key={module.id}
                              className={`transition-all duration-200 hover:shadow-md relative ${
                                isCompleted ? 'border-green-200 bg-green-50' : 
                                isPremiumModule ? 'border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100' :
                                'hover:border-primary-200'
                              }`}
                            >
                              {isCompleted && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                              {isPremiumModule && (
                                <div className="absolute top-2 left-2">
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                </div>
                              )}
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-sm leading-tight pr-2">{module.title}</h4>
                                  <div className="flex flex-col gap-1 shrink-0">
                                    {isPremiumModule && (
                                      <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 text-xs font-semibold border border-yellow-300">
                                        Members
                                      </Badge>
                                    )}
                                    {isCompleted ? (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Completed
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">
                                        {module.pointsReward} pts
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{module.content?.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-500 capitalize">{module.category}</span>
                                </div>
                                <div className="flex items-center justify-end">
                                  <Button 
                                    onClick={() => {
                                      console.log(`🔗 DASHBOARD: Navigating to lesson ${module.id}`);
                                      setLocation(`/lesson/${module.id}`);
                                    }}
                                    size="sm"
                                    variant={isCompleted ? "secondary" : isPremiumModule ? "outline" : "default"}
                                    className={`w-full hover:opacity-90 transition-opacity ${
                                      isPremiumModule && !isCompleted 
                                        ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50' 
                                        : ''
                                    }`}
                                  >
                                    {isCompleted ? "Review" : isPremiumModule ? "Upgrade to Access" : "Start Lesson"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>

                    {/* Next Lesson Recommendation */}
                    {(() => {
                      const nextLesson = publishedModules
                        .find(module => !completedModuleIds.includes(module.id));

                      if (nextLesson && completedModuleIds.length > 0) {
                        return (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800 mb-2">
                              Next Recommended Lesson:
                            </p>
                            <Button 
                              onClick={() => setLocation(`/lesson/${nextLesson.id}`)}
                              className="mr-2"
                              size="sm"
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              {nextLesson.title}
                            </Button>
                            <span className="text-xs text-blue-600">
                              ({nextLesson.pointsReward} points)
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="text-center mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/education')}
                        className="w-full"
                        size="sm"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        View All Learning Modules
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="referrals">
                  <ReferralSystem />
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <h3 className="font-heading font-bold text-lg mb-4 text-gray-800">Tier Thresholds</h3>
                    <p className="text-xs text-gray-600 mb-3">Dynamic thresholds based on user percentiles</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                        <span className="text-blue-700 font-semibold">Tier 1</span>
                        <span className="text-blue-600">{tierThresholds?.tier1 || 0}+ pts</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                        <span className="text-blue-700 font-semibold">Tier 2</span>
                        <span className="text-blue-600">{tierThresholds?.tier2 || 0} - {tierThresholds?.tier1 ? tierThresholds.tier1 - 1 : 0} pts</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                        <span className="text-blue-700 font-semibold">Tier 3</span>
                        <span className="text-blue-600">0 - {tierThresholds?.tier2 ? tierThresholds.tier2 - 1 : 0} pts</span>
                      </div>
                    </div>

                    {/* Tier Population Distribution */}
                    {poolData && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Tier Population</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-bold text-blue-800">{poolData.tier3Users || 0}</div>
                            <div className="text-blue-600">Tier 3</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-bold text-blue-800">{poolData.tier2Users || 0}</div>
                            <div className="text-blue-600">Tier 2</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-bold text-blue-800">{poolData.tier1Users || 0}</div>
                            <div className="text-blue-600">Tier 1</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {user && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-blue-800">Your Status</span>
                          <Badge className={`${getTierColor(user.tier)} text-white text-xs`}>
                            {getTierDisplayName(user.tier)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-700">Total Points:</span>
                          <span className="text-xs font-bold text-blue-800">{user.totalPoints}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-blue-700">This Month:</span>
                          <span className="text-xs font-medium text-blue-800">{user.currentMonthPoints}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <Leaderboard />
                </TabsContent>

                <TabsContent value="history">
                  <PointsHistory />
                </TabsContent>

                <TabsContent value="support" className="space-y-6">
                  {showSupportSuccess ? (
                    <Card className="text-center">
                      <CardContent className="pt-8 pb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <HelpCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Support Request Submitted!</h3>
                        <p className="text-gray-600 mb-6">
                          We've received your request and will get back to you within 24 hours.
                        </p>
                        <Button onClick={() => setShowSupportSuccess(false)} className="w-full">
                          Submit Another Request
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Submit Support Request
                        </CardTitle>
                        <CardDescription>
                          Need help? We're here for you! Submit your question and we'll respond within 24 hours.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSupportSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select value={supportForm.category} onValueChange={(value) => setSupportForm({...supportForm, category: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="technical">Technical Issue</SelectItem>
                                <SelectItem value="billing">Billing & Payments</SelectItem>
                                <SelectItem value="account">Account Issues</SelectItem>
                                <SelectItem value="rewards">Rewards & Points</SelectItem>
                                <SelectItem value="lessons">Lessons & Content</SelectItem>
                                <SelectItem value="general">General Question</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                              id="message"
                              placeholder="Please describe your issue or question in detail..."
                              value={supportForm.message}
                              onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                              rows={6}
                              className="resize-none"
                            />
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isSubmittingSupport}
                          >
                            {isSubmittingSupport ? (
                              <>
                                <Send className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Submit Support Request
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contact Info */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Need immediate help?</h3>
                        <p className="text-sm text-gray-600">
                          Email us directly at{' '}
                          <a href="mailto:support@finboost.com" className="text-blue-600 hover:underline">
                            support@finboost.com
                          </a>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              /* Desktop: Show overview content directly */
              <div className="space-y-6">
                {/* Learning Modules Preview for Desktop */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 sm:mb-0">
                      Lessons
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-fit">
                        {completedModuleIds.length} of {publishedModules.length} completed
                      </Badge>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex gap-2">
                      <select 
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        <option value="Budgeting">Budgeting</option>
                        <option value="Credit">Credit</option>
                        <option value="Investing">Investing</option>
                        <option value="Saving">Saving</option>
                        <option value="Planning">Planning</option>
                        <option value="Taxes">Taxes</option>
                        <option value="Debt">Debt</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publishedModules
                      .filter(module => selectedCategory === "" || module.category === selectedCategory)
                      .slice(0, 6)
                      .map(module => {
                        const isCompleted = completedModuleIds.includes(module.id);
                        return (
                          <Card 
                            key={module.id}
                            className={`transition-all duration-200 hover:shadow-md ${
                          isCompleted ? 'border-green-200 bg-green-50' : 'hover:border-primary-200'
                        }`}
                          >
                            {isCompleted && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-sm leading-tight pr-2">{module.title}</h4>
                                {isCompleted ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="shrink-0">
                                    {module.pointsReward} pts
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{module.content?.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 capitalize">{module.category}</span>
                              </div>
                              <div className="flex items-center justify-end">
                                <Button 
                                    onClick={() => setLocation(`/lesson/${module.id}`)}
                                    size="sm"
                                    variant={isCompleted ? "secondary" : "default"}
                                  >
                                  {isCompleted ? "Review" : "Start Lesson"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Showing {Math.min(6, publishedModules.filter(module => selectedCategory === "" || module.category === selectedCategory).length)} of {selectedCategory === "" ? publishedModules.length : publishedModules.filter(module => module.category === selectedCategory).length} available lessons
                      {selectedCategory && ` in ${selectedCategory}`}
                    </p>

                    {/* Next Lesson Recommendation */}
                    {(() => {
                      const nextLesson = publishedModules
                        .find(module => !completedModuleIds.includes(module.id));

                      if (nextLesson && completedModuleIds.length > 0) {
                        return (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800 mb-2">
                              Next Recommended Lesson:
                            </p>
                            <Button 
                              onClick={() => setLocation(`/lesson/${nextLesson.id}`)}
                              className="mr-2"
                              size="sm"
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              {nextLesson.title}
                            </Button>
                            <span className="text-xs text-blue-600">
                              ({nextLesson.pointsReward} points)
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/education')}
                      className="w-full sm:w-auto"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View All Learning Modules
                    </Button>
                  </div>
                </div>

                <StreakDisplay 
                  currentStreak={user?.currentStreak || 0}
                  longestStreak={user?.longestStreak || 0}
                />

                {/* Points Earning Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="h-5 w-5" />
                      <span>Earn Points for Financial Actions</span>
                    </CardTitle>
                    <CardDescription>
                      Upload proof of your financial progress to earn points and climb the leaderboard!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PointsActions 
                      onPointsEarned={fetchDashboardData}
                      quickWinActions={[]}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Leaderboard Sidebar */}
        {!isMobile && (
          <div className="fixed right-0 top-16 bottom-0 w-80">
            <LeaderboardSidebar />
          </div>
        )}
      </div>

      {/* Expanded Leaderboard Modal */}
      <ExpandedLeaderboard 
        isOpen={showExpandedLeaderboard} 
        onClose={() => setShowExpandedLeaderboard(false)} 
      />
    </div>
  );
}
// Replace Link components with Button components that use setLocation for navigation in the lesson cards.