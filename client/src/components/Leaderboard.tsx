
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

interface PaginationData {
  page: number;
  pageSize: number;
  totalUsers: number;
  totalPages: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: UserRank;
  pagination?: PaginationData;
}

export default function Leaderboard() {
  const [cycleData, setCycleData] = useState<LeaderboardData | null>(null);
  const [allTimeData, setAllTimeData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cycle');
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
      
      // Build pagination URL parameters
      const pageSize = 20;
      const paginationParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString()
      });
      
      // Use the paginated leaderboard endpoint
      const response = await fetch(`/api/cycles/leaderboard?${paginationParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const apiResponse = await response.json();
        console.log('Leaderboard API response:', apiResponse);
        
        // Handle new paginated response format
        const { leaderboard: leaderboardEntries, pagination } = apiResponse;
        
        // Process the leaderboard data
        const processLeaderboardData = (entries: any[]) => {
          if (!entries || !Array.isArray(entries)) return null;
          
          const leaderboard = entries.map((entry: any) => ({
            rank: entry.rank,
            username: entry.username,
            points: entry.points,
            tier: entry.tier,
            isCurrentUser: currentUserId && entry.userId === currentUserId,
            userId: entry.userId
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
            tier: 'Tier 3'
          };
          
          return {
            leaderboard: leaderboard,
            currentUser,
            pagination
          };
        };
        
        const processedData = processLeaderboardData(leaderboardEntries);
        console.log('Processed leaderboard data:', processedData);
        
        // Set data for both tabs (same data for now)
        setCycleData(processedData);
        setAllTimeData(processedData);
        
        // Update pagination state
        if (pagination) {
          setTotalPages(pagination.totalPages);
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
    switch (tier?.toLowerCase()) {
      case 'tier1':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md';
      case 'tier2':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-md';
      case 'tier3':
      default:
        return 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md';
    }
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
                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
                  {/* Mobile: Page info on top */}
                  <span className="text-xs text-gray-600 text-center md:hidden">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  {/* Navigation buttons */}
                  <div className="flex items-center justify-center space-x-2 md:space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="text-xs md:text-sm px-2 md:px-3"
                    >
                      <span className="md:hidden">Prev</span>
                      <span className="hidden md:inline">Previous</span>
                    </Button>
                    
                    {/* Desktop: Page info between buttons */}
                    <span className="hidden md:block text-sm text-gray-600 px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs md:text-sm px-2 md:px-3"
                    >
                      <span className="md:hidden">Next</span>
                      <span className="hidden md:inline">Next</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {data.leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm ${
                    entry.isCurrentUser ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-sm ${
                      entry.isCurrentUser
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <p className={`font-semibold ${entry.isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                        {entry.username}
                        {entry.isCurrentUser && <span className="ml-2 text-blue-600 font-medium">(You)</span>}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">{entry.points.toLocaleString()} points</p>
                    </div>
                  </div>
                  <Badge className={`${getTierColor(entry.tier)} font-semibold px-3 py-1`}>
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
          <TabsTrigger value="cycle" className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>This Cycle</span>
          </TabsTrigger>
          <TabsTrigger value="allTime" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>All Time</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cycle">
          {renderLeaderboard(cycleData)}
        </TabsContent>

        <TabsContent value="allTime">
          {renderLeaderboard(allTimeData)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
