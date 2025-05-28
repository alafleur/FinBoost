
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
  currentMonthPoints: number;
  tier: string;
}

interface PointsSummaryProps {
  user: User;
  onNavigateToPoints?: () => void;
}

export default function PointsSummary({ user, onNavigateToPoints }: PointsSummaryProps) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [nextActions, setNextActions] = useState([]);

  useEffect(() => {
    fetchQuickData();
  }, []);

  const fetchQuickData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch recent activity (last 3 entries)
      const historyResponse = await fetch('/api/points/history?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setRecentActivity(historyData.history.slice(0, 3));
      }

      // Fetch suggested actions
      const actionsResponse = await fetch('/api/points/actions', {
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
      console.error('Error fetching quick data:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      default: return 'bg-orange-600';
    }
  };

  const getNextTierPoints = () => {
    switch (user.tier) {
      case 'bronze': return 100;
      case 'silver': return 250;
      case 'gold': return 500;
      default: return 100;
    }
  };

  const getNextTierName = () => {
    switch (user.tier) {
      case 'bronze': return 'Silver';
      case 'silver': return 'Gold';
      case 'gold': return 'Platinum';
      default: return 'Silver';
    }
  };

  // Safety check for user data
  if (!user || typeof user.currentMonthPoints === 'undefined') {
    return <div>Loading user data...</div>;
  }

  const progressToNextTier = Math.min((user.currentMonthPoints / getNextTierPoints()) * 100, 100);
  const pointsNeeded = Math.max(0, getNextTierPoints() - user.currentMonthPoints);

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Total Points</span>
            </div>
            <div className="text-2xl font-bold">{user.totalPoints.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <div className="text-2xl font-bold">{user.currentMonthPoints}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Tier Progress</span>
            </div>
            <Badge className={`${getTierColor(user.tier)} text-white text-xs`}>
              {user.tier.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>To {getNextTierName()}</span>
              <span>{pointsNeeded} points needed</span>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span>Quick Wins</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nextActions.map((action: any) => (
            <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{action.name}</span>
              <Badge variant="secondary" className="text-xs">
                +{action.basePoints}
              </Badge>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={onNavigateToPoints}
          >
            View All Actions
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
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
