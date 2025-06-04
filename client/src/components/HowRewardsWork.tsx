import { DollarSign, BarChart3, TrendingUp, Users } from "lucide-react";
import MembershipGrowthChart from "./MembershipGrowthChart";

export default function HowRewardsWork() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-blue-50/70 to-white" id="how-rewards-work">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            <span className="text-primary-500">💪</span> Strength in Numbers
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            The more members who join, the larger the monthly rewards pool.
            <br />
            <span className="font-medium">Real people. Real money. Real financial progress.</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <p className="font-medium text-lg mb-2">Earn Points</p>
              <p className="text-gray-600">
                Members earn points by completing quick financial lessons, referring friends, and making smart money moves.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-secondary-600" />
              </div>
              <p className="font-medium text-lg mb-2">Tier Placement</p>
              <p className="text-gray-600">
                Based on those points, members are placed into three tiers, and then 50% of users in each tier receive cash rewards each month.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-accent-600" />
              </div>
              <p className="font-medium text-lg mb-2">Receive Rewards</p>
              <p className="text-gray-600">
                Top rewards have the potential to reach into the thousands of dollars.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-lg flex items-center gap-2">
                  <span className="text-gradient">📈</span> Community Growth Benefits Everyone
                </p>
                <p className="text-gray-600">
                  The more you engage—and the more our community grows—the bigger the rewards for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { tier: "Tier 3", percentage: "60%", color: "bg-gradient-to-r from-yellow-400 to-yellow-600", description: "Top performers get the biggest share" },
          { tier: "Tier 2", percentage: "30%", color: "bg-gradient-to-r from-slate-400 to-slate-600", description: "Consistent earners get steady rewards" },
          { tier: "Tier 1", percentage: "10%", color: "bg-gradient-to-r from-orange-400 to-orange-600", description: "Everyone wins, even beginners" }
        ].map((tier, index) => (
          <div key={index} className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-blue-200 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className={`w-12 h-12 ${tier.color} rounded-full mx-auto mb-4 flex items-center justify-center shadow-md`}>
              <span className="text-white font-bold">{index + 1}</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-blue-900">{tier.tier}</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">{tier.percentage}</p>
            <p className="text-sm text-blue-700">{tier.description}</p>
          </div>
        ))}
      </div>

        <MembershipGrowthChart />
      </div>
    </section>
  );
}
```