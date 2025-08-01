interface TierThresholds {
  tier1: number;
  tier2: number;
  tier3: number;
}

interface User {
  tier?: string;
  currentCyclePoints?: number;
}

interface TierStatsProps {
  tierThresholds: TierThresholds;
  user: User;
}

export default function TierStats({ tierThresholds, user }: TierStatsProps) {
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
      return 'border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden shadow-lg';
    } else {
      return 'border border-gray-200 bg-white hover:bg-gray-50';
    }
  };

  const getCurrentBadgeColor = (tierId: string) => {
    return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg';
  };

  const tiers = [
    {
      id: 'tier1',
      name: 'Tier 1',
      range: `${highestThreshold}+`,
      isCurrentTier: currentTier === 'tier1'
    },
    {
      id: 'tier2',
      name: 'Tier 2', 
      range: `${lowestThreshold}-${highestThreshold - 1}`,
      isCurrentTier: currentTier === 'tier2'
    },
    {
      id: 'tier3',
      name: 'Tier 3',
      range: `0-${lowestThreshold - 1}`,
      isCurrentTier: currentTier === 'tier3'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl ${getTierColors(tier.id, tier.isCurrentTier)}`}
        >
          {tier.isCurrentTier && (
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-t-xl"></div>
          )}
          
          <div className="text-lg font-bold text-gray-900 mb-2">
            {tier.name}
          </div>
          <div className="text-sm font-medium text-gray-700 mb-3">
            {tier.range} pts
          </div>
          {tier.isCurrentTier && (
            <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${getCurrentBadgeColor(tier.id)}`}>
              Your Tier
            </div>
          )}
        </div>
      ))}
    </div>
  );
}