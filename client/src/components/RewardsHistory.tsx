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
  summary: {
    paidTotalCents: number;
    pendingTotalCents: number;
    rewardsReceived: number;
  };
  items: {
    cycleId: number;
    cycleLabel: string | null;
    awardedAt: string | null;
    amountCents: number;
    status: "pending" | "earned" | "paid" | "failed";
    paidAt: string | null;
  }[];
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
            <Gift className="w-5 h-5 text-blue-600" />
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
      <Card className="bg-white border border-gray-200 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Your Rewards Journey Starts Here!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Keep learning and earning tickets to become eligible for monthly cash rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Ready to Earn Cash Rewards?</h3>
            <p className="text-gray-600 mb-4">
              Complete financial modules, earn tickets, and join our monthly winner selection for cash prizes!
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Learn & Earn</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Climb Tiers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Win Cash</p>
              </div>
            </div>
            
            {/* CTA based on user subscription status */}
            {user?.subscriptionStatus === 'active' ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {user?.paypalEmail ? (
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Target className="w-5 h-5 text-blue-600" />
                  )}
                  <h4 className="font-semibold text-gray-900">
                    {user?.paypalEmail ? 'Payment Details Configured' : 'Setup Payment Details'}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {user?.paypalEmail ? 
                    `Rewards will be sent to ${user.paypalEmail}` : 
                    'Configure your PayPal email to receive monthly rewards'
                  }
                </p>
                <Button 
                  onClick={() => setLocation('/dashboard')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {user?.paypalEmail ? 'View Profile' : 'Setup Payment Info'}
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Unlock Premium Rewards</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Premium members have better odds and access to exclusive reward tiers
                </p>
                <Button 
                  onClick={handleUpgradeClick}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
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
      <Card className="bg-white border border-gray-200 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Trophy className="w-5 h-5 text-blue-600" />
            Your Rewards Success Story
          </CardTitle>
          <CardDescription className="text-gray-600">
            Celebrating your financial learning achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-gray-900">
                ${((rewardsData?.summary.paidTotalCents || 0) / 100).toFixed(2)}
              </div>
              <p className="text-gray-600 text-sm">Total Earned</p>
              <p className="text-xs text-gray-500">Paid rewards</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-yellow-600">
                ${((rewardsData?.summary.pendingTotalCents || 0) / 100).toFixed(2)}
              </div>
              <p className="text-gray-600 text-sm">Pending / Queued</p>
              <p className="text-xs text-gray-500">Awaiting processing</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-gray-900">
                {rewardsData?.summary.rewardsReceived || 0}
              </div>
              <p className="text-gray-600 text-sm">Rewards Received</p>
              <p className="text-xs text-gray-500">Count of paid</p>
            </div>
          </div>
          
          {/* CTA based on user subscription status */}
          {user?.subscriptionStatus === 'active' ? (
            <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                {user?.paypalEmail ? (
                  <DollarSign className="w-5 h-5 text-blue-600" />
                ) : (
                  <Target className="w-5 h-5 text-blue-600" />
                )}
                <h4 className="font-semibold text-gray-900">
                  {user?.paypalEmail ? 'Setup Rewards Collection Info' : 'Setup Rewards Collection Info'}
                </h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {user?.paypalEmail ? 
                  'Configure your payment collection information to receive your rewards' : 
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
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Setup Payment Info
              </Button>
            </div>
          ) : (
            <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Unlock Higher Rewards</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Premium members have better odds and exclusive reward tiers
              </p>
              <Button 
                onClick={handleUpgradeClick}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
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
                        <div className="font-semibold text-lg text-blue-600">
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
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Sparkles className="w-5 h-5" />
            Keep Going, You're Doing Amazing!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-blue-600 mb-4">
              Every module you complete brings you closer to your next reward. 
              Your financial education journey is paying off - literally!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-blue-600">
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