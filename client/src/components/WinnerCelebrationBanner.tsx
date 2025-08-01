import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, X, Sparkles, DollarSign, Crown, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useWinnerCelebration } from "@/hooks/use-winner-status";

// Step 3: Winner Celebration Banner Component
// Responsive celebration banner for dashboard overview tab
// Mobile-first design with professional styling

export default function WinnerCelebrationBanner() {
  const {
    winnerStatus,
    shouldShowCelebration,
    dismissCelebration,
    isLoading,
    isDismissing
  } = useWinnerCelebration();

  // Don't render if no celebration needed or still loading
  if (!shouldShowCelebration() || isLoading) {
    return null;
  }

  // Step 3: Determine if this is a winner or non-winner celebration
  const isWinner = winnerStatus?.isWinner === true;
  const isNonWinner = winnerStatus?.isWinner === false && winnerStatus?.communityStats;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'tier1':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'tier2':
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 'tier3':
        return <Trophy className="h-5 w-5 text-orange-500" />;
      default:
        return <Trophy className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'tier1': return 'Tier 1';
      case 'tier2': return 'Tier 2';
      case 'tier3': return 'Tier 3';
      default: return 'Winner';
    }
  };

  const getTierColors = (tier: string) => {
    // Changed to green styling for all tiers as requested
    return {
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-800'
    };
  };

  // Step 3: Choose appropriate styling based on winner/non-winner status
  const colors = isWinner 
    ? getTierColors(winnerStatus?.tier || '') 
    : {
        gradient: 'from-blue-500 to-indigo-500',
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        text: 'text-blue-800'
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut",
        delay: 0.2 // Small delay for dramatic effect
      }}
      className="mb-6"
    >
      <Card className={`${colors.bg} ${colors.border} border-2 shadow-lg relative overflow-hidden`}>
        {/* Animated gradient top border */}
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${colors.gradient}`}>
          <motion.div
            className="h-full w-full bg-white opacity-30"
            animate={{ 
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear"
            }}
          />
        </div>

        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 h-8 w-8 p-0 hover:bg-white/50 transition-colors"
          onClick={() => dismissCelebration(winnerStatus?.cycleId)}
          disabled={isDismissing}
          aria-label="Dismiss celebration banner"
        >
          <X className="h-4 w-4 text-gray-500" />
        </Button>

        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon and celebration message */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -5, 5, 0],
                  scale: [1, 1.1, 1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className={`p-3 bg-white rounded-full shadow-sm border ${colors.border}`}
              >
                {isWinner ? getTierIcon(winnerStatus?.tier || '') : <Users className="h-5 w-5 text-blue-500" />}
              </motion.div>

              <div className="flex-1">
                {/* Step 3: Winner vs Non-Winner Content */}
                {isWinner ? (
                  // Winner Content
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-lg font-bold ${colors.text}`}>
                        🎉 Congratulations!
                      </h3>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      </motion.div>
                    </div>
                    
                    <p className={`text-sm ${colors.text} opacity-90 mb-2`}>
                      You're a winner in <strong>{winnerStatus?.cycleName}</strong>!
                    </p>

                    {/* Winner details */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge 
                        variant="secondary" 
                        className={`${colors.text} bg-white/70 border ${colors.border} font-semibold`}
                      >
                        {getTierDisplayName(winnerStatus?.tier || '')} Winner
                      </Badge>
                      
                      {winnerStatus?.rewardAmount && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-700">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(winnerStatus.rewardAmount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Community stats for current cycle */}
                    <div className="mt-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span>
                          {formatCurrency(winnerStatus?.communityStats?.totalDistributed || 0)} total pool rewards distributed to {winnerStatus?.communityStats?.totalWinners || 0} members
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  // Non-Winner Content with Community Stats
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-lg font-bold ${colors.text}`}>
                        🎊 Community Achievement!
                      </h3>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                      >
                        <Users className="h-4 w-4 text-blue-500" />
                      </motion.div>
                    </div>
                    
                    <p className={`text-sm ${colors.text} opacity-90 mb-2`}>
                      <strong>{winnerStatus?.cycleName}</strong> rewards have been distributed!
                    </p>

                    {/* Community achievement stats */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge 
                        variant="secondary" 
                        className={`${colors.text} bg-white/70 border ${colors.border} font-semibold`}
                      >
                        Community Member
                      </Badge>
                      
                      {winnerStatus?.communityStats && (
                        <>
                          <div className="flex items-center gap-1 text-sm font-semibold text-green-700">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(winnerStatus.communityStats.totalDistributed)}</span>
                            <span className="text-xs text-gray-600">distributed</span>
                          </div>

                          <div className="flex items-center gap-1 text-sm font-semibold text-blue-600">
                            <Trophy className="h-4 w-4" />
                            <span>{winnerStatus.communityStats.totalWinners}</span>
                            <span className="text-xs text-gray-600">winners</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Community participation message */}
                    <div className="mt-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        <span>
                          Thank you for participating! Keep learning and earning points for the next cycle.
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}