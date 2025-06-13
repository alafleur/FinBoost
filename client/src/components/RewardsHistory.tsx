import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Crown,
  Sparkles,
  Gift,
  Medal,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Disbursement {
  id: number;
  amount: number;
  currency: string;
  status: string;
  tier: string;
  processedAt: string;
  reason: string;
  cycleName: string;
}

interface RewardsData {
  disbursements: Disbursement[];
  totalEarned: number;
  totalCount: number;
}

export default function RewardsHistory() {
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRewardsHistory();
  }, []);

  const fetchRewardsHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/rewards/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRewardsData(data);
      }
    } catch (error) {
      console.error('Error fetching rewards history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'tier3': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'tier2': return <Medal className="w-4 h-4 text-gray-500" />;
      case 'tier1': return <Target className="w-4 h-4 text-orange-500" />;
      default: return <Trophy className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'Gold Tier';
      case 'tier2': return 'Silver Tier';
      case 'tier1': return 'Bronze Tier';
      default: return 'Member';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-500" />
            Rewards History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rewardsData || rewardsData.totalCount === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Sparkles className="w-5 h-5" />
            Your Rewards Journey Starts Here!
          </CardTitle>
          <CardDescription className="text-green-600">
            Keep learning and earning points to become eligible for monthly cash rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Ready to Earn Cash Rewards?</h3>
            <p className="text-gray-600 mb-4">
              Complete financial modules, earn points, and join our monthly winner selection for cash prizes!
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Learn & Earn</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium">Climb Tiers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">Win Cash</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5" />
            Your Rewards Success Story
          </CardTitle>
          <CardDescription className="text-green-100">
            Celebrating your financial learning achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                ${(rewardsData.totalEarned / 100).toFixed(2)}
              </div>
              <p className="text-green-100 text-sm">Total Earned</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {rewardsData.totalCount}
              </div>
              <p className="text-green-100 text-sm">Rewards Received</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {rewardsData.disbursements.filter(d => d.status === 'success').length}
              </div>
              <p className="text-green-100 text-sm">Successful Payouts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Reward History
          </CardTitle>
          <CardDescription>
            Your complete reward disbursement timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rewardsData.disbursements.map((disbursement, index) => (
              <div 
                key={disbursement.id} 
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getTierIcon(disbursement.tier)}
                    <div>
                      <div className="font-semibold text-lg text-green-600">
                        ${(disbursement.amount / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {disbursement.cycleName}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTierIcon(disbursement.tier)}
                      {getTierLabel(disbursement.tier)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusColor(disbursement.status)}>
                    {disbursement.status === 'success' ? 'Paid' : 
                     disbursement.status === 'pending' ? 'Processing' : 
                     'Failed'}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(disbursement.processedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Encouragement Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Sparkles className="w-5 h-5" />
            Keep Going, You're Doing Amazing!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-purple-600 mb-4">
              Every module you complete brings you closer to your next reward. 
              Your financial education journey is paying off - literally!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-purple-500">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Keep Learning
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Climb Higher
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Earn More
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}