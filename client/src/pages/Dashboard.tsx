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
  Medal
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PointsSummary from "@/components/PointsSummary";
import PointsHistory from "@/components/PointsHistory";
import RewardsHistory from "@/components/RewardsHistory";
import Leaderboard from "@/components/Leaderboard";
import ReferralSystem from "@/components/ReferralSystem";
import StreakDisplay from "@/components/StreakDisplay";
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
  const [activeTab, setActiveTab] = useState("overview");

  const LeaderboardSidebar = () => {
    if (!leaderboardData) return null;
    
    return (
      <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Top Performers</h3>
            <div className="space-y-3">
              {leaderboardData.tier2?.slice(0, 3).map((entry: any, index: number) => (
                <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                    {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                    {index === 2 && <Medal className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.username}</p>
                    <p className="text-xs text-gray-500">{entry.totalPoints} points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Silver Tier</h3>
            <div className="space-y-2">
              {leaderboardData.tier3?.slice(0, 5).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm truncate">{entry.username}</span>
                  <span className="text-xs text-gray-500">{entry.totalPoints}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLocation('/login');
          return;
        }

        // Fetch user data
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Fetch lesson progress
        const progressResponse = await fetch('/api/user/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setLessonProgress(progressData.progress || []);
        }

        // Fetch leaderboard data
        const leaderboardResponse = await fetch('/api/leaderboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboardData(leaderboardData);
        }

        // Fetch tier thresholds
        const thresholdsResponse = await fetch('/api/tiers/thresholds');
        if (thresholdsResponse.ok) {
          const thresholdsData = await thresholdsResponse.json();
          setTierThresholds(thresholdsData.thresholds);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setLocation, toast]);

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'bg-gradient-to-r from-gray-200 to-gray-400';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-300 to-yellow-500';
      case 'silver':
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 'bronze':
      default:
        return 'bg-gradient-to-r from-orange-400 to-orange-600';
    }
  };

  const getTierDisplayName = (tier: string) => {
    return tier || 'Bronze';
  };

  // Get the completed lesson IDs from lessonProgress
  const completedLessonIds = lessonProgress.map(progress => {
    const lessonKey = Object.keys(educationContent).find(key => 
      educationContent[key].id === progress.moduleId
    );
    return lessonKey || progress.moduleId.toString();
  });

  console.log('Fetched completed lesson IDs:', completedLessonIds);
  console.log('Total modules loaded:', Object.keys(educationContent).length);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">Loading your dashboard...</p>
            <p className="text-sm text-gray-600">Getting your latest progress and rewards</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with accessibility improvements */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50" role="banner">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" aria-hidden="true" />
              <h1 className="font-heading font-bold text-lg sm:text-2xl text-dark-800">FinBoost</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block" aria-label="User greeting">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold">{user?.firstName || user?.username}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('token');
                  setLocation('/login');
                }}
                aria-label="Logout from account"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isMobile ? (
        /* Mobile Layout with Complete Feature Parity */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full" role="tablist" aria-label="Dashboard navigation">
          {/* Mobile Tab Navigation - Modern Bottom Tab Style */}
          <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
            <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent border-0 p-1 rounded-none">
              <TabsTrigger 
                value="overview" 
                className="flex flex-col items-center gap-1 text-xs px-2 py-3 text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 rounded-lg transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Dashboard overview tab"
              >
                <Activity className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="learn" 
                className="flex flex-col items-center gap-1 text-xs px-2 py-3 text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 rounded-lg transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Learning modules tab"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">Learn</span>
              </TabsTrigger>
              <TabsTrigger 
                value="referrals" 
                className="flex flex-col items-center gap-1 text-xs px-2 py-3 text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 rounded-lg transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Referral system tab"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">Referrals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rewards" 
                className="flex flex-col items-center gap-1 text-xs px-2 py-3 text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 rounded-lg transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Rewards history tab"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">Rewards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className="flex flex-col items-center gap-1 text-xs px-2 py-3 text-gray-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 rounded-lg transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Leaderboard tab"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">Board</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mobile Tab Content with Full Desktop Features */}
          <div className="px-4 py-6 pb-20">
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Welcome Section with improved typography */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-heading font-bold text-xl text-gray-900 mb-1">
                      Welcome back, {user?.firstName || user?.username}!
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Track your progress, earn points, and win monthly rewards for building better financial habits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Stats Cards with improved design */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Trophy className="h-4 w-4 text-orange-600" />
                      </div>
                      <Badge className={`${getTierColor(user?.tier || '')} text-white text-xs font-medium shadow-sm`}>
                        {getTierDisplayName(user?.tier || '')}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Current Tier</h3>
                    <p className="text-xs text-gray-600">Monthly standing</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-amber-100 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Star className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{user?.totalPoints || 0}</div>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Total Points</h3>
                    <p className="text-xs text-gray-600">+{user?.currentMonthPoints || 0} this month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Points Summary - Same Component as Desktop */}
              {user && <PointsSummary user={user as User} />}

              {/* Mobile Streak Display - Same Component as Desktop */}
              <StreakDisplay 
                currentStreak={user?.currentStreak || 0}
                longestStreak={user?.longestStreak || 0}
              />

              {/* Mobile Learning Preview with enhanced design */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-gray-900">Continue Learning</h3>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                    {completedLessonIds.length} of {Object.keys(educationContent).length} completed
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(educationContent).slice(0, 3).map(([key, lesson]) => {
                    const isCompleted = completedLessonIds.includes(key);
                    return (
                      <Card 
                        key={key} 
                        className={`group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                        }`} 
                        onClick={() => setLocation(`/lesson/${key}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-3">
                              <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-1">{lesson.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{lesson.content?.substring(0, 100)}...</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize font-medium">
                                  {lesson.category}
                                </span>
                                {!isCompleted && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                    {lesson.points} pts
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {isCompleted ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium shadow-sm">
                                  ✓ Done
                                </Badge>
                              ) : (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLocation('/education')} 
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View All Learning Modules
                </Button>
              </div>

              {/* Mobile Rewards Preview with enhanced design */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-gray-900">Recent Rewards</h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <RewardsHistory />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="learn" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-gray-900">All Learning Modules</h3>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                    {completedLessonIds.length} of {Object.keys(educationContent).length} completed
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Learning Progress</span>
                    <span className="text-sm text-gray-500">
                      {Math.round((completedLessonIds.length / Object.keys(educationContent).length) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(completedLessonIds.length / Object.keys(educationContent).length) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-3">
                  {Object.entries(educationContent).map(([key, lesson]) => {
                    const isCompleted = completedLessonIds.includes(key);
                    return (
                      <Card 
                        key={key} 
                        className={`group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                        }`} 
                        onClick={() => setLocation(`/lesson/${key}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-3">
                              <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-1">{lesson.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{lesson.content?.substring(0, 100)}...</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize font-medium">
                                  {lesson.category}
                                </span>
                                {!isCompleted && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                    {lesson.points} pts
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {isCompleted ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium shadow-sm">
                                  ✓ Done
                                </Badge>
                              ) : (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="referrals" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-gray-900">Referral System</h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <ReferralSystem />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-gray-900">Rewards History</h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <RewardsHistory />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <Trophy className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-gray-900">Leaderboard</h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <Leaderboard />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        /* Desktop Layout */
        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 mr-80">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
              {/* Welcome Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl mb-2">
                  Welcome to your FinBoost Dashboard! 🚀
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Track your progress, earn points, and win monthly rewards for building better financial habits.
                </p>
              </div>

              {/* Desktop Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
                    <Trophy className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getTierColor(user?.tier || '')} text-white capitalize`}>
                        {getTierDisplayName(user?.tier || '')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monthly standing
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{user?.totalPoints || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{user?.currentMonthPoints || 0} this month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {user && <PointsSummary user={user as User} />}

              {/* Desktop Learning Modules Preview */}
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 sm:mb-0">
                    Continue Learning
                  </h3>
                  <Badge variant="secondary" className="w-fit">
                    {completedLessonIds.length} of {Object.keys(educationContent).length} completed
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(educationContent).slice(0, 6).map(([key, lesson]) => {
                    const isCompleted = completedLessonIds.includes(key);
                    return (
                      <Card 
                        key={key}
                        className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                          isCompleted ? 'border-green-200 bg-green-50' : 'hover:border-primary-200'
                        }`}
                        onClick={() => setLocation(`/lesson/${key}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm leading-tight pr-2">{lesson.title}</h4>
                            {isCompleted ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                                ✓ Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="shrink-0">
                                {lesson.points} pts
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{lesson.content?.substring(0, 100)}...</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 capitalize">{lesson.category}</span>
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
                    Showing 6 of {Object.keys(educationContent).length} available lessons
                  </p>
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

              {/* Desktop Rewards Section */}
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Your Rewards History</h3>
                <RewardsHistory />
              </div>
            </div>
          </div>

          {/* Desktop Leaderboard Sidebar */}
          <div className="fixed right-0 top-0 h-full">
            <LeaderboardSidebar />
          </div>
        </div>
      )}
    </div>
  );
}