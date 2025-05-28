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
  Activity
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
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      setLocation('/auth');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      setLocation('/auth');
    }
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
  const handleDailyLogin = async () => {
    setIsLoading(true);
    try {
      // Award daily login points
      const response = await fetch('/api/points/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          actionId: 'daily-login',
          points: 5,
          description: 'Daily login bonus'
        })
      });

      if (response.ok) {
        toast({
          title: "Points Earned!",
          description: "You earned 5 points for logging in today!",
        });
        // Refresh user data to show updated points
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to award points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleStartLesson = async (lessonId: string) => {
    setIsLoading(true);
    try {
      // Navigate to lesson page or open lesson modal
      toast({
        title: "Lesson Starting!",
        description: "Opening your learning module...",
      });
      
      // For now, award points immediately (in a real app, this would happen after lesson completion)
      const pointsMap: { [key: string]: number } = {
        'budgeting-basics': 25,
        'emergency-fund': 30,
        'investment-basics': 35,
        'credit-management': 30,
        'retirement-planning': 40,
        'tax-optimization': 35
      };

      const response = await fetch('/api/points/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          actionId: `lesson-${lessonId}`,
          points: pointsMap[lessonId] || 25,
          description: `Completed lesson: ${lessonId.replace('-', ' ')}`
        })
      });

      if (response.ok) {
        toast({
          title: "Lesson Completed!",
          description: `You earned ${pointsMap[lessonId] || 25} points for completing this lesson!`,
        });
        // Refresh to show updated points
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeeklyChallenge = async (challengeId: string) => {
    setIsLoading(true);
    try {
      toast({
        title: "Challenge Started!",
        description: "Your weekly challenge has begun. Complete it to earn bonus points!",
      });

      const pointsMap: { [key: string]: number } = {
        'budget-tracker': 50,
        'savings-goal': 75
      };

      // For demo purposes, award points immediately
      const response = await fetch('/api/points/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          actionId: `challenge-${challengeId}`,
          points: pointsMap[challengeId] || 50,
          description: `Completed weekly challenge: ${challengeId.replace('-', ' ')}`
        })
      });

      if (response.ok) {
        toast({
          title: "Challenge Completed!",
          description: `Amazing! You earned ${pointsMap[challengeId] || 50} points for completing this challenge!`,
        });
        // Refresh to show updated points
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      default: return 'bg-orange-600';
    }
  };

  const getNextTierPoints = () => {
    switch (user.tier) {
      case 'bronze': return 100;
      case 'silver': return 250;
      case 'gold': return 500;
      default: return 100;
    }
  };

  const progressToNextTier = Math.min((user.currentMonthPoints / getNextTierPoints()) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50">
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
                <p className="font-semibold">{user.firstName || user.username}</p>
              </div>
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
                <Badge className={`${getTierColor(user.tier)} text-white capitalize`}>
                  {user.tier}
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
              <div className="text-2xl font-bold">{getNextTierPoints() - user.currentMonthPoints}</div>
              <p className="text-xs text-muted-foreground">
                Points needed
              </p>
            </CardContent>
          </Card>
        </div>



        {/* Tier Progress - Always Visible */}
        <div className="mb-6">
          <PointsSummary 
            user={user} 
            onNavigateToPoints={() => setActiveTab("earn-points")}
          />
        </div>

        {/* Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earn-points">Earn Points</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="history">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StreakDisplay 
              currentStreak={user.currentStreak || 0}
              longestStreak={user.longestStreak || 0}
            />
</div>
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation('/education')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setLocation('/upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Proof
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => document.querySelector('[value="referrals"]')?.click()}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Refer Friends
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="earn-points">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Earn Points</h2>
            <p className="text-gray-600">Complete activities to earn points and climb the leaderboard!</p>
            
            {/* Daily Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Daily Login</h4>
                    <span className="text-sm text-green-600 font-medium">+5 points</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Log in daily to maintain your streak</p>
                  <Button 
                    onClick={() => handleDailyLogin()}
                    disabled={isLoading || user?.lastLoginDate === new Date().toDateString()}
                    className="w-full"
                  >
                    {user?.lastLoginDate === new Date().toDateString() ? "✓ Completed Today" : "Claim Points"}
                  </Button>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </div>
              </div>
            </div>

            {/* Weekly Challenges */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Weekly Challenges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg border-purple-200 bg-purple-50 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-purple-800">Budget Tracker Challenge</h4>
                    <span className="text-sm text-purple-600 font-medium">+50 points</span>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">Track your expenses for 7 days and submit a summary</p>
                  <Button 
                    onClick={() => handleWeeklyChallenge('budget-tracker')}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Start Challenge
                  </Button>
                </div>

                <div className="p-4 border rounded-lg border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-blue-800">Savings Goal Challenge</h4>
                    <span className="text-sm text-blue-600 font-medium">+75 points</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">Set and achieve a weekly savings target</p>
                  <Button 
                    onClick={() => handleWeeklyChallenge('savings-goal')}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Start Challenge
                  </Button>
                </div>
              </div>
            </div>
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
      </div>
    </div>
  );
}