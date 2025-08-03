import { Trophy, Target, Users } from "lucide-react";

export default function TierSystem() {
  const tiers = [
    {
      number: 1,
      title: "Tier 1",
      description: "Top performers get the biggest share",
      icon: <Trophy className="h-6 w-6" />,
      gradient: "from-accent to-accent-light"
    },
    {
      number: 2,
      title: "Tier 2", 
      description: "Consistent earners get steady rewards",
      icon: <Target className="h-6 w-6" />,
      gradient: "from-accent to-accent-light"
    },
    {
      number: 3,
      title: "Tier 3",
      description: "Everyone wins, even beginners",
      icon: <Users className="h-6 w-6" />,
      gradient: "from-accent to-accent-light"
    }
  ];

  return (
    <div className="mb-12">
      {/* Tier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {tiers.map((tier) => (
          <div key={tier.number} className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${tier.gradient} rounded-full flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xl">{tier.number}</span>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">{tier.title}</h3>
            <p className="text-gray-600 text-sm">{tier.description}</p>
          </div>
        ))}
      </div>

      {/* Example Reward Distribution */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-orange-600 text-lg">💰</span>
          </div>
          <h3 className="font-semibold text-lg text-gray-800">Example Reward Distribution</h3>
        </div>
        
        <p className="text-center text-gray-600 mb-6">
          If the reward pool is $100,000, the top third shares $50,000, the middle third shares $35,000, and the bottom third shares $15,000.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="font-bold text-2xl text-yellow-700 mb-1">$50,000</div>
            <div className="text-sm text-yellow-600 font-medium mb-1">Top Tier</div>
            <div className="text-xs text-yellow-500">50% of pool</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="font-bold text-2xl text-blue-700 mb-1">$35,000</div>
            <div className="text-sm text-blue-600 font-medium mb-1">Middle Tier</div>
            <div className="text-xs text-blue-500">35% of pool</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="font-bold text-2xl text-green-700 mb-1">$15,000</div>
            <div className="text-sm text-green-600 font-medium mb-1">Bottom Tier</div>
            <div className="text-xs text-green-500">15% of pool</div>
          </div>
        </div>
      </div>
    </div>
  );
}