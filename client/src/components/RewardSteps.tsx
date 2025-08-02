import { BarChart2, DollarSign, Users } from "lucide-react";

export default function RewardSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
            <BarChart2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-center mb-3">Learn & Earn</h3>
        <p className="text-gray-600 mb-4">
          Members earn points by completing quick financial lessons, referring friends, and making smart money moves.
        </p>
        <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm font-bold">1</span>
          </div>
          <p className="ml-3 text-sm text-gray-600">
            Each lesson completed increases your points
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-center mb-3">Cycle Rewards</h3>
        <p className="text-gray-600 mb-4">
          Based on those points, members are placed into three tiers, and then 50% of users in each tier receive cash rewards each cycle.
        </p>
        <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm font-bold">2</span>
          </div>
          <p className="ml-3 text-sm text-gray-600">
            Cash payouts happen every month
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-center mb-3">Growing Pool</h3>
        <p className="text-gray-600 mb-4">
          Top rewards have the potential to reach into the thousands of dollars as our community grows.
        </p>
        <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm font-bold">3</span>
          </div>
          <p className="ml-3 text-sm text-gray-600">
            More members = bigger rewards for all
          </p>
        </div>
      </div>
    </div>
  );
}