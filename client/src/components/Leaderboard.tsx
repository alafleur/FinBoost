
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  TrendingUp,
  Users,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  rank: string | number;
  username: string;
  points: number;
  tier: string;
  isCurrentUser?: boolean;
  userId?: number;
}

interface UserRank {
  rank: number | null;
  points: number;
  tier: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: UserRank;
}

export default function Leaderboard() {
  const [monthlyData, setMonthlyData] = useState<LeaderboardData | null>(null);
  const [allTimeData, setAllTimeData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage, activeTab]);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get current user info first
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let currentUserId = null;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        currentUserId = userData.user?.id;
      }
      
      // Use expanded leaderboard endpoint for pagination
      const timeFilter = activeTab === 'monthly' ? 'monthly' : 'alltime';
      const expandedResponse = await fetch(`/api/leaderboard/expanded?timeFilter=${timeFilter}&page=${currentPage}&search=`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (expandedResponse.ok) {
        const result = await expandedResponse.json();
        
        // Process the expanded leaderboard data
        const processExpandedData = (data: any) => {
          if (!data.success || !data.users) return null;
          
          const leaderboard = data.users.map((entry: any, index: number) => ({
            rank: parseInt(entry.rank),
            username: entry.username,
            points: parseInt(entry.points),
            tier: entry.tier,
            isCurrentUser: currentUserId && entry.username === currentUserId // Note: expanded API uses username comparison
          }));
          
          // Find current user's position
          const currentUserEntry = leaderboard.find((entry: any) => entry.isCurrentUser);
          const currentUser = currentUserEntry ? {
            rank: currentUserEntry.rank,
            points: currentUserEntry.points,
            tier: currentUserEntry.tier
          } : {
            rank: null,
            points: 0,
            tier: 'tier1'
          };
          
          return {
            leaderboard: leaderboard,
            currentUser
          };
        };
        
        const processedData = processExpandedData(result);
        
        // Set data for the active tab
        if (activeTab === 'monthly') {
          setMonthlyData(processedData);
        } else {
          setAllTimeData(processedData);
        }
        
        // Update pagination info
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
        }
      } else {
        throw new Error('Failed to fetch leaderboard data');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    // Use consistent blue colors for all tiers
    return 'bg-blue-600 text-white';
  };

  const getRankIcon = (rank: string | number) => {
    return <span className="text-sm font-semibold text-gray-600">#{rank}</span>;
  };

  const renderLeaderboard = (data: LeaderboardData | null) => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* Current User Position */}
        {data.currentUser.rank && (
          <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white font-bold">
                    #{data.currentUser.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-primary-900">Your Position</p>
                    <p className="text-sm text-primary-700">{data.currentUser.points} points</p>
                  </div>
                </div>
                <Badge className={getTierColor(data.currentUser.tier)}>
                  {data.currentUser.tier}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Members - Uniform List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>All Members</span>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {data.leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    entry.isCurrentUser ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">
                      {entry.rank}
                    </div>
                    <div>
                      <p className={`font-medium ${entry.isCurrentUser ? 'text-primary-600' : ''}`}>
                        {entry.username}
                        {entry.isCurrentUser && <span className="ml-2 text-primary-500">(You)</span>}
                      </p>
                      <p className="text-sm text-gray-600">{entry.points} points</p>
                    </div>
                  </div>
                  <Badge className={getTierColor(entry.tier)}>
                    {entry.tier}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3">Loading leaderboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <p className="text-gray-600">See how you stack up against other members</p>
        </div>
        <Button onClick={fetchLeaderboard} variant="outline" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset to first page when switching tabs
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly" className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>This Month</span>
          </TabsTrigger>
          <TabsTrigger value="allTime" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>All Time</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          {renderLeaderboard(monthlyData)}
        </TabsContent>

        <TabsContent value="allTime">
          {renderLeaderboard(allTimeData)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
