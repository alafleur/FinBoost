import { Crown, Medal, Trophy } from "lucide-react";

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
      icon: Crown,
      bgColor: currentTier === 'tier1' ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 'bg-gray-50',
      borderColor: currentTier === 'tier1' ? 'border-green-300' : 'border-gray-200',
      textColor: currentTier === 'tier1' ? 'text-green-900' : 'text-gray-600',
      iconColor: currentTier === 'tier1' ? 'text-green-600' : 'text-gray-400',
      shadowClass: currentTier === 'tier1' ? 'shadow-lg shadow-green-100' : 'shadow-sm'
    },
    {
      id: 'tier2',
      name: 'Tier 2',
      range: `${lowestThreshold}-${highestThreshold - 1}`,
      icon: Medal,
      bgColor: currentTier === 'tier2' ? 'bg-gradient-to-br from-yellow-50 to-amber-100' : 'bg-gray-50',
      borderColor: currentTier === 'tier2' ? 'border-yellow-300' : 'border-gray-200',
      textColor: currentTier === 'tier2' ? 'text-yellow-900' : 'text-gray-600',
      iconColor: currentTier === 'tier2' ? 'text-yellow-600' : 'text-gray-400',
      shadowClass: currentTier === 'tier2' ? 'shadow-lg shadow-yellow-100' : 'shadow-sm'
    },
    {
      id: 'tier3',
      name: 'Tier 3',
      range: `0-${lowestThreshold - 1}`,
      icon: Trophy,
      bgColor: currentTier === 'tier3' ? 'bg-gradient-to-br from-orange-50 to-red-100' : 'bg-gray-50',
      borderColor: currentTier === 'tier3' ? 'border-orange-300' : 'border-gray-200',
      textColor: currentTier === 'tier3' ? 'text-orange-900' : 'text-gray-600',
      iconColor: currentTier === 'tier3' ? 'text-orange-600' : 'text-gray-400',
      shadowClass: currentTier === 'tier3' ? 'shadow-lg shadow-orange-100' : 'shadow-sm'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {tiers.map((tier) => {
        const Icon = tier.icon;
        const isCurrentTier = currentTier === tier.id;
        
        return (
          <div
            key={tier.id}
            className={`relative p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${tier.bgColor} ${tier.borderColor} ${tier.shadowClass}`}
          >
            {isCurrentTier && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                Your Tier
              </div>
            )}
            
            <div className="flex items-center justify-center mb-3">
              <div className={`p-2 rounded-lg ${isCurrentTier ? 'bg-white shadow-md' : 'bg-white/50'}`}>
                <Icon className={`h-7 w-7 ${tier.iconColor}`} />
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-base font-bold mb-2 ${tier.textColor}`}>
                {tier.name}
              </div>
              <div className={`text-sm font-semibold ${tier.textColor} opacity-90`}>
                {tier.range} pts
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}