import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Trophy, TrendingUp, BookOpen } from "lucide-react";

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
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Rewards Pool Size */}
      <Card className="bg-white border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-800">${(poolData.totalPool || 0).toLocaleString()}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Rewards Pool Size</h3>
          <p className="text-sm text-gray-600">Available for rewards</p>
        </CardContent>
      </Card>

      {/* 2. Current Tier */}
      <Card className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Trophy className="h-5 w-5 text-slate-600" />
            </div>
            <Badge className="bg-slate-900 text-white text-xs font-medium px-3 py-1">
              {getTierDisplayName(user?.tier || 'tier1')}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Current Tier</h3>
          <p className="text-sm text-slate-600">Cycle standing</p>
        </CardContent>
      </Card>

      {/* 3. Cycle Points */}
      <Card className="bg-white border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-800">{user?.currentCyclePoints || 0}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Cycle Points</h3>
          <p className="text-sm text-gray-600">Current cycle points</p>
        </CardContent>
      </Card>

      {/* 4. Lessons */}
      <Card className="bg-white border border-violet-200 hover:border-violet-300 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-violet-800">{completedLessonsCount}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Lessons</h3>
          <p className="text-sm text-gray-600">of {totalLessonsCount} completed</p>
        </CardContent>
      </Card>
    </div>
  );
}