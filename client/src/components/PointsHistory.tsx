
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarDays, TrendingUp, TrendingDown, Trophy, Star, Users, DollarSign } from 'lucide-react';

interface PointsHistoryEntry {
  id: number;
  points: number;
  action: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  metadata?: any;
}

interface CycleRewardEntry {
  id: number;
  month: number;
  tier: string;
  pointsAtDistribution: number;
  rewardAmount: number;
  pointsDeducted: number;
  pointsRolledOver: number;
  isWinner: boolean;
  createdAt: string;
}

export default function PointsHistory() {
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<CycleRewardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch points history
      const pointsResponse = await fetch('/api/points/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        setPointsHistory(pointsData.history);
      }

      // Fetch rewards history
      const rewardsResponse = await fetch('/api/rewards/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewardsHistory(rewardsData.history);
      }

    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'lesson_complete':
      case 'quiz_complete':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'debt_payment':
      case 'investment':
      case 'savings_upload':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'referral_signup':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'cycle_reward_deduction':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'cycle_rollover':
        return <CalendarDays className="h-4 w-4 text-gray-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'bg-yellow-500';
      case 'tier2': return 'bg-gray-400';
      default: return 'bg-orange-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5" />
          <span>Tickets & Rewards History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="points">Tickets Activity</TabsTrigger>
            <TabsTrigger value="rewards">Cycle Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="space-y-4">
            {pointsHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tickets activity yet. Start earning tickets by completing lessons!
              </div>
            ) : (
              <div className="space-y-3">
                {pointsHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      {getActionIcon(entry.action)}
                      <div>
                        <div className="font-medium">{entry.description}</div>
                        <div className="text-sm text-gray-500">{formatDate(entry.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-lg font-bold ${entry.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.points >= 0 ? '+' : ''}{entry.points}
                      </div>
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            {rewardsHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No cycle rewards history yet. Keep earning tickets to participate in rewards!
              </div>
            ) : (
              <div className="space-y-3">
                {rewardsHistory.map((entry) => (
                  <div key={entry.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Monthly Distribution</span>
                        <Badge className={`${getTierColor(entry.tier)} text-white capitalize`}>
                          {entry.tier}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(entry.createdAt)}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Tickets at Distribution</div>
                        <div className="font-medium">{entry.pointsAtDistribution}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Reward Amount</div>
                        <div className="font-medium flex items-center">
                          {entry.isWinner ? (
                            <>
                              <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                              ${(entry.rewardAmount / 100).toFixed(2)}
                            </>
                          ) : (
                            <span className="text-gray-400">No reward</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tickets Deducted</div>
                        <div className="font-medium text-red-600">
                          {entry.pointsDeducted > 0 ? `-${entry.pointsDeducted}` : '0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tickets Rolled Over</div>
                        <div className="font-medium text-blue-600">{entry.pointsRolledOver}</div>
                      </div>
                    </div>

                    {entry.isWinner && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                        🎉 Congratulations! You won a reward this month!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
