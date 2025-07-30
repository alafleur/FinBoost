import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign, Crown, Target } from 'lucide-react';
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

  const handleProfileClick = () => {
    // Navigate to dashboard with profile tab active
    setLocation('/dashboard?tab=profile');
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!rewardsData || rewardsData.totalCount === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Rewards Overview</h3>
          <p className="text-sm text-gray-600">
            Keep learning and earning points to become eligible for cycle cash rewards
          </p>
        </div>
        <div className="space-y-4">
          <div className="text-center py-6">
            <h4 className="font-semibold text-gray-900 mb-2">Ready to Earn Cash Rewards?</h4>
            <p className="text-gray-600 mb-4">
              Complete financial modules, earn points, and join our cycle winner selection for cash prizes!
            </p>
            
            {/* CTA based on user subscription status */}
            {user?.subscriptionStatus === 'active' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {user?.paypalEmail ? (
                    <DollarSign className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Target className="w-5 h-5 text-gray-600" />
                  )}
                  <h4 className="font-semibold text-gray-900">
                    {user?.paypalEmail ? 'Payment Details Configured' : 'Setup Payment Details'}
                  </h4>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {user?.paypalEmail ? 
                    `Rewards will be sent to ${user.paypalEmail}` : 
                    'Configure your PayPal email to receive cycle rewards'
                  }
                </p>
                <Button 
                  onClick={handleProfileClick}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {user?.paypalEmail ? 'View Profile' : 'Setup Payment Info'}
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Unlock Premium Rewards</h4>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Premium members have better odds and access to exclusive reward tiers
                </p>
                <Button 
                  onClick={handleUpgradeClick}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Upgrade to Premium - $20/month</span>
                  <span className="sm:hidden">Upgrade - $20/mo</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rewards Overview</h3>
        <p className="text-sm text-gray-600">
          Celebrating your financial learning achievements
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold mb-1 text-gray-900">
            ${((rewardsData?.totalEarned || 0) / 100).toFixed(2)}
          </div>
          <p className="text-gray-600 text-sm">Total Earned</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold mb-1 text-gray-900">
            {rewardsData?.totalCount || 0}
          </div>
          <p className="text-gray-600 text-sm">Rewards Received</p>
        </div>
      </div>
        
        {/* CTA based on user subscription status */}
        {user?.subscriptionStatus === 'active' ? (
          <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {user?.paypalEmail ? (
                <DollarSign className="w-5 h-5 text-gray-600" />
              ) : (
                <Target className="w-5 h-5 text-gray-600" />
              )}
              <h4 className="font-semibold text-gray-900">
                {user?.paypalEmail ? 'Setup Rewards Collection Info' : 'Setup Payment Details'}
              </h4>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              {user?.paypalEmail ? 
                'Configure your payment collection information to receive your rewards' : 
                'Configure your PayPal email to receive rewards'
              }
            </p>
            <Button 
              onClick={handleProfileClick}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {user?.paypalEmail ? 'Setup Payment Info' : 'Setup Payment Info'}
            </Button>
          </div>
        ) : (
          <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Unlock Premium Rewards</h4>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Premium members have better odds and access to exclusive reward tiers
            </p>
            <Button 
              onClick={handleUpgradeClick}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Upgrade to Premium - $20/month</span>
              <span className="sm:hidden">Upgrade - $20/mo</span>
            </Button>
          </div>
        )}
    </div>
  );
}