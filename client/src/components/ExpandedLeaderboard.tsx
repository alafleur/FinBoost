import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Trophy, Target, Calendar, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardUser {
  rank: string;
  username: string;
  points: string;
  tier: string;
  streak: number;
  modulesCompleted: number;
  joinDate: string;
}

interface UserStats {
  currentUser: {
    username: string;
    rank: number;
    points: number;
    tier: string;
    streak: number;
    modulesCompleted: number;
    pointsToNextTier: number;
    pointsToTopPosition?: number;
  };
}

interface ExpandedLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpandedLeaderboard({ isOpen, onClose }: ExpandedLeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<'month' | 'alltime'>('month');
  const itemsPerPage = 20;

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/leaderboard/expanded', timeFilter, currentPage, searchTerm],
    enabled: isOpen,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/leaderboard/user-stats', timeFilter],
    enabled: isOpen,
    refetchInterval: 30000,
  });

  const { data: tierThresholds } = useQuery({
    queryKey: ['/api/tiers/thresholds'],
  });

  const filteredUsers = (leaderboardData as any)?.users?.filter((user: LeaderboardUser) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'member': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tier1': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tier2': return 'bg-green-100 text-green-800 border-green-200';
      case 'tier3': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierName = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'member': return 'Member';
      case 'tier1': return 'Tier 1';
      case 'tier2': return 'Tier 2';
      case 'tier3': return 'Tier 3';
      default: return tier;
    }
  };

  const calculateProgress = (currentPoints: number, nextTierPoints: number, currentTierPoints: number = 0) => {
    const totalNeeded = nextTierPoints - currentTierPoints;
    const currentProgress = currentPoints - currentTierPoints;
    return Math.min((currentProgress / totalNeeded) * 100, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* User Stats Banner */}
          {userStats?.currentUser && (
            <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm opacity-90">Rank</span>
                  </div>
                  <div className="text-2xl font-bold">#{userStats.currentUser.rank}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-sm opacity-90">Points</span>
                  </div>
                  <div className="text-2xl font-bold">{userStats.currentUser.points.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm opacity-90">Streak</span>
                  </div>
                  <div className="text-2xl font-bold">{userStats.currentUser.streak} days</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm opacity-90">Modules</span>
                  </div>
                  <div className="text-2xl font-bold">{userStats.currentUser.modulesCompleted}</div>
                </div>
              </div>
              
              {/* Tier Progress */}
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Current Tier: {getTierName(userStats.currentUser.tier)}</span>
                  {userStats.currentUser.pointsToNextTier > 0 && (
                    <span className="text-sm opacity-90">
                      {userStats.currentUser.pointsToNextTier.toLocaleString()} to next tier
                    </span>
                  )}
                  {userStats.currentUser.pointsToTopPosition && (
                    <span className="text-sm opacity-90">
                      {userStats.currentUser.pointsToTopPosition.toLocaleString()} to #1
                    </span>
                  )}
                </div>
                {userStats.currentUser.pointsToNextTier > 0 && tierThresholds && (
                  <Progress 
                    value={calculateProgress(
                      userStats.currentUser.points,
                      userStats.currentUser.points + userStats.currentUser.pointsToNextTier,
                      userStats.currentUser.points - (userStats.currentUser.pointsToNextTier || 0)
                    )} 
                    className="h-2 bg-white/20"
                  />
                )}
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'month' | 'alltime')}>
                <TabsList>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                  <TabsTrigger value="alltime">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Leaderboard */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-500">Loading leaderboard...</p>
                </div>
              ) : paginatedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found matching your search.</p>
                </div>
              ) : (
                paginatedUsers.map((user: LeaderboardUser, index: number) => {
                  const globalRank = startIndex + index + 1;
                  const isCurrentUser = userStats?.currentUser?.username === user.username;
                  
                  return (
                    <Card key={`${user.username}-${user.rank}`} className={`transition-colors ${isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {globalRank <= 3 && (
                                <Trophy className={`h-5 w-5 ${
                                  globalRank === 1 ? 'text-yellow-500' : 
                                  globalRank === 2 ? 'text-gray-400' : 'text-amber-600'
                                }`} />
                              )}
                              <span className="font-bold text-lg min-w-[3rem]">#{user.rank}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{user.username}</span>
                                {isCurrentUser && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3 w-3" />
                                  {user.streak} day streak
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {user.modulesCompleted} modules
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={getTierColor(user.tier)}>
                              {getTierName(user.tier)}
                            </Badge>
                            <div className="text-right">
                              <div className="font-bold text-lg">{parseInt(user.points).toLocaleString()}</div>
                              <div className="text-xs text-gray-500">points</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}