import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, TrendingUp, Gift, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CommunityGrowthDialProps {
  poolData: {
    totalPool: number;
    premiumUsers: number;
    totalUsers: number;
  };
  user: {
    subscriptionStatus?: string;
    totalPoints: number;
    currentMonthPoints: number;
  };
  onUpgradeClick: () => void;
}

export default function CommunityGrowthDial({ poolData, user, onUpgradeClick }: CommunityGrowthDialProps) {
  const [rewardsPercentage, setRewardsPercentage] = useState(75);
  const [referralPoints, setReferralPoints] = useState(20);
  const { toast } = useToast();
  
  const isPremiumUser = user.subscriptionStatus === 'active';
  const memberCount = poolData.premiumUsers || 0;
  
  // Fetch current referral points from admin configuration
  useEffect(() => {
    const fetchReferralPoints = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/points/actions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const referralAction = data.actions.find((action: any) => action.actionId === 'referral_signup');
          if (referralAction) {
            setReferralPoints(referralAction.basePoints);
          }
        }
      } catch (error) {
        console.error('Error fetching referral points:', error);
      }
    };

    fetchReferralPoints();
  }, []);

  // Calculate percentage based on member count (similar to landing page logic)
  useEffect(() => {
    const count = memberCount;
    let percentage;

    if (count <= 1000) {
      percentage = 50;
    } else if (count <= 10000) {
      percentage = 50 + ((count - 1000) / 9000) * 10;
    } else if (count <= 25000) {
      percentage = 60 + ((count - 10000) / 15000) * 10;
    } else if (count <= 50000) {
      percentage = 70 + ((count - 25000) / 25000) * 5;
    } else if (count <= 100000) {
      percentage = 75 + ((count - 50000) / 50000) * 5;
    } else {
      percentage = 80 + Math.min(((count - 100000) / 100000) * 5, 5);
    }

    setRewardsPercentage(Math.round(percentage));
  }, [memberCount]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyMobile = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
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
            description: "Share it with friends to earn bonus points",
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

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 mb-6">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-purple-900 mb-2">Strength in Numbers</h3>
          <p className="text-sm text-purple-700">
            The power of our financial community grows stronger every day
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Stats Display */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 text-center">
                <div className="text-sm text-primary-600 font-medium mb-1">Rewards Allocation</div>
                <div className="text-2xl sm:text-3xl font-bold text-primary-700 mb-1">
                  {rewardsPercentage}%
                </div>
                <div className="text-xs text-primary-500">of membership fees</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="text-sm text-green-600 font-medium mb-1">Monthly Pool Size</div>
                <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">
                  <span className="hidden sm:inline">{formatCurrency(poolData.totalPool)}</span>
                  <span className="sm:hidden">{formatCurrencyMobile(poolData.totalPool)}</span>
                </div>
                <div className="text-xs text-green-500">available for rewards</div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              {!isPremiumUser ? (
                <>
                  <div className="text-center mb-4">
                    <Crown className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <h4 className="font-bold text-gray-900 mb-2">Unlock Your Share</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Join {formatNumber(memberCount)} premium members earning real rewards every month
                    </p>
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-green-800">
                        Your potential monthly earnings: <span className="font-bold">${Math.round(poolData.totalPool / Math.max(memberCount, 1) * 0.8)}</span>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Based on current pool size and your {user.currentMonthPoints} points
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={onUpgradeClick}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Join Premium Members - $20/month
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <Gift className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-bold text-gray-900 mb-2">Grow the Community</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Invite friends and earn bonus points for each successful referral
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-blue-800">
                        Earn <span className="font-bold">+{referralPoints} points</span> per referral
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Help friends build wealth while boosting your rewards
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleReferralClick}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Share Referral Link - Earn Points
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Dynamic Donut Chart */}
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Rewards percentage */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${rewardsPercentage * 2.199} ${(100 - rewardsPercentage) * 2.199}`}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "109.95 109.95" }}
                  animate={{ strokeDasharray: `${rewardsPercentage * 2.199} ${(100 - rewardsPercentage) * 2.199}` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-900">{rewardsPercentage}%</div>
                <div className="text-xs text-gray-600 text-center">to rewards</div>
              </div>
            </div>

            {/* Community Stats */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-900">
                  {formatNumber(memberCount)}
                </span>
              </div>
              <p className="text-sm font-medium text-green-800">Premium Members</p>
              <p className="text-xs text-green-600">Building wealth together</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}