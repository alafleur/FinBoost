import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { 
  Star, 
  TrendingUp, 
  Trophy, 
  Target,
  ChevronRight,
  Zap
} from 'lucide-react';

interface User {
  id: number;
  totalPoints: number;
  currentCyclePoints: number;
  tier: string;
  subscriptionStatus?: string;
  theoreticalPoints?: number;
}

interface PointsSummaryProps {
  user: User;
  onNavigateToPoints?: () => void;
}

export default function PointsSummary({ user, onNavigateToPoints }: PointsSummaryProps) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [nextActions, setNextActions] = useState([]);
  const [tierThresholds, setTierThresholds] = useState({ tier1: 0, tier2: 250, tier3: 500 });

  useEffect(() => {
    fetchQuickData();
  }, []);

  const fetchQuickData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch current cycle tier thresholds
      const thresholdsResponse = await fetch('/api/cycles/current/tier-thresholds');
      if (thresholdsResponse.ok) {
        const thresholdsData = await thresholdsResponse.json();
        setTierThresholds(thresholdsData.thresholds);
      }

      // Fetch recent cycle activity (last 3 entries)
      const historyResponse = await fetch('/api/cycles/points/history?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setRecentActivity(historyData.history.slice(0, 3));
      }

      // Fetch suggested actions from current cycle
      const actionsResponse = await fetch('/api/cycles/points/actions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        // Show high-value, non-proof-required actions first
        const suggested = actionsData.actions
          .filter((action: any) => !action.requiresProof && action.basePoints >= 10)
          .slice(0, 3);
        setNextActions(suggested);
      }
    } catch (error) {
      console.error('Error fetching cycle data:', error);
    }
  };

  const getTierColor = (tier: string) => {
    return 'bg-gray-900';
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'tier1':
        return 'Tier 1';
      case 'tier2':
        return 'Tier 2';
      case 'tier3':
      default:
        return 'Tier 3';
    }
  };

  const getNextTierInfo = () => {
    switch (user.tier) {
      case 'tier3': 
        return { 
          points: tierThresholds.tier2, 
          name: 'Tier 2',
          isMaxTier: false 
        };
      case 'tier2': 
        return { 
          points: tierThresholds.tier1, 
          name: 'Tier 1',
          isMaxTier: false 
        };
      case 'tier1': 
        return { 
          points: tierThresholds.tier1, 
          name: 'Tier 1',
          isMaxTier: true 
        };
      default: 
        return { 
          points: tierThresholds.tier2, 
          name: 'Tier 2',
          isMaxTier: false 
        };
    }
  };

  // Safety check for user data
  if (!user) {
    return null;
  }

  const nextTierInfo = getNextTierInfo();
  const progressToNextTier = nextTierInfo.isMaxTier 
    ? 100 
    : Math.min((user.currentCyclePoints / nextTierInfo.points) * 100, 100);
  const pointsNeeded = nextTierInfo.isMaxTier 
    ? 0 
    : Math.max(0, nextTierInfo.points - user.currentCyclePoints);

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gray-50 rounded border border-gray-100">
                <Star className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium">
                {user.subscriptionStatus === 'active' ? 'Total Points' : 'Theoretical Points'}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {user.subscriptionStatus === 'active' 
                ? user.totalPoints.toLocaleString()
                : (user.theoreticalPoints || 0).toLocaleString()
              }
            </div>
            {user.subscriptionStatus !== 'active' && (
              <p className="text-xs text-orange-600 mt-1">
                Upgrade to claim as real points
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gray-50 rounded border border-gray-100">
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium">This Cycle</span>
            </div>
            <div className="text-2xl font-bold">{user.currentCyclePoints}</div>
            {user.subscriptionStatus !== 'active' && (
              <p className="text-xs text-orange-600 mt-1">
                Theoretical points only
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gray-50 rounded border border-gray-100">
                <Trophy className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium">Tier Progress</span>
            </div>
            <Badge className={`${getTierColor(user.tier)} text-white text-xs`}>
              {getTierDisplayName(user.tier)}
            </Badge>
          </div>

          {/* All Tiers Display */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${user.tier === 'tier1' ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
                <span className="text-xs font-medium">Tier 1</span>
                <span className="text-xs text-gray-500">{tierThresholds.tier1}+</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${user.tier === 'tier2' ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
                <span className="text-xs font-medium">Tier 2</span>
                <span className="text-xs text-gray-500">{tierThresholds.tier2}+</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${user.tier === 'tier3' ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
                <span className="text-xs font-medium">Tier 3</span>
                <span className="text-xs text-gray-500">0+</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-gray-600 to-gray-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((user.currentCyclePoints / Math.max(tierThresholds.tier3, 1)) * 100, 100)}%` }}
              ></div>
            </div>

            {/* Current Status */}
            <div className="text-center text-xs text-gray-500">
              {user.currentCyclePoints} points this cycle
              {nextTierInfo.isMaxTier ? ' • Maximum tier reached!' : pointsNeeded > 0 && ` • ${pointsNeeded} to ${nextTierInfo.name}`}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">{activity.description}</span>
                <div className="flex items-center space-x-1">
                  <span className={`font-bold ${activity.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {activity.points >= 0 ? '+' : ''}{activity.points}
                  </span>
                  {activity.status === 'pending' && (
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}