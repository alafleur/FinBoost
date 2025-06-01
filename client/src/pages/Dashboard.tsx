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
import Leaderboard from "@/components/Leaderboard";
import ReferralSystem from "@/components/ReferralSystem";
import StreakDisplay from "@/components/StreakDisplay";

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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [tierThresholds, setTierThresholds] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLocation('/auth');
      return;
    }

    // Fetch fresh user data from server instead of using cached localStorage data
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setUser(data.user);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setLocation('/auth');
        return;
      }
    })
    .catch(() => {
      setLocation('/auth');
      return;
    });

  }, [setLocation]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    setLocation('/');
  };

  // Handler functions for the learning activities

  const handleShareProgress = async () => {
    setIsLoading(true);
    try {
      // Create a shareable message
      const shareText = `I'm learning financial literacy with FinBoost! Join me on this journey to financial freedom. 💰📈`;

      if (navigator.share) {
        await navigator.share({
          title: 'FinBoost - Financial Learning Journey',
          text: shareText,
          url: window.location.origin
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
        toast({
          title: "Link Copied!",
          description: "Share link copied to clipboard. Paste it on social media to earn points!",
        });
      }

      // Award sharing points
      const response = await fetch('/api/points/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          actionId: 'share-progress',
          points: 10,
          description: 'Shared learning progress'
        })
      });

      if (response.ok) {
        toast({
          title: "Points Earned!",
          description: "You earned 10 points for sharing your progress!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    // Navigate to the lesson page
    setLocation(`/lesson/${lessonId}`);
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.user);
      } else {
        setLocation('/auth');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLocation('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leaderboard?period=monthly&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setLeaderboardData(result);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchTierThresholds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tiers/thresholds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTierThresholds(result.thresholds);
      }
    } catch (error) {
      console.error('Error fetching tier thresholds:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchTierThresholds();
  }, []);

  const LeaderboardSidebar = () => (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Leaderboard</h3>
          <p className="text-sm text-gray-600">Top 20 this month</p>
        </div>

        {/* Tier Thresholds Visual */}
        {tierThresholds && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Current Tier Thresholds</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Tier 1</span>
                </div>
                <span className="font-medium">0+ pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span>Tier 2</span>
                </div>
                <span className="font-medium">{tierThresholds.tier2}+ pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Tier 3</span>
                </div>
                <span className="font-medium">{tierThresholds.tier3}+ pts</span>
              </div>
            </div>
          </div>
        )}

        {/* Top 20 Users */}
        {leaderboardData && (
          <div className="space-y-1">
            {leaderboardData.leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${
                  entry.isCurrentUser 
                    ? 'bg-primary-50 border border-primary-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6">
                    {entry.rank === 1 && <Crown className="h-4 w-4 text-yellow-500" />}
                    {entry.rank === 2 && <Medal className="h-4 w-4 text-gray-400" />}
                    {entry.rank === 3 && <Award className="h-4 w-4 text-orange-600" />}
                    {entry.rank > 3 && (
                      <span className="text-xs font-medium text-gray-500">#{entry.rank}</span>
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${entry.isCurrentUser ? 'text-primary-700' : 'text-gray-900'}`}>
                      {entry.username}
                      {entry.isCurrentUser && <span className="ml-1 text-xs text-primary-500">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{entry.points} pts</p>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    entry.tier === 'tier3' ? 'bg-yellow-100 text-yellow-700' :
                    entry.tier === 'tier2' ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}
                >
                  {entry.tier === 'tier3' ? 'Tier 3' : 
                   entry.tier === 'tier2' ? 'Tier 2' : 'Tier 1'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Your Position (if not in top 20) */}
        {leaderboardData && leaderboardData.currentUser.rank && leaderboardData.currentUser.rank > 20 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6">
                    <span className="text-xs font-medium text-primary-600">#{leaderboardData.currentUser.rank}</span>
                  </div>
                  <div>
                    <p className="font-medium text-primary-700">Your Position</p>
                    <p className="text-xs text-primary-600">{leaderboardData.currentUser.points} pts</p>
                  </div>
                </div>
                <Badge className="bg-primary-100 text-primary-700 text-xs">
                  {leaderboardData.currentUser.tier === 'tier3' ? 'Tier 3' : 
                   leaderboardData.currentUser.tier === 'tier2' ? 'Tier 2' : 'Tier 1'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'bg-yellow-500';
      case 'tier2': return 'bg-gray-400';
      default: return 'bg-orange-600';
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'Tier 3';
      case 'tier2': return 'Tier 2';
      default: return 'Tier 1';
    }
  };

  // Tier progress is now handled by PointsSummary component with dynamic thresholds

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 ${!isMobile ? 'mr-80' : ''}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-primary-600" />
              <h1 className="font-heading font-bold text-2xl text-dark-800">FinBoost</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold">{user?.firstName || user?.username}</p>
              </div>
              <Button variant="outline" onClick={() => setLocation('/support')}>
                Support
              </Button>
              <Button variant="outline" onClick={() => setLocation('/profile')}>
                Profile
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-3xl mb-2">
            Welcome to your FinBoost Dashboard! 🚀
          </h2>
          <p className="text-gray-600">
            Track your progress, earn points, and win monthly rewards for building better financial habits.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

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
              <CardTitle className="text-sm font-medium">Next Tier</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Dynamic</div>
              <p className="text-xs text-muted-foreground">
                Based on monthly rankings
              </p>
            </CardContent>
          </Card>
        </div>



        {/* Tier Progress - Always Visible */}
        <div className="mb-6">
          <PointsSummary 
            user={user} 
            onNavigateToPoints={() => {}}
          />
        </div>

        {/* Earn Points Section - Prominently Displayed */}
        <div className="mb-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Earn Points</h2>
                <p className="text-gray-600">Complete activities to earn points and climb the leaderboard!</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/upload')}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Proof
              </Button>
            </div>

            {/* Daily Progress Tracker */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-green-800">Daily Login Streak</h4>
                    <span className="text-sm text-green-600 font-medium">✓ Active</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">You're maintaining your daily streak!</p>
                  <div className="text-xs text-green-600">+5 points earned automatically today</div>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Share Progress</h4>
                    <span className="text-sm text-green-600 font-medium">+10 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Share your learning journey on social media</p>
                  <Button 
                    onClick={() => handleShareProgress()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Share & Earn
                  </Button>
                </div>
              </div>
            </div>

            {/* Learning Modules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Learning Modules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Budgeting Basics</h4>
                    <span className="text-sm text-green-600 font-medium">+25 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Learn the fundamentals of creating and managing a budget</p>
                  <Button 
                    onClick={() => handleStartLesson('budgeting-basics')}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Emergency Fund</h4>
                    <span className="text-sm text-green-600 font-medium">+30 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Build a safety net for unexpected expenses</p>
                  <Button 
                    onClick={() => handleStartLesson('emergency-fund')}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Investment Basics</h4>
                    <span className="text-sm text-green-600 font-medium">+35 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Introduction to stocks, bonds, and investment strategies</p>
                  <Button 
                    onClick={() => handleStartLesson('investment-basics')}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Credit Management</h4>
                    <span className="text-sm text-green-600 font-medium">+30 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Understanding credit scores and debt management</p>
                  <Button 
                    onClick={() => handleStartLesson('credit-management')}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Retirement Planning</h4>
                    <span className="text-sm text-green-600 font-medium">+40 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Plan for your financial future with retirement strategies</p>
                  <Button 
                    onClick={() => handleStartLesson('retirement-planning')}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Tax Optimization</h4>
                    <span className="text-sm text-green-600 font-medium">+35 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Maximize your tax savings and understand deductions</p>
                  <Button 
                    onClick={() => handleStartLesson('tax-optimization')}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content - Only show tabs on mobile */}
        {isMobile ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="history">Activity</TabsTrigger>
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

// Custom hook to determine if the screen is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // You can adjust the breakpoint as needed
    };

    // Set initial value
    handleResize();

    // Listen for window resize events
    window.addEventListener('resize', handleResize);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
}