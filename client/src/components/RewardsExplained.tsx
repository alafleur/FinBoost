import { 
  Coins, 
  BarChart3, 
  Trophy,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";

export default function RewardsExplained() {
  const [tierAllocations, setTierAllocations] = useState({
    tier1: 20,
    tier2: 30,
    tier3: 50
  });

  useEffect(() => {
    const fetchRewardsConfig = async () => {
      try {
        const response = await fetch('/api/rewards/config');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setTierAllocations(data.config.tierAllocations);
          }
        }
      } catch (error) {
        console.error('Failed to fetch rewards config:', error);
      }
    };

    fetchRewardsConfig();
  }, []);
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
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 text-center">
              <div className="text-2xl font-bold text-gray-600 mb-2">Tier 1</div>
              <div className="text-3xl font-bold text-gray-700 mb-1">{tierAllocations.tier1}%</div>
              <div className="text-sm text-gray-500">of pool</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">Tier 2</div>
              <div className="text-3xl font-bold text-blue-700 mb-1">{tierAllocations.tier2}%</div>
              <div className="text-sm text-blue-500">of pool</div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-5 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-2">Tier 3</div>
              <div className="text-3xl font-bold text-primary-700 mb-1">{tierAllocations.tier3}%</div>
              <div className="text-sm text-primary-500">of pool</div>
            </div>
          </div>
          
          <p className="text-center text-gray-600 mt-8">
            Even casual members have a chance. The more you engage, the better your odds and payout size.
          </p>
        </div>
        
        {/* Call to Action */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
          <h3 className="font-heading font-semibold text-xl mb-4 text-center">
            The More We Grow, The More You Earn
          </h3>
          
          <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
            Join today to get in early. As our community grows, your potential rewards increase along with it.
          </p>
          
          <div className="flex justify-center">
            <a href="#join-waitlist" className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition duration-300">
              Join the Community <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}