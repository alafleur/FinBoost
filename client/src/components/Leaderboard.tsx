
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  TrendingUp,
  Users,
  Star,
  Target,
  Activity,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SectionHeader from "@/components/SectionHeader";

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

interface TierThresholds {
  tier1: number;
  tier2: number;
  tier3: number;
}

export default function Leaderboard() {
  const [cycleData, setCycleData] = useState<LeaderboardData | null>(null);
  const [allTimeData, setAllTimeData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cycle');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tierThresholds, setTierThresholds] = useState<TierThresholds | null>(null);
  const [userTierStats, setUserTierStats] = useState<any>(null);
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
      
      // Fetch tier thresholds
      const tierResponse = await fetch('/api/cycles/current/tier-thresholds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (tierResponse.ok) {
        const tierData = await tierResponse.json();
        setTierThresholds(tierData);
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
            tier: 'tier3'
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
        
        // Calculate user tier stats
        if (processedData && tierThresholds) {
          calculateUserTierStats(processedData.currentUser, tierThresholds);
        }
        
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

  const calculateUserTierStats = (currentUser: UserRank, thresholds: TierThresholds) => {
    if (!currentUser || currentUser.rank === null) return;
    
    const currentPoints = currentUser.points;
    const currentTier = currentUser.tier;
    
    let pointsToNext = 0;
    let nextTierName = '';
    let progressPercent = 0;
    
    if (currentTier === 'tier3') {
      pointsToNext = thresholds.tier2 - currentPoints;
      nextTierName = 'Tier 2';
      progressPercent = Math.min(100, (currentPoints / thresholds.tier2) * 100);
    } else if (currentTier === 'tier2') {
      pointsToNext = thresholds.tier1 - currentPoints;
      nextTierName = 'Tier 1';
      progressPercent = Math.min(100, ((currentPoints - thresholds.tier2) / (thresholds.tier1 - thresholds.tier2)) * 100);
    } else if (currentTier === 'tier1') {
      pointsToNext = 0;
      nextTierName = 'Elite Tier';
      progressPercent = 100;
    }
    
    setUserTierStats({
      pointsToNext,
      nextTierName,
      progressPercent,
      currentPoints
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'tier1':
        return 'dashboard-accent-primary text-white text-xs font-bold px-2 py-1 rounded-full';
      case 'tier2':
        return 'dashboard-accent-neutral text-white text-xs font-bold px-2 py-1 rounded-full';
      case 'tier3':
      default:
        return 'dashboard-accent-success text-white text-xs font-bold px-2 py-1 rounded-full';
    }
  };

  const getTierName = (tier: string) => {
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

  const getRankIcon = (rank: string | number, isCurrentUser: boolean = false) => {
    const numRank = Number(rank);
    if (numRank <= 3) {
      const icons = [Crown, Trophy, Medal];
      const Icon = icons[numRank - 1];
      return <Icon className={`h-4 w-4 md:h-5 md:w-5 ${isCurrentUser ? 'text-blue-600' : 'text-yellow-500'}`} />;
    }
    return <span className={`text-sm md:text-lg font-bold ${isCurrentUser ? 'text-blue-600' : 'text-gray-600'}`}>#{rank}</span>;
  };

  const renderPerformanceStats = (data: LeaderboardData | null) => {
    if (!data || !data.currentUser.rank) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Current Rank */}
        <Card className="dashboard-card-primary">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">Current Rank</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">#{data.currentUser.rank}</p>
              </div>
              <div className="dashboard-accent-primary rounded-lg p-2 md:p-3">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Points */}
        <Card className="dashboard-card-primary">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">Cycle Points</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{data.currentUser.points.toLocaleString()}</p>
              </div>
              <div className="dashboard-accent-primary rounded-lg p-2 md:p-3">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Tier */}
        <Card className="dashboard-card-primary">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">Current Tier</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{getTierName(data.currentUser.tier)}</p>
              </div>
              <div className="dashboard-accent-primary rounded-lg p-2 md:p-3">
                <Award className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points to Next Tier */}
        <Card className="dashboard-card-primary">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">To Next Tier</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {userTierStats?.pointsToNext > 0 ? userTierStats.pointsToNext : '—'}
                </p>
              </div>
              <div className="dashboard-accent-primary rounded-lg p-2 md:p-3">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTierProgress = () => {
    if (!userTierStats || !tierThresholds) return null;

    return (
      <Card className="dashboard-card-primary">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Tier Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress to {userTierStats.nextTierName}</span>
              <span className="font-medium">{Math.round(userTierStats.progressPercent)}%</span>
            </div>
            <Progress 
              value={userTierStats.progressPercent} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{userTierStats.currentPoints} points</span>
              <span>
                {userTierStats.pointsToNext > 0 
                  ? `${userTierStats.pointsToNext} points to go`
                  : 'Elite Tier Achieved!'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLeaderboard = (data: LeaderboardData | null) => {
    if (!data) return null;

    return (
      <Card className="dashboard-card-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Rankings</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-xs px-2 py-1"
                >
                  <ChevronUp className="h-3 w-3 md:hidden" />
                  <span className="hidden md:inline">Previous</span>
                </Button>
                <span className="text-xs text-gray-600 px-1">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs px-2 py-1"
                >
                  <ChevronDown className="h-3 w-3 md:hidden" />
                  <span className="hidden md:inline">Next</span>
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {data.leaderboard.map((entry, index) => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-3 md:p-4 transition-all duration-200 hover:bg-blue-50/50 ${
                  index !== data.leaderboard.length - 1 ? 'border-b border-gray-100' : ''
                } ${
                  entry.isCurrentUser ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
              >
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-sm shadow-sm ${
                    entry.isCurrentUser
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : Number(entry.rank) <= 3
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {Number(entry.rank) <= 3 ? getRankIcon(entry.rank, entry.isCurrentUser) : entry.rank}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm md:text-base ${
                      entry.isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {entry.username}
                      {entry.isCurrentUser && <span className="ml-2 text-blue-600 font-medium text-xs">(You)</span>}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">
                      {entry.points.toLocaleString()} points
                    </p>
                  </div>
                </div>
                <div className={getTierColor(entry.tier)}>
                  {getTierName(entry.tier)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading leaderboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <SectionHeader
          icon={Trophy}
          iconColor="blue"
          title="Leaderboard"
          titleSize="2xl"
        />
        <p className="text-gray-600 -mt-2">Track your performance and see how you rank against other members</p>
        
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cycle" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">This Cycle</span>
              <span className="sm:hidden">Cycle</span>
            </TabsTrigger>
            <TabsTrigger value="allTime" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">All Time</span>
              <span className="sm:hidden">All Time</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cycle" className="space-y-6 md:space-y-8">
            {/* Performance Stats Section */}
            {cycleData && cycleData.currentUser.rank && (
              <div className="space-y-4">
                <SectionHeader
                  icon={Activity}
                  iconColor="blue"
                  title="Your Performance"
                  titleSize="lg"
                />
                <p className="text-gray-600 text-sm -mt-2">Current standings and tier progress</p>
                {renderPerformanceStats(cycleData)}
              </div>
            )}

            {/* Tier Progress Section */}
            {userTierStats && (
              <div className="space-y-4">
                <SectionHeader
                  icon={Target}
                  iconColor="blue"
                  title="Tier Progress"
                  titleSize="lg"
                />
                <p className="text-gray-600 text-sm -mt-2">Track your advancement to the next tier</p>
                {renderTierProgress()}
              </div>
            )}

            {/* Rankings Section */}
            <div className="space-y-4">
              <SectionHeader
                icon={Users}
                iconColor="blue"
                title="Current Rankings"
                titleSize="lg"
              />
              <p className="text-gray-600 text-sm -mt-2">See where you stand among all members</p>
              {renderLeaderboard(cycleData)}
            </div>
          </TabsContent>

          <TabsContent value="allTime" className="space-y-6 md:space-y-8">
            {/* All Time Performance Stats */}
            {allTimeData && allTimeData.currentUser.rank && (
              <div className="space-y-4">
                <SectionHeader
                  icon={Activity}
                  iconColor="blue"
                  title="All-Time Performance"
                  titleSize="lg"
                />
                <p className="text-gray-600 text-sm -mt-2">Historical standings and achievements</p>
                {renderPerformanceStats(allTimeData)}
              </div>
            )}

            {/* All Time Rankings */}
            <div className="space-y-4">
              <SectionHeader
                icon={Crown}
                iconColor="blue"
                title="All-Time Rankings"
                titleSize="lg"
              />
              <p className="text-gray-600 text-sm -mt-2">Hall of fame across all cycles</p>
              {renderLeaderboard(allTimeData)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
