import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign, Crown, Target, Clock, Gift, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type RewardsResponse = {
  summary: {
    paidTotalCents: number;
    pendingTotalCents: number;
    rewardsReceived: number;
  };
  items: Array<{
    cycleId: number;
    cycleLabel: string;
    awardedAt: string | null;
    amountCents: number;
    status: "pending" | "earned" | "paid" | "failed";
    paidAt: string | null;
  }>;
};

function dollars(cents: number | undefined | null) {
  const v = typeof cents === "number" ? cents : 0;
  return `$${(v / 100).toFixed(2)}`;
}

export default function RewardsSummary() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<RewardsResponse["summary"] | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetchRewardsHistory();
    fetchUserData();
  }, []);

  const fetchRewardsHistory = async () => {
    setLoading(true);
    try {
      const ts = `?t=${Date.now()}`;
      let res = await apiRequest("GET", `/api/rewards/history${ts}`);
      if (!res.ok) {
        res = await apiRequest("GET", `/api/cycles/rewards/history${ts}`);
      }
      if (res.ok) {
        const data: RewardsResponse = await res.json();
        setSummary(data.summary);
      } else {
        setSummary({ paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 });
      }
    } catch (e) {
      console.error("Rewards summary fetch failed:", e);
      setSummary({ paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 });
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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const paid = summary?.paidTotalCents ?? 0;
  const pending = summary?.pendingTotalCents ?? 0;
  const count = summary?.rewardsReceived ?? 0;

  if (!summary || (paid === 0 && pending === 0 && count === 0)) {
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
                  className="btn-primary"
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
                  className="btn-primary"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="flex items-start space-x-3">
          <div className="rounded-md bg-gray-100 p-2">
            <DollarSign className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Earned</p>
            <p className="text-2xl font-semibold">{dollars(paid)}</p>
            <p className="text-xs text-gray-500">Paid rewards</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="rounded-md bg-yellow-100 p-2">
            <Clock className="h-5 w-5 text-yellow-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending / Queued</p>
            <p className="text-2xl font-semibold text-yellow-700">{dollars(pending)}</p>
            <p className="text-xs text-gray-500">Awaiting processing</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="rounded-md bg-gray-100 p-2">
            <Gift className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Rewards Received</p>
            <p className="text-2xl font-semibold">{count}</p>
            <p className="text-xs text-gray-500">Count of paid</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
          <a href="/rewards">
            View full rewards
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
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