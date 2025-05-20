import { 
  Coins, 
  BarChart3, 
  Trophy,
  ArrowRight
} from "lucide-react";

export default function RewardsExplained() {
  return (
    <section className="py-20 px-4 bg-white" id="rewards-explained">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            <span className="text-accent-500">💸</span> How the Rewards Work
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our unique three-tiered system rewards all levels of participation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-6">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">
              🪙 Earn Points
            </h3>
            <p className="text-gray-600">
              Complete tutorials, quizzes, refer others, and upload proof of good financial behavior like debt repayment or investing.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-6">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">
              📊 Climb the Tiers
            </h3>
            <p className="text-gray-600">
              Each month, members are placed into 3 tiers (Top / Middle / Bottom) based on their Points.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-3">
              🎉 Get Rewarded
            </h3>
            <p className="text-gray-600">
              50% of users in every tier are randomly selected to receive cash bonuses. Higher tiers = larger pool shares.
            </p>
          </div>
        </div>
        
        {/* Rewards pool distribution */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8 mb-10">
          <h3 className="font-heading font-semibold text-xl mb-6 text-center">
            Pool Distribution
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-5 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-2">Top Tier</div>
              <div className="text-3xl font-bold gradient-text">50%</div>
              <div className="text-sm text-gray-600 mt-2">of rewards pool</div>
            </div>
            
            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-5 text-center">
              <div className="text-2xl font-bold text-secondary-600 mb-2">Middle Tier</div>
              <div className="text-3xl font-bold gradient-text">35%</div>
              <div className="text-sm text-gray-600 mt-2">of rewards pool</div>
            </div>
            
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg p-5 text-center">
              <div className="text-2xl font-bold text-accent-600 mb-2">Bottom Tier</div>
              <div className="text-3xl font-bold gradient-text">15%</div>
              <div className="text-sm text-gray-600 mt-2">of rewards pool</div>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mt-8">
            Even casual members have a chance. The more you engage, the better your odds and payout size.
          </p>
        </div>
        
        {/* As We Grow, So Do the Rewards */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
          <h3 className="font-heading font-semibold text-xl mb-6 text-center">
            As We Grow, So Do the Rewards
          </h3>
          
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">1,000 Members</span>
                <span className="font-medium">~$10,000 Monthly Pool</span>
              </div>
              <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                <div className="reward-pool" style={{ width: "20%" }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">5,000 Members</span>
                <span className="font-medium">~$50,000 Monthly Pool</span>
              </div>
              <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                <div className="reward-pool" style={{ width: "50%" }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">10,000 Members</span>
                <span className="font-medium">~$100,000+ Monthly Pool</span>
              </div>
              <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
                <div className="reward-pool" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mt-8">
            The more members who join, the bigger the monthly pool — and the greater your potential payout.
          </p>
        </div>
      </div>
    </section>
  );
}