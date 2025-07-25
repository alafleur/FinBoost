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
    <div className="grid grid-cols-3 gap-3">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`relative bg-white border rounded-lg p-4 text-center ${
            tier.isCurrentTier ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
          }`}
        >
          {tier.isCurrentTier && (
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              Current
            </div>
          )}
          
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {tier.name}
          </div>
          <div className="text-xs text-gray-500">
            {tier.range} pts
          </div>
        </div>
      ))}
    </div>
  );
}