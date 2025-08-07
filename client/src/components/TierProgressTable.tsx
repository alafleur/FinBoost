import { Trophy } from "lucide-react";

interface TierThresholds {
  tier1: number;
  tier2: number;
  tier3: number;
}

interface User {
  tier: string;
  currentCyclePoints: number;
}

interface TierProgressTableProps {
  tierThresholds: TierThresholds;
  user: User;
  getTierDisplayName: (tier: string) => string;
}

export default function TierProgressTable({ tierThresholds, user, getTierDisplayName }: TierProgressTableProps) {
  return (
    <div className="space-y-4">
      {/* Tier Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className={user?.tier === 'tier1' ? 'bg-accent-light/20 border-accent-light/50' : 'bg-white'}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <span className="flex items-center">
                  Tier 1
                  {user?.tier === 'tier1' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium dashboard-accent-primary text-white">
                      Your Tier
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {tierThresholds.tier1}+ tickets
              </td>
            </tr>
            <tr className={user?.tier === 'tier2' ? 'bg-accent-light/20 border-accent-light/50' : 'bg-white'}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <span className="flex items-center">
                  Tier 2
                  {user?.tier === 'tier2' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium dashboard-accent-primary text-white">
                      Your Tier
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {tierThresholds.tier2} - {tierThresholds.tier1 - 1} tickets
              </td>
            </tr>
            <tr className={user?.tier === 'tier3' ? 'bg-accent-light/20 border-accent-light/50' : 'bg-white'}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <span className="flex items-center">
                  Tier 3
                  {user?.tier === 'tier3' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium dashboard-accent-primary text-white">
                      Your Tier
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                0 - {tierThresholds.tier2 - 1} tickets
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* User Position Details */}
      <div className="dashboard-card-primary rounded-lg p-4 border dashboard-border-primary">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-accent-light/20 rounded">
            <Trophy className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h4 className="font-medium text-accent text-sm">Your Current Position</h4>
            <p className="text-sm text-accent-light mt-1">
              You currently have <span className="font-semibold">{user.currentCyclePoints || 0} tickets</span> this cycle and are in <span className="font-semibold">{getTierDisplayName(user.tier)}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}