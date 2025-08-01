import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, BookOpen, Target } from "lucide-react";

interface DashboardStatsProps {
  user: {
    tier?: string;
    currentCyclePoints?: number;
  } | null;
  poolData: {
    totalPool: number;
  };
  completedLessonsCount: number;
  totalLessonsCount: number;
  getTierDisplayName: (tier: string) => string;
}

export default function DashboardStats({ 
  user, 
  poolData, 
  completedLessonsCount, 
  totalLessonsCount, 
  getTierDisplayName 
}: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Rewards Pool Size */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-white rounded-xl border border-green-100 shadow-sm">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-800">{formatCurrency(poolData.totalPool || 0)}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-green-900 mb-1">Pool Size</h3>
          <p className="text-xs text-green-600">Total rewards available</p>
        </CardContent>
      </Card>

      {/* 2. Current Tier */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-2 shadow-lg">
              {getTierDisplayName(user?.tier || 'tier1')}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Current Tier</h3>
          <p className="text-xs text-blue-600">Your cycle standing</p>
        </CardContent>
      </Card>

      {/* 3. Cycle Points */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-800">{user?.currentCyclePoints || 0}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-purple-900 mb-1">Cycle Points</h3>
          <p className="text-xs text-purple-600">This cycle earned</p>
        </CardContent>
      </Card>

      {/* 4. Lessons */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-blue-600"></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-800">{completedLessonsCount}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-indigo-900 mb-1">Lessons</h3>
          <p className="text-xs text-indigo-600">of {totalLessonsCount} completed</p>
        </CardContent>
      </Card>
    </div>
  );
}