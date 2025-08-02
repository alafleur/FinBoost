import { DashboardColors } from "@/lib/colors";

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

  const getTierColors = (tierId: string, isCurrentTier: boolean) => {
    if (isCurrentTier) {
      return 'bg-gradient-to-br from-gray-50 to-slate-50 relative overflow-hidden border-gray-200';
    } else {
      return 'bg-white border-gray-100';
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`border rounded-xl transition-all duration-200 hover:shadow-sm ${getTierColors(tier.id, tier.isCurrentTier)} 
            p-4 sm:p-5 text-center min-h-[72px] sm:min-h-[88px]
            ${tier.isCurrentTier ? 'ring-1 ring-blue-200 ring-opacity-30' : ''}
          `}
        >
          {tier.isCurrentTier && (
            <div className={`absolute top-0 left-0 w-full h-1 ${DashboardColors.accent.primary}`}></div>
          )}
          
          {/* Mobile: Horizontal layout, Desktop: Vertical layout */}
          <div className="flex sm:flex-col items-center sm:items-center justify-between sm:justify-center space-x-4 sm:space-x-0 sm:space-y-2">
            <div className="flex-shrink-0 min-w-0 flex-1 sm:flex-initial">
              <div className={`text-base sm:text-lg font-semibold ${DashboardColors.text.primary} mb-1`}>
                {tier.name}
              </div>
              <div className={`text-xs sm:text-sm ${DashboardColors.text.muted}`}>
                {tier.range} pts
              </div>
            </div>
            
            <div className="flex-shrink-0 text-right sm:text-center">
              {tier.reward ? (
                <div className="text-base sm:text-lg font-bold text-green-600 leading-tight">
                  <span className="sm:hidden">{formatCurrency(tier.reward).replace('$', '$')}</span>
                  <span className="hidden sm:inline">{formatCurrency(tier.reward)}</span>
                </div>
              ) : (
                <div className="text-xs text-gray-400">
                  No data
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}