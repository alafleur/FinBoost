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
                  <span className="text-sm">{entry.username}</span>
                  <span className="text-xs text-gray-500">{entry.totalPoints}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Full Leaderboard</h3>
            <div className="space-y-2">
              {leaderboardData.leaderboard?.slice(0, 10).map((entry: any, index: number) => (
                <div key={entry.id} className={`flex items-center justify-between p-2 rounded ${
                  leaderboardData.currentUser && entry.id === leaderboardData.currentUser.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-6">#{index + 1}</span>
                    <span className="text-sm">{entry.username}</span>
                  </div>
                  <span className="text-xs text-gray-500">{entry.totalPoints}</span>
                </div>
              ))}
            </div>
            
            {leaderboardData.currentUser && leaderboardData.currentUser.rank > 10 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-6">#{leaderboardData.currentUser.rank}</span>
                    <span className="text-sm font-medium">{leaderboardData.currentUser.username} (You)</span>
                  </div>
                  <span className="text-xs text-gray-500">{leaderboardData.currentUser.totalPoints}</span>
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
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch('/api/leaderboard');
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
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const data = await response.json();
        console.log('Raw progress data:', data);
        setLessonProgress(data);
      }
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
    }
  };

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
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <h1 className="font-heading font-bold text-lg sm:text-2xl text-dark-800">FinBoost</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold">{user?.firstName || user?.username}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/profile')}
              >
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Navigation - At top of page */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="px-4">
            <div className="grid grid-cols-5 h-auto">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`text-xs px-1 py-3 border-b-2 transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-blue-50 text-blue-700 border-blue-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('learn')}
                className={`text-xs px-1 py-3 border-b-2 transition-colors ${
                  activeTab === 'learn' 
                    ? 'bg-blue-50 text-blue-700 border-blue-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Learn
              </button>
              <button 
                onClick={() => setActiveTab('referrals')}
                className={`text-xs px-1 py-3 border-b-2 transition-colors ${
                  activeTab === 'referrals' 
                    ? 'bg-blue-50 text-blue-700 border-blue-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Referrals
              </button>
              <button 
                onClick={() => setActiveTab('rewards')}
                className={`text-xs px-1 py-3 border-b-2 transition-colors ${
                  activeTab === 'rewards' 
                    ? 'bg-blue-50 text-blue-700 border-blue-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Rewards
              </button>
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`text-xs px-1 py-3 border-b-2 transition-colors ${
                  activeTab === 'leaderboard' 
                    ? 'bg-blue-50 text-blue-700 border-blue-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Board
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 ${!isMobile ? 'mr-80' : ''}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Mobile Tab Content */}
            {isMobile ? (
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Welcome Section */}
                    <div className="mb-6">
                      <h2 className="font-heading font-bold text-xl mb-2">
                        Welcome to your FinBoost Dashboard! 🚀
                      </h2>
                      <p className="text-sm text-gray-600">
                        Track your progress, earn points, and win monthly rewards for building better financial habits.
                      </p>
                    </div>

                    {/* Stats Overview for Mobile */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
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

                    <StreakDisplay 
                      currentStreak={user?.currentStreak || 0}
                      longestStreak={user?.longestStreak || 0}
                    />
                  </div>
                )}

                {activeTab === 'learn' && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="font-heading font-bold text-lg mb-2 sm:mb-0">
                          Continue Learning
                        </h3>
                        <Badge variant="secondary" className="w-fit">
                          {completedLessonIds.length} of {Object.keys(educationContent).length} completed
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4">
                        {Object.entries(educationContent).slice(0, 3).map(([key, lesson]) => (
                          <Card key={key} className="border hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm mb-1">{lesson.title}</h4>
                                  <div className="flex items-center text-xs text-gray-500 mb-2">
                                    <span className="capitalize">{lesson.category}</span>
                                    <span className="mx-2">•</span>
                                    <span>{lesson.points} pts</span>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => window.location.href = `/learning/${key}`}
                                  disabled={completedLessonIds.includes(key)}
                                >
                                  {completedLessonIds.includes(key) ? 'Completed' : 'Start Lesson'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="text-center mt-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Showing 3 of {Object.keys(educationContent).length} available lessons
                        </p>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = '/learning'}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          View All Learning Modules
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'referrals' && <ReferralSystem />}
                {activeTab === 'rewards' && <RewardsHistory />}
                {activeTab === 'leaderboard' && <Leaderboard />}
              </div>
            ) : (
              /* Desktop: Show welcome section normally */
              <div>
                {/* Welcome Section */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl mb-2">
                    Welcome to your FinBoost Dashboard! 🚀
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Track your progress, earn points, and win monthly rewards for building better financial habits.
                  </p>
                </div>
              </div>
            )}

            {/* Desktop Only: Stats Overview */}
            {!isMobile && (
              <>
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

                <PointsSummary user={user as User} />
              </>
            )}

            {/* Desktop Only: Learning Modules Preview */}
            {!isMobile && (
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
                {Object.entries(educationContent)
                  .slice(0, isMobile ? 3 : 6)
                  .map(([key, lesson]) => {
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
                  Showing {isMobile ? 3 : 6} of {Object.keys(educationContent).length} available lessons
                </p>
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
            )}

            {/* Desktop Only: Show overview content directly */}
            {!isMobile && (
              <div className="space-y-6">
                <StreakDisplay 
                  currentStreak={user?.currentStreak || 0}
                  longestStreak={user?.longestStreak || 0}
                />
                
                {/* Desktop Rewards Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Your Rewards History</h3>
                  <RewardsHistory />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Leaderboard Sidebar */}
        {!isMobile && (
          <div className="fixed right-0 top-0 h-full">
            <LeaderboardSidebar />
          </div>
        )}
      </div>
    </div>
  );
}