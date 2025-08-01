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
      <Card className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <Target className="h-5 w-5 text-gray-600" />
            </div>
            <Badge className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 shadow-sm">
              {getTierDisplayName(user?.tier || 'tier1')}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Current Tier</h3>
          <p className="text-xs text-gray-500">Cycle standing</p>
        </CardContent>
      </Card>

      {/* 3. Cycle Points */}
      <Card className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{user?.currentCyclePoints || 0}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Cycle Points</h3>
          <p className="text-xs text-gray-500">Current cycle points</p>
        </CardContent>
      </Card>

      {/* 4. Lessons */}
      <Card className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <BookOpen className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{completedLessonsCount}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Lessons</h3>
          <p className="text-xs text-gray-500">of {totalLessonsCount} completed</p>
        </CardContent>
      </Card>
    </div>
  );
}