import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Search, Trophy, Star, Crown, Medal, Target, Activity, Calendar, Flame, Users, TrendingUp } from "lucide-react";

interface LeaderboardUser {
  rank: string;
  username: string;
  points: string;
  tier: string;
  streak: number;
  modulesCompleted: number;
  joinDate: string;
}

interface ExpandedLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpandedLeaderboard({ isOpen, onClose }: ExpandedLeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<"monthly" | "all-time">("monthly");

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/leaderboard/expanded', timeFilter, searchTerm],
    enabled: isOpen,
    refetchInterval: 30000,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leaderboard/expanded?timeFilter=${timeFilter}&search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch leaderboard data');
      return response.json();
    }
  });

  const { data: currentUserData } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: isOpen,
    refetchInterval: 30000,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    }
  });

  const { data: tierThresholdsData } = useQuery({
    queryKey: ['/api/tiers/thresholds'],
    enabled: isOpen,
    refetchInterval: 30000,
  });

  const allUsers = (leaderboardData as any)?.users || [];
  const currentUsername = (currentUserData as any)?.user?.username || null;
  const tierThresholds = (tierThresholdsData as any)?.thresholds;

  // Calculate points to next tier
  const calculatePointsToNextTier = (points: string | number, tier: string) => {
    const currentPoints = parseInt(points.toString()) || 0;

    if (!tierThresholds) return 0;

    // tier1 is the highest tier, tier3 is the lowest
    switch(tier) {
      case 'tier3': 
        // Need to move from tier3 to tier2
        return Math.max(0, tierThresholds.tier2 - currentPoints);
      case 'tier2': 
        // Need to move from tier2 to tier1
        return Math.max(0, tierThresholds.tier1 - currentPoints);
      case 'tier1': 
        return 0; // Highest tier users show 0 points to next tier
      default: 
        return Math.max(0, tierThresholds.tier2 - currentPoints);
    }
  };

  // Find current user in leaderboard
  const currentUser = allUsers.find((user: any) => user.username === currentUsername) || null;
  if (currentUser) {
    currentUser.pointsToNextTier = calculatePointsToNextTier(currentUser.points, currentUser.tier);
  }

  // Users are already filtered by search in the backend
  const displayedUsers = allUsers;

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
    return <Trophy className="h-4 w-4 text-blue-500" />;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters and Search */}
          <div className="flex-shrink-0 space-y-4 p-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
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
              <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Current User Stats */}
            {currentUser && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Crown className="h-5 w-5 text-yellow-500 mr-1" />
                      <span className="text-lg font-bold text-gray-800">#{parseInt(currentUser.rank) || '-'}</span>
                    </div>
                    <p className="text-xs text-gray-600">Your Rank</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-purple-500 mr-1" />
                      <span className="text-lg font-bold text-gray-800">{currentUser.points || 0}</span>
                    </div>
                    <p className="text-xs text-gray-600">Points</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-5 w-5 text-orange-500 mr-1" />
                      <span className="text-lg font-bold text-gray-800">{currentUser.tier || 'Bronze'}</span>
                    </div>
                    <p className="text-xs text-gray-600">Tier</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-500 mr-1" />
                      <span className="text-lg font-bold text-gray-800">{currentUser.pointsToNextTier || 'Max Tier'}</span>
                    </div>
                    <p className="text-xs text-gray-600">To Next Tier</p>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard List */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedUsers.map((user: any, index: number) => {
                    const actualRank = index + 1;
                    const isCurrentUser = currentUser && user.username === currentUser.username;

                    return (
                      <div
                        key={user.username}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          isCurrentUser 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankIcon(actualRank)}
                          </div>
                          <div className="text-lg font-semibold text-gray-600 min-w-[2rem]">
                            #{actualRank}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isCurrentUser ? 'text-blue-800' : 'text-gray-900'}`}>
                                {user.username}
                                {isCurrentUser && <span className="text-blue-600 text-sm">(You)</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={getTierBadgeColor(user.tier)}>
                                {user.tier}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`text-lg font-bold ${isCurrentUser ? 'text-blue-800' : 'text-gray-900'}`}>
                              {parseInt(user.points).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">points</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600 text-center">
                  Showing all {displayedUsers.length} premium members
                  {searchTerm && ` (filtered by "${searchTerm}")`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}