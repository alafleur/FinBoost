import { Trophy, Target, Calendar, TrendingUp } from "lucide-react";

export default function HighWinRatesV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
            Over Half of Members Receive Rewards Each Cycle
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
            Multiple prize tiers and point-weighted selection ensure frequent wins. The most engaged members win consistently because they earn it.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-center">Point-Weighted Selection</h3>
            <p className="text-gray-600 text-sm text-center">Better engagement = better odds of winning</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-center">Multiple Prize Tiers</h3>
            <p className="text-gray-600 text-sm text-center">Not winner-takes-all, everyone has chances</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-center">Bi-Weekly Cycles</h3>
            <p className="text-gray-600 text-sm text-center">26 opportunities to win throughout the year</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="font-semibold text-xl mb-6 text-gray-800 text-center">Reward Distribution Tiers</h3>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-yellow-800">Top Performers</h4>
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-sm text-yellow-700">Larger rewards for consistent action and highest point earners each cycle</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-800">Engaged Participants</h4>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700">Regular rewards for active members who complete financial actions</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-800">New Members</h4>
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-green-700">Entry rewards for getting started and taking first financial steps</p>
            </div>
          </div>
          
          <div className="mt-6 text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="font-semibold text-gray-800 text-lg">Over 50% Win Rate</p>
            <p className="text-sm text-gray-600">Multiple winners across all tiers every cycle</p>
          </div>
        </div>
      </div>
    </section>
  );
}