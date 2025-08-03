import { DashboardColors } from "@/lib/colors";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Users, Award } from "lucide-react";

interface TierThresholds {
  tier1: number;
  tier2: number;
  tier3: number;
}

interface TierBreakdown {
  tier1: number;
  tier2: number;
  tier3: number;
}

interface User {
  tier?: string;
  currentCyclePoints?: number;
  currentMonthPoints?: number;
}

interface TierStatsProps {
  tierThresholds: TierThresholds;
  tierRewards?: TierBreakdown;
  user: User;
}

export default function TierStats({ tierThresholds, tierRewards, user }: TierStatsProps) {
  // Utility function for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fix the tier logic: tier1 should be highest, tier3 should be lowest
  // Current API returns: {"tier1":33,"tier2":67,"tier3":0}
  // But tier1 should require the MOST points (67+), not the least
  const highestThreshold = Math.max(tierThresholds.tier1, tierThresholds.tier2);
  const lowestThreshold = Math.min(tierThresholds.tier1, tierThresholds.tier2);
  
  const getCurrentTier = () => {
    const points = user.currentCyclePoints || user.currentMonthPoints || 0;
    if (points >= highestThreshold) return 'tier1'; // Tier 1 = highest points
    if (points >= lowestThreshold) return 'tier2';  // Tier 2 = middle points
    return 'tier3'; // Tier 3 = lowest points (0 to lowestThreshold-1)
  };

  const currentTier = user.tier || getCurrentTier();

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'tier1':
        return TrendingUp;
      case 'tier2':
        return Target;
      case 'tier3':
        return Users;
      default:
        return Award;
    }
  };

  const getTierColors = (tierId: string, isCurrentTier: boolean) => {
    if (isCurrentTier) {
      return {
        card: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md',
        accent: 'bg-gradient-to-r from-blue-500 to-purple-600',
        iconBg: 'bg-white border-blue-100',
        iconColor: 'text-blue-600',
        badge: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg'
      };
    } else {
      return {
        card: 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm',
        accent: 'bg-gray-300',
        iconBg: 'bg-gray-50 border-gray-200',
        iconColor: 'text-gray-500',
        badge: 'bg-gray-100 text-gray-700 border-gray-200'
      };
    }
  };

  const tiers = [
    {
      id: 'tier1',
      name: 'Tier 1',
      range: `${highestThreshold}+`,
      reward: tierRewards?.tier1,
      isCurrentTier: currentTier === 'tier1'
    },
    {
      id: 'tier2',
      name: 'Tier 2', 
      range: `${lowestThreshold}-${highestThreshold - 1}`,
      reward: tierRewards?.tier2,
      isCurrentTier: currentTier === 'tier2'
    },
    {
      id: 'tier3',
      name: 'Tier 3',
      range: `0-${lowestThreshold - 1}`,
      reward: tierRewards?.tier3,
      isCurrentTier: currentTier === 'tier3'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {tiers.map((tier) => {
        const TierIcon = getTierIcon(tier.id);
        const colors = getTierColors(tier.id, tier.isCurrentTier);
        
        return (
          <div
            key={tier.id}
            className={`relative border rounded-xl transition-all duration-300 ${colors.card} overflow-hidden`}
          >
            {/* Accent Bar */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${colors.accent}`}></div>
            
            <div className="p-5">
              {/* Header with Icon and Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border ${colors.iconBg}`}>
                  <TierIcon className={`h-6 w-6 ${colors.iconColor}`} />
                </div>
                {tier.isCurrentTier && (
                  <Badge className={colors.badge}>
                    Your Tier
                  </Badge>
                )}
              </div>

              {/* Tier Name */}
              <h3 className={`text-lg font-semibold ${DashboardColors.text.primary} mb-1`}>
                {tier.name}
              </h3>

              {/* Point Range */}
              <p className={`text-sm ${DashboardColors.text.secondary} mb-3`}>
                {tier.range} points
              </p>

              {/* Reward Amount */}
              <div className="pt-2 border-t border-gray-100">
                {tier.reward ? (
                  <div>
                    <p className={`text-xs ${DashboardColors.text.muted} mb-1`}>Pool Allocation</p>
                    <p className={`text-xl font-bold ${tier.isCurrentTier ? 'text-blue-600' : 'text-gray-900'}`}>
                      {formatCurrency(tier.reward)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-xs ${DashboardColors.text.muted} mb-1`}>Pool Allocation</p>
                    <p className="text-sm text-gray-400">
                      Not available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}