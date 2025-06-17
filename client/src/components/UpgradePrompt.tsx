import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradePromptProps {
  theoreticalPoints: number;
  currentCyclePoints: number;
  membershipJoinBonus?: number;
}

export default function UpgradePrompt({ 
  theoreticalPoints, 
  currentCyclePoints,
  membershipJoinBonus = 100 
}: UpgradePromptProps) {
  const [, setLocation] = useLocation();

  const totalClaimablePoints = theoreticalPoints + currentCyclePoints;

  return (
    <Card className="border-2 border-gradient-to-r from-yellow-400 to-orange-500 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-600" />
          <CardTitle className="text-xl font-bold text-gray-800">
            Unlock Member Benefits
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Limited Time
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {theoreticalPoints > 0 && (
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  You have {theoreticalPoints} points waiting to be claimed!
                </p>
                <p className="text-sm text-gray-600">
                  Upgrade now to convert these to real points
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <TrendingUp className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-800">Earn Real Points</p>
            <p className="text-xs text-gray-600">Convert theoretical to real</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <Users className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-800">Compete for Rewards</p>
            <p className="text-xs text-gray-600">Join monthly prize pool</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <Crown className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-800">Premium Content</p>
            <p className="text-xs text-gray-600">Access all modules</p>
          </div>
        </div>



        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setLocation('/subscribe')}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
          >
            Become a Member - $20/month
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/education')}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Continue Learning Free
          </Button>
        </div>

        {totalClaimablePoints > 0 && (
          <p className="text-center text-sm text-gray-600">
            Total points available after upgrade: <span className="font-semibold text-orange-600">{totalClaimablePoints + membershipJoinBonus}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}