import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, BookOpen, Target } from "lucide-react";
import { 
  StatCardColors, 
  getCardClasses, 
  getAccentClasses, 
  getIconContainerClasses, 
  getIconColorClasses, 
  getTextClasses,
  DashboardColors 
} from "@/lib/colors";

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
      {/* 1. Current Tier - MOVED FIRST due to distinctive badge */}
      <Card className={getCardClasses(StatCardColors.currentTier)}>
        <div className={`absolute top-0 left-0 w-full h-1.5 ${getAccentClasses(StatCardColors.currentTier)}`}></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={getIconContainerClasses(StatCardColors.currentTier)}>
              <Target className={`h-6 w-6 ${getIconColorClasses(StatCardColors.currentTier)}`} />
            </div>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 text-xs font-medium px-3 py-1.5 shadow-lg">
              {getTierDisplayName(user?.tier || 'tier1')}
            </Badge>
          </div>
          <h3 className={`text-sm ${DashboardColors.text.secondary} mb-1`}>Current Tier</h3>
          <p className={`text-xs ${DashboardColors.text.muted}`}>Cycle standing</p>
        </CardContent>
      </Card>

      {/* 2. Rewards Pool Size */}
      <Card className={getCardClasses(StatCardColors.poolSize)}>
        <div className={`absolute top-0 left-0 w-full h-1.5 ${getAccentClasses(StatCardColors.poolSize)}`}></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={getIconContainerClasses(StatCardColors.poolSize)}>
              <Trophy className={`h-6 w-6 ${getIconColorClasses(StatCardColors.poolSize)}`} />
            </div>
            <div className="text-right">
              <div className={`text-2xl ${DashboardColors.text.primary}`}>{formatCurrency(poolData.totalPool || 0)}</div>
            </div>
          </div>
          <h3 className={`text-sm ${DashboardColors.text.secondary} mb-1`}>Pool Size</h3>
          <p className={`text-xs ${DashboardColors.text.muted}`}>Total rewards available</p>
        </CardContent>
      </Card>

      {/* 3. Cycle Points */}
      <Card className={getCardClasses(StatCardColors.cyclePoints)}>
        <div className={`absolute top-0 left-0 w-full h-1.5 ${getAccentClasses(StatCardColors.cyclePoints)}`}></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={getIconContainerClasses(StatCardColors.cyclePoints)}>
              <TrendingUp className={`h-6 w-6 ${getIconColorClasses(StatCardColors.cyclePoints)}`} />
            </div>
            <div className="text-right">
              <div className={`text-2xl ${DashboardColors.text.primary}`}>{user?.currentCyclePoints || 0}</div>
            </div>
          </div>
          <h3 className={`text-sm ${DashboardColors.text.secondary} mb-1`}>Cycle Points</h3>
          <p className={`text-xs ${DashboardColors.text.muted}`}>Current progress</p>
        </CardContent>
      </Card>

      {/* 4. Lessons */}
      <Card className={getCardClasses(StatCardColors.lessons)}>
        <div className={`absolute top-0 left-0 w-full h-1.5 ${getAccentClasses(StatCardColors.lessons)}`}></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={getIconContainerClasses(StatCardColors.lessons)}>
              <BookOpen className={`h-6 w-6 ${getIconColorClasses(StatCardColors.lessons)}`} />
            </div>
            <div className="text-right">
              <div className={`text-2xl ${DashboardColors.text.primary}`}>{completedLessonsCount}</div>
              <div className={`text-xs ${DashboardColors.text.muted}`}>of {totalLessonsCount}</div>
            </div>
          </div>
          <h3 className={`text-sm ${DashboardColors.text.secondary} mb-1`}>Lessons</h3>
          <p className={`text-xs ${DashboardColors.text.muted}`}>Completed</p>
        </CardContent>
      </Card>
    </div>
  );
}