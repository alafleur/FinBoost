
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  totalPoints: number;
  currentMonthPoints: number;
  tier: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.totalPoints}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.currentMonthPoints}</div>
              <p className="text-xs text-muted-foreground">
                Points this cycle
              </p>
            </CardContent>
          </Card>

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

        {/* Tier Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Tier Progress</span>
            </CardTitle>
            <CardDescription>
              Your progress toward the next tier this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{user.tier} Tier</span>
                <span>{user.currentMonthPoints}/{getNextTierPoints()} points</span>
              </div>
              <Progress value={progressToNextTier} className="h-3" />
              <p className="text-sm text-gray-600">
                {progressToNextTier >= 100 
                  ? "🎉 Congratulations! You've reached the next tier!" 
                  : `${getNextTierPoints() - user.currentMonthPoints} more points to reach the next tier`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/education')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <span>Financial Education Hub</span>
              </CardTitle>
              <CardDescription>
                Complete tutorials and quizzes to earn points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Start Learning
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/upload')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-green-500" />
                <span>Upload Proof</span>
              </CardTitle>
              <CardDescription>
                Submit proof of financial actions for bonus points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Upload Evidence
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/rewards')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Rewards & Pool</span>
              </CardTitle>
              <CardDescription>
                View reward tiers and current pool status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Rewards
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
