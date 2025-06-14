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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Point Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className={user?.tier === 'tier1' ? 'bg-green-50 border-green-200' : 'bg-white'}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <span className="flex items-center">
                  Tier 1
                  {user?.tier === 'tier1' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Your Tier
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {tierThresholds.tier1}+ points
              </td>
            </tr>
            <tr className={user?.tier === 'tier2' ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <span className="flex items-center">
                  Tier 2
                  {user?.tier === 'tier2' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Your Tier
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {tierThresholds.tier2} - {tierThresholds.tier1 - 1} points
              </td>
            </tr>
            <tr className={user?.tier === 'tier3' ? 'bg-orange-50 border-orange-200' : 'bg-white'}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <span className="flex items-center">
                  Tier 3
                  {user?.tier === 'tier3' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Your Tier
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                0 - {tierThresholds.tier2 - 1} points
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* User Position Details */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded">
            <Trophy className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 text-sm">Your Current Position</h4>
            <p className="text-sm text-blue-700 mt-1">
              You currently have <span className="font-semibold">{user.currentCyclePoints || 0} points</span> this cycle and are in <span className="font-semibold">{getTierDisplayName(user.tier)}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}