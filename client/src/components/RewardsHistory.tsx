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
  Target,
  Users,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetchRewardsHistory();
    fetchUserData();
  }, []);

  const fetchRewardsHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/cycles/rewards/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRewardsData(data);
      }
    } catch (error) {
      console.error('Error fetching cycle rewards history:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpgradeClick = () => {
    setLocation('/subscribe');
  };

  const handleReferralClick = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/my-code', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const referralLink = `${window.location.origin}/auth?ref=${data.referralCode}`;
        
        if (navigator.share) {
          await navigator.share({
            title: 'Join FinBoost',
            text: `Join me on FinBoost and earn money while building better financial habits! Use my referral code: ${data.referralCode}`,
            url: referralLink
          });
        } else {
          await navigator.clipboard.writeText(referralLink);
          toast({
            title: "Referral link copied!",
            description: "Share it with friends to grow the rewards pool",
          });
        }
      }
    } catch (error) {
      console.error('Error sharing referral:', error);
      toast({
        title: "Error",
        description: "Failed to get referral link",
        variant: "destructive"
      });
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
      case 'tier1': return 'Tier 1';
      case 'tier2': return 'Tier 2';
      case 'tier3': return 'Tier 3';
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
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
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
            
            {/* CTA based on user subscription status */}
            {user?.subscriptionStatus === 'active' ? (
              <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {user?.paypalEmail ? (
                    <DollarSign className="w-5 h-5 text-green-600" />
                  ) : (
                    <Target className="w-5 h-5 text-orange-600" />
                  )}
                  <h4 className="font-semibold text-gray-900">
                    {user?.paypalEmail ? 'Payment Details Configured' : 'Setup Payment Details'}
                  </h4>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {user?.paypalEmail ? 
                    `Rewards will be sent to ${user.paypalEmail}` : 
                    'Configure your PayPal email to receive monthly rewards'
                  }
                </p>
                <Button 
                  onClick={() => setLocation('/dashboard')}
                  className={user?.paypalEmail ? 
                    "bg-green-600 hover:bg-green-700 text-white" : 
                    "bg-orange-600 hover:bg-orange-700 text-white"
                  }
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {user?.paypalEmail ? 'View Profile' : 'Setup Payment Info'}
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">Unlock Premium Rewards</h4>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Premium members have better odds and access to exclusive reward tiers
                </p>
                <Button 
                  onClick={handleUpgradeClick}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Upgrade to Premium - $20/month</span>
                  <span className="sm:hidden">Upgrade - $20/mo</span>
                </Button>
              </div>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                ${((rewardsData?.totalEarned || 0) / 100).toFixed(2)}
              </div>
              <p className="text-green-100 text-sm">Total Earned</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {rewardsData?.totalCount || 0}
              </div>
              <p className="text-green-100 text-sm">Rewards Received</p>
            </div>
          </div>
          
          {/* CTA based on user subscription status */}
          {user?.subscriptionStatus === 'active' ? (
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {user?.paypalEmail ? (
                  <DollarSign className="w-5 h-5 text-green-300" />
                ) : (
                  <Target className="w-5 h-5 text-orange-300" />
                )}
                <h4 className="font-semibold">
                  {user?.paypalEmail ? 'Payment Details Ready' : 'Setup Rewards Collection Info'}
                </h4>
              </div>
              <p className="text-green-100 text-sm mb-3">
                {user?.paypalEmail ? 
                  `Rewards will be sent to ${user.paypalEmail}` : 
                  'Configure your payment collection information to receive your rewards'
                }
              </p>
              <Button 
                onClick={() => {
                  // Use the header Profile button functionality
                  const profileButton = document.querySelector('button[aria-label="View profile and subscription details"]') as HTMLButtonElement;
                  if (profileButton) {
                    profileButton.click();
                  }
                }}
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {user?.paypalEmail ? 'View Profile' : 'Setup Payment Info'}
              </Button>
            </div>
          ) : (
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5" />
                <h4 className="font-semibold">Unlock Higher Rewards</h4>
              </div>
              <p className="text-green-100 text-sm mb-3">
                Premium members have better odds and exclusive reward tiers
              </p>
              <Button 
                onClick={handleUpgradeClick}
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium - $20/month
              </Button>
            </div>
          )}
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
            {rewardsData?.disbursements?.length > 0 ? (
              rewardsData.disbursements.map((disbursement, index) => (
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
              ))
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No rewards yet</p>
                <p className="text-sm text-gray-500">
                  Complete lessons and stay active to earn your first rewards!
                </p>
              </div>
            )}
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