import { useEffect, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
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
  Settings,
  User as UserIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PointsSummary from "@/components/PointsSummary";
import PointsHistory from "@/components/PointsHistory";
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
  const [activeTab, setActiveTab] = useState("overview");

  // Use React Query for data fetching with proper authentication
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: true
  });

  const user = (userData as any)?.user || userData;

  const { data: leaderboardData } = useQuery({
    queryKey: ['/api/leaderboard'],
    enabled: !!user
  });

  const { data: tierThresholdsData } = useQuery({
    queryKey: ['/api/tiers/thresholds']
  });

  const tierThresholds = (tierThresholdsData as any)?.thresholds;

  const { data: progressData } = useQuery({
    queryKey: ['/api/user/progress'],
    enabled: !!user
  });

  const lessonProgress = (progressData as any)?.progress || progressData || [];

  const LeaderboardSidebar = () => {
    if (!leaderboardData) return null;
    
    return (
      <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Top Performers</h3>
            <div className="space-y-3">
              {(leaderboardData as any)?.tier2?.slice(0, 3).map((entry: any, index: number) => (
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
              {(leaderboardData as any)?.tier3?.slice(0, 5).map((entry: any) => (
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
              {(leaderboardData as any)?.leaderboard?.slice(0, 10).map((entry: any, index: number) => (
                <div key={entry.id} className={`flex items-center justify-between p-2 rounded ${
                  (leaderboardData as any)?.currentUser && entry.id === (leaderboardData as any)?.currentUser.id 
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
            
            {(leaderboardData as any)?.currentUser && (leaderboardData as any)?.currentUser.rank > 10 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-6">#{(leaderboardData as any)?.currentUser.rank}</span>
                    <span className="text-sm font-medium">{(leaderboardData as any)?.currentUser.username} (You)</span>
                  </div>
                  <span className="text-xs text-gray-500">{(leaderboardData as any)?.currentUser.totalPoints}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
              {user?.email === 'lafleur.andrew@gmail.com' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/admin')}
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
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

      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 ${!isMobile ? 'mr-80' : ''}`}>
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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
                  <Trophy className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getTierColor(user?.tier)} text-white capitalize`}>
                      {getTierDisplayName(user?.tier)}
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

            {/* Learning Modules Preview */}
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
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{lesson.description}</p>
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

            {/* Dashboard Content - Only show tabs on mobile */}
            {isMobile ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                  <TabsTrigger value="overview" className="text-xs px-2 py-2">Overview</TabsTrigger>
                  <TabsTrigger value="referrals" className="text-xs px-2 py-2">Referrals</TabsTrigger>
                  <TabsTrigger value="leaderboard" className="text-xs px-2 py-2">Board</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs px-2 py-2">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="space-y-6">
                    <StreakDisplay 
                      currentStreak={user?.currentStreak || 0}
                      longestStreak={user?.longestStreak || 0}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="referrals">
                  <ReferralSystem />
                </TabsContent>

                <TabsContent value="leaderboard">
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