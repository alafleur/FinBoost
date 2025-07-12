import { Trophy, Target, Calendar, TrendingUp } from "lucide-react";

export default function HighWinRatesV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
            Over Half of Members Receive Rewards Each Cycle
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - how it works */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-xl mb-4 text-gray-800">How It Works:</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Point-weighted selection based on your performance</p>
                    <p className="text-sm text-gray-600">Better engagement = better odds</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Multiple prize tiers ensure frequent wins</p>
                    <p className="text-sm text-gray-600">Not winner-takes-all, everyone has chances</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Bi-weekly cycles = 26 opportunities per year</p>
                    <p className="text-sm text-gray-600">Regular chances to win throughout the year</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Performance-Based Rewards</h4>
              <p className="text-green-700 text-sm">
                Consistent financial progress leads to consistent winnings. The most engaged members win regularly because they earn it.
              </p>
            </div>
          </div>
          
          {/* Right side - reward tiers */}
          <div className="bg-white rounded-lg shadow-lg p-6 border">
            <h3 className="font-semibold text-xl mb-6 text-gray-800 text-center">Reward Distribution</h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-yellow-800">Top Performers</h4>
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-sm text-yellow-700 mb-1">Larger rewards for consistent action</p>
                <p className="text-xs text-yellow-600">Highest point earners each cycle</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-800">Engaged Participants</h4>
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-blue-700 mb-1">Regular rewards for participation</p>
                <p className="text-xs text-blue-600">Active members who complete actions</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-800">New Members</h4>
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-green-700 mb-1">Entry rewards for getting started</p>
                <p className="text-xs text-green-600">Recognition for taking first steps</p>
              </div>
            </div>
            
            <div className="mt-6 text-center bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-800 text-lg">Over 50% Win Rate</p>
              <p className="text-sm text-gray-600">Multiple winners across all tiers every cycle</p>
            </div>
          </div>
        </div>
        
        {/* Screenshot placeholder for reward results */}
        <div className="mt-12 bg-gray-50 rounded-lg p-8">
          <div className="text-center mb-6">
            <h3 className="font-semibold text-lg text-gray-800">Recent Reward Distribution</h3>
            <p className="text-sm text-gray-600">See how rewards are distributed to community members</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto aspect-video flex items-center justify-center">
            <div className="text-center">
              <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">App Screenshot: Reward Results</p>
              <p className="text-sm text-gray-500 mt-1">Recent winners and payout amounts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}