import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, TrendingUp, Gift, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DashboardColors } from "@/lib/colors";

interface CommunityGrowthDialProps {
  poolData: {
    totalPool: number;
    premiumUsers: number;
    totalUsers: number;
    rewardPoolPercentage?: number;
    minimumPoolGuarantee?: number;
    tierBreakdown?: {
      tier1: number;
      tier2: number;
      tier3: number;
    };
  };
  user: {
    subscriptionStatus?: string;
    totalPoints: number;
    currentCyclePoints: number;
  };
  distributionInfo?: {
    nextDate: string;
    formattedEndDate?: string;
    timeRemaining: { days: number; hours: number; minutes: number; totalMs: number };
  } | null;
  onUpgradeClick: () => void;
}

export default function CommunityGrowthDial({ poolData, user, distributionInfo, onUpgradeClick }: CommunityGrowthDialProps) {
  const [referralPoints, setReferralPoints] = useState(20);
  const { toast } = useToast();
  
  // Only users with 'active' subscription status get referral features
  // All other statuses (inactive, past_due, canceled, etc.) see upgrade prompts
  const isPremiumUser = user.subscriptionStatus === 'active';
  const memberCount = poolData.premiumUsers || 0;
  
  // Use actual reward pool percentage from current cycle with safe fallback
  const rewardsPercentage = poolData.rewardPoolPercentage ?? 50;
  
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Rewards Pool</h3>
        <p className="text-sm text-gray-600">
          The power of our financial community grows stronger every day
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Stats Display - Left Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Member Rewards Guarantee */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 font-medium mb-1">Member Rewards</div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {rewardsPercentage}% Guarantee
              </div>
              <div className="text-xs text-gray-500">back to members</div>
            </div>

            {/* Cycle Pool Size */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 font-medium mb-1">Cycle Pool Size</div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                <span className="hidden sm:inline">{formatCurrency(poolData.totalPool)}</span>
                <span className="sm:hidden">{formatCurrencyMobile(poolData.totalPool)}</span>
              </div>
              <div className="text-xs text-gray-500">available for rewards</div>
            </div>

            {/* Premium Members */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 font-medium mb-1">Premium Members</div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {formatNumber(memberCount)}
              </div>
              <div className="text-xs text-gray-500">building wealth together</div>
            </div>

            {/* Days to Cycle End */}
            {distributionInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 font-medium mb-1">Days to Cycle End</div>
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {distributionInfo.timeRemaining?.days || 0}
                </div>
                <div className="text-xs text-gray-500">
                  {distributionInfo.formattedEndDate || 
                   (distributionInfo.nextDate ? new Date(distributionInfo.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Next cycle')}
                </div>
              </div>
            )}
          </div>

          {/* Call to Action - Right Side */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            {!isPremiumUser ? (
              <>
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Unlock Your Share</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Join {formatNumber(memberCount)} premium members earning real rewards every cycle
                  </p>
                </div>
                <Button 
                  onClick={onUpgradeClick}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium"
                >
                  <span className="hidden sm:inline">Join Premium Members - $20/month</span>
                  <span className="sm:hidden">Upgrade to Premium - $20/mo</span>
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Grow the Community</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Invite friends and earn bonus points for each successful referral
                  </p>
                  <div className="bg-white border border-gray-200 rounded p-3 mb-4">
                    <p className="text-sm font-medium text-gray-900">
                      Earn <span className="font-bold">+{referralPoints} points</span> per referral
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Help friends build wealth while boosting your rewards
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('/api/referrals/my-code', {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          const referralLink = `${window.location.origin}/auth?ref=${data.referralCode}`;
                          await navigator.clipboard.writeText(referralLink);
                          toast({
                            title: "Link copied!",
                            description: "Referral link copied to clipboard",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to copy referral link",
                          variant: "destructive"
                        });
                      }
                    }}
                    variant="outline"
                    className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  >
                    Copy Link
                  </Button>
                  <Button 
                    onClick={handleReferralClick}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium"
                  >
                    Share Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
}