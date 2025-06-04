import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AdditiveLogo } from "@/components/ui/additive-logo";
import PointsSummary from "@/components/PointsSummary";
import PointsHistory from "@/components/PointsHistory";
import Leaderboard from "@/components/Leaderboard";
import ReferralSystem from "@/components/ReferralSystem";
import StreakDisplay from "@/components/StreakDisplay";
import PointsActions from "@/components/PointsActions";
import { educationContent } from "@/data/educationContent";

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
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-orange-700 font-semibold">Tier 3</span>
                <span className="text-orange-600">{tierThresholds?.tier3 || 150}+ pts</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-orange-700 font-semibold">Tier 2</span>
                <span className="text-orange-600">{tierThresholds?.tier2 || 50} - {tierThresholds?.tier3 > 0 ? tierThresholds.tier3 - 1 : '149'} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-orange-700 font-semibold">Tier 1</span>
                <span className="text-orange-600">0 - {tierThresholds?.tier2 > 0 ? tierThresholds.tier2 - 1 : '49'} pts</span>
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
    fetchUserData();
    fetchLeaderboardData();
    fetchTierThresholds();
    fetchLessonProgress();
    fetchPoolData();
    fetchDistributionInfo();
  }, []);

  // Update countdown timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (distributionInfo) {
        fetchDistributionInfo();
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [distributionInfo]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const fetchTierThresholds = async () => {
    try {
      const response = await fetch('/api/tiers/thresholds');
      if (response.ok) {
        const data = await response.json();
        setTierThresholds(data);
      }
    } catch (error) {
      console.error('Error fetching tier thresholds:', error);
    }
  };

  const fetchLessonProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Raw progress data:', data.progress);
        setLessonProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
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

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'tier3':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'tier2':
        return 'bg-gradient-to-r from-slate-400 toslate-600';
      case 'tier1':
      default:
        return 'bg-gradient-to-r from-orange-400 to-orange-600';
    }
  };

  const getTierDisplayName = (tier: string) => {
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

  const completedLessonIds = lessonProgress
    .filter(progress => progress.completed)
    .map(progress => moduleToLessonMap[progress.moduleId] || progress.moduleId.toString());

  console.log('Fetched completed lesson IDs:', completedLessonIds);
  console.log('Total modules loaded:', Object.keys(educationContent).length);

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
            <div className="flex items-center space-x-3">
              <AdditiveLogo className="h-6 w-6 sm:h-8 sm:w-8 text-slate-700" />
              <h1 className="font-heading font-bold text-lg sm:text-2xl text-slate-800">ADDITIVE</h1>
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

            {/* Monthly Reward Pool */}
            <div className="mb-6 sm:mb-8">
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-purple-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Monthly Reward Pool
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    Community funds distributed monthly based on participation and achievement
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Pool */}
                    <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-purple-800 mb-1">Total Pool</h4>
                        <div className="text-2xl font-bold text-purple-900">
                          ${poolData ? poolData.totalPool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">55% of monthly fees</p>
                      </div>
                    </div>

                    {/* Tier 3 Pool */}
                    <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-4 border border-orange-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-orange-800 mb-1">Tier 3 Pool</h4>
                        <div className="text-xl font-bold text-orange-900">
                          ${poolData ? poolData.tier3Pool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-orange-600 mt-1">Top 33% performers</p>
                      </div>
                    </div>

                    {/* Tier 2 Pool */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-orange-800 mb-1">Tier 2 Pool</h4>
                        <div className="text-xl font-bold text-orange-900">
                          ${poolData ? poolData.tier2Pool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-orange-600 mt-1">Middle 33% performers</p>
                      </div>
                    </div>

                    {/* Tier 1 Pool */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-orange-800 mb-1">Tier 1 Pool</h4>
                        <div className="text-xl font-bold text-orange-900">
                          ${poolData ? poolData.tier1Pool.toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-orange-600 mt-1">Bottom 33% performers</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    {distributionInfo ? (
                      <div className="text-center">
                        <div className="text-sm text-blue-800 mb-2">
                          <span className="font-semibold">Next payout:</span> {new Date(distributionInfo.nextDate).toLocaleDateString()}
                        </div>
                        <div className="flex justify-center items-center gap-4 text-xs">
                          <div className="bg-blue-100 px-2 py-1 rounded">
                            <span className="font-bold text-blue-900">{distributionInfo.timeRemaining.days}</span>
                            <span className="text-blue-700 ml-1">days</span>
                          </div>
                          <div className="bg-blue-100 px-2 py-1 rounded">
                            <span className="font-bold text-blue-900">{distributionInfo.timeRemaining.hours}</span>
                            <span className="text-blue-700 ml-1">hrs</span>
                          </div>
                          <div className="bg-blue-100 px-2 py-1 rounded">
                            <span className="font-bold text-blue-900">{distributionInfo.timeRemaining.minutes}</span>
                            <span className="text-blue-700 ml-1">min</span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          Based on {poolData ? poolData.totalUsers.toLocaleString() : '0'} active members at ${poolData ? poolData.monthlyFee : '20'}/month
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-800 text-center">
                        <span className="font-semibold">Next payout:</span> End of month • Based on {poolData ? poolData.totalUsers.toLocaleString() : '0'} active members at ${poolData ? poolData.monthlyFee : '20'}/month
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Monthly Tier</CardTitle>
                  <Trophy className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={`${getTierColor(user?.tier)} text-white capitalize text-lg px-3 py-1`}>
                      {getTierDisplayName(user?.tier)}
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

              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Progress</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">
                    {Object.keys(educationContent).length > 0 ? Math.round((completedLessonIds.length / Object.keys(educationContent).length) * 100) : 0}%
                  </div>
                  <p className="text-xs text-blue-700">
                    {completedLessonIds.length} of {Object.keys(educationContent).length} lessons
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Available Points</CardTitle>
                  <Star className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800">
                    {(() => {
                      const uncompletedLessons = Object.values(educationContent).filter(lesson => 
                        !completedLessonIds.includes(lesson.id)
                      );
                      return uncompletedLessons.reduce((total, lesson) => total + lesson.points, 0);
                    })()}
                  </div>
                  <p className="text-xs text-purple-700">
                    Points to earn
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Learning Modules Preview */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 sm:mb-0">
                  Lessons
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-fit">
                    {completedLessonIds.length} of {Object.keys(educationContent).length} completed
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
                {Object.entries(educationContent)
                  .filter(([key, lesson]) => selectedCategory === "" || lesson.category === selectedCategory)
                  .slice(0, isMobile ? 3 : 6)
                  .map(([key, lesson]) => {
                    const isCompleted = completedLessonIds.includes(key);
                    return (
                      <Card 
                        key={key}
                        className={`transition-all duration-200 hover:shadow-md cursor-pointer relative ${
                          isCompleted ? 'border-green-200 bg-green-50' : 'hover:border-primary-200'
                        }`}
                        onClick={() => setLocation(`/lesson/${key}`)}
                      >
                        {isCompleted && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm leading-tight pr-2">{lesson.title}</h4>
                            {isCompleted ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="shrink-0">
                                {lesson.points} pts
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{lesson.description}</p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 capitalize">{lesson.category}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {lesson.difficulty}
                            </Badge>
                            <Button size="sm" variant={isCompleted ? "secondary" : "default"}>
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
                  Showing {Math.min(isMobile ? 3 : 6, Object.entries(educationContent).filter(([key, lesson]) => selectedCategory === "" || lesson.category === selectedCategory).length)} of {selectedCategory === "" ? Object.keys(educationContent).length : Object.entries(educationContent).filter(([key, lesson]) => lesson.category === selectedCategory).length} available lessons
                  {selectedCategory && ` in ${selectedCategory}`}
                </p>
                
                {/* Next Lesson Recommendation */}
                {(() => {
                  const nextLesson = Object.entries(educationContent)
                    .find(([key, lesson]) => !completedLessonIds.includes(key));
                  
                  if (nextLesson && completedLessonIds.length > 0) {
                    return (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Next Recommended Lesson:
                        </p>
                        <Button 
                          onClick={() => setLocation(`/lesson/${nextLesson[0]}`)}
                          className="mr-2"
                          size="sm"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          {nextLesson[1].title}
                        </Button>
                        <span className="text-xs text-blue-600">
                          ({nextLesson[1].points} points)
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
                  size={isMobile ? "sm" : "default"}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View All Learning Modules
                </Button>
              </div>
            </div>

            {/* Dashboard Content - Only show tabs on mobile */}
            {isMobile ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-auto">
                  <TabsTrigger value="overview" className="text-xs px-1 py-2">Overview</TabsTrigger>
                  <TabsTrigger value="earn" className="text-xs px-1 py-2">Earn</TabsTrigger>
                  <TabsTrigger value="referrals" className="text-xs px-1 py-2">Referrals</TabsTrigger>
                  <TabsTrigger value="leaderboard" className="text-xs px-1 py-2">Board</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs px-1 py-2">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="space-y-6">
                    <StreakDisplay 
                      currentStreak={user?.currentStreak || 0}
                      longestStreak={user?.longestStreak || 0}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="earn">
                  <PointsActions 
                    onPointsEarned={fetchUserData}
                    quickWinActions={[]}
                  />
                </TabsContent>

                <TabsContent value="referrals">
                  <ReferralSystem />
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <h3 className="font-heading font-bold text-lg mb-4 text-gray-800">Tier Thresholds</h3>
                    <p className="text-xs text-gray-600 mb-3">Dynamic thresholds based on user percentiles</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-yellow-700 font-semibold">Tier 3</span>
                        <span className="text-yellow-600">{tierThresholds?.tier3 || 150}+ pts</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-slate-700 font-semibold">Tier 2</span>
                        <span className="text-slate-600">{tierThresholds?.tier2 || 50} - {tierThresholds?.tier3 > 0 ? tierThresholds.tier3 - 1 : '149'} pts</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <span className="text-orange-700 font-semibold">Tier 1</span>
                        <span className="text-orange-600">0 - {tierThresholds?.tier2 > 0 ? tierThresholds.tier2 - 1 : '49'} pts</span>
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
                  <Leaderboard />
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Points History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PointsHistory />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              /* Desktop: Show overview content directly */
              <div className="space-y-6">
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
                      onPointsEarned={fetchUserData}
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
    </div>
  );
}