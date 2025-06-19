import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, DollarSign, Crown, Target, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface RewardsData {
  disbursements: any[];
  totalEarned: number;
  totalCount: number;
}

export default function RewardsSummary() {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
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
            
            {/* CTA based on user subscription status */}
            {user?.subscriptionStatus === 'active' ? (
              <div className="bg-white rounded-lg p-4 border border-green-200">
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
              <h4 className="font-semibold text-white">
                {user?.paypalEmail ? 'Payment Details Configured' : 'Setup Payment Details'}
              </h4>
            </div>
            <p className="text-green-100 text-sm mb-3">
              {user?.paypalEmail ? 
                `Rewards will be sent to ${user.paypalEmail}` : 
                'Configure your PayPal email to receive rewards'
              }
            </p>
            <Button 
              onClick={() => setLocation('/dashboard')}
              className={user?.paypalEmail ? 
                "bg-green-600 hover:bg-green-700 text-white border-green-500" : 
                "bg-orange-600 hover:bg-orange-700 text-white border-orange-500"
              }
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {user?.paypalEmail ? 'View Profile' : 'Setup Payment Info'}
            </Button>
          </div>
        ) : (
          <div className="text-center bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-300" />
              <h4 className="font-semibold text-white">Unlock Premium Rewards</h4>
            </div>
            <p className="text-green-100 text-sm mb-3">
              Premium members have better odds and access to exclusive reward tiers
            </p>
            <Button 
              onClick={handleUpgradeClick}
              className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500"
            >
              <Crown className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Upgrade to Premium - $20/month</span>
              <span className="sm:hidden">Upgrade - $20/mo</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}