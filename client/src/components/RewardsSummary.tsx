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

  // Temporary alert until profile tab navigation is fixed
  const handleProfileClick = () => {
    alert("Please update your PayPal email using the Profile button in the header.");
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (!rewardsData || rewardsData.totalCount === 0) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Rewards Overview</h3>
          <p className="text-base text-gray-700 font-medium">
            Celebrating your financial learning achievements
          </p>
        </div>
        <div className="space-y-6">
          <div className="text-center py-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4">Ready to Earn Cash Rewards?</h4>
            <p className="text-base text-gray-700 font-medium mb-6">
              Complete financial modules, earn points, and join our cycle winner selection for cash prizes!
            </p>
            
            {/* CTA based on user subscription status */}
            {user?.subscriptionStatus === 'active' ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-4">
                  {user?.paypalEmail ? (
                    <DollarSign className="w-6 h-6 text-green-600" />
                  ) : (
                    <Target className="w-6 h-6 text-green-600" />
                  )}
                  <h4 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {user?.paypalEmail ? 'Payment Details Configured' : 'Setup Payment Details'}
                  </h4>
                </div>
                <p className="text-green-700 font-medium text-center mb-6">
                  {user?.paypalEmail ? 
                    `Rewards will be sent to ${user.paypalEmail}` : 
                    'Configure your PayPal email to receive cycle rewards'
                  }
                </p>
                <Button 
                  onClick={handleProfileClick}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  {user?.paypalEmail ? 'View Profile' : 'Setup Payment Info'}
                </Button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-yellow-600" />
                  <h4 className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">Unlock Premium Rewards</h4>
                </div>
                <p className="text-yellow-700 font-medium text-center mb-6">
                  Premium members have better odds and access to exclusive reward tiers
                </p>
                <Button 
                  onClick={handleUpgradeClick}
                  className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Crown className="w-5 h-5 mr-2" />
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
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Rewards Overview</h3>
        <p className="text-base text-gray-700 font-medium">
          Celebrating your financial learning achievements
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center shadow-lg">
          <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            ${((rewardsData?.totalEarned || 0) / 100).toFixed(2)}
          </div>
          <p className="text-green-700 font-semibold">Total Earned</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-center shadow-lg">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {rewardsData?.totalCount || 0}
          </div>
          <p className="text-blue-700 font-semibold">Rewards Received</p>
        </div>
      </div>
        
        {/* CTA based on user subscription status */}
        {user?.subscriptionStatus === 'active' ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              {user?.paypalEmail ? (
                <DollarSign className="w-6 h-6 text-green-600" />
              ) : (
                <Target className="w-6 h-6 text-green-600" />
              )}
              <h4 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {user?.paypalEmail ? 'Setup Rewards Collection Info' : 'Setup Payment Details'}
              </h4>
            </div>
            <p className="text-green-700 font-medium mb-6">
              {user?.paypalEmail ? 
                'Configure your payment collection information to receive your rewards' : 
                'Configure your PayPal email to receive rewards'
              }
            </p>
            <Button 
              onClick={handleProfileClick}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {user?.paypalEmail ? 'Setup Payment Info' : 'Setup Payment Info'}
            </Button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-yellow-600" />
              <h4 className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">Unlock Premium Rewards</h4>
            </div>
            <p className="text-yellow-700 font-medium mb-6">
              Premium members have better odds and access to exclusive reward tiers
            </p>
            <Button 
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Crown className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Upgrade to Premium - $20/month</span>
              <span className="sm:hidden">Upgrade - $20/mo</span>
            </Button>
          </div>
        )}
    </div>
  );
}