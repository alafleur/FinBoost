import { DollarSign, BarChart3, TrendingUp, Users } from "lucide-react";

export default function HowRewardsWork() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white" id="how-rewards-work">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            <span className="text-accent-500">💸</span> How Rewards Work
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Each month, more than half of all membership fees go back to members through our collective rewards pool.
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl overflow-hidden shadow-md transform hover:scale-105 transition-transform">
            <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <div className="p-5 bg-white border-t-0 border-x border-b border-gray-200">
              <p className="font-bold text-lg mb-2 text-primary-700">Learn & Earn</p>
              <p className="text-gray-600">Each lesson completed increases your points &amp; tier potential</p>
              <div className="mt-3 flex">
                <span className="inline-block bg-primary-100 rounded-full px-2 py-1 text-xs font-semibold text-primary-700">+points</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl overflow-hidden shadow-md transform hover:scale-105 transition-transform">
            <div className="h-24 bg-gradient-to-r from-secondary-500 to-secondary-600 flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
            <div className="p-5 bg-white border-t-0 border-x border-b border-gray-200">
              <p className="font-bold text-lg mb-2 text-secondary-700">Monthly Rewards</p>
              <p className="text-gray-600">Cash payouts distributed to members every month</p>
              <div className="mt-3 flex">
                <span className="inline-block bg-secondary-100 rounded-full px-2 py-1 text-xs font-semibold text-secondary-700">recurring</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl overflow-hidden shadow-md transform hover:scale-105 transition-transform">
            <div className="h-24 bg-gradient-to-r from-accent-500 to-accent-600 flex items-center justify-center">
              <Users className="h-10 w-10 text-white" />
            </div>
            <div className="p-5 bg-white border-t-0 border-x border-b border-gray-200">
              <p className="font-bold text-lg mb-2 text-accent-700">Growing Pool</p>
              <p className="text-gray-600">More members = bigger rewards pool for everyone</p>
              <div className="mt-3 flex">
                <span className="inline-block bg-accent-100 rounded-full px-2 py-1 text-xs font-semibold text-accent-700">community</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}