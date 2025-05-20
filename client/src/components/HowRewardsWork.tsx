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
        
        <div className="relative py-10">
          {/* Connecting line running through the middle */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 via-secondary-400 to-accent-400 hidden md:block"></div>
          
          {/* First item */}
          <div className="mb-16 md:mb-0 relative md:grid md:grid-cols-2 md:gap-8 items-center">
            <div className="md:col-start-1 md:pr-10 relative z-10 mb-8 md:mb-0">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 md:from-primary-600 md:to-primary-700 p-6 rounded-2xl shadow-xl transform rotate-2 md:rotate-3 relative overflow-hidden hover:-rotate-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 -mt-4 -mr-4 bg-primary-400 rounded-full opacity-50"></div>
                <h3 className="text-white text-xl md:text-2xl font-bold mb-3">Learn & Earn</h3>
                <p className="text-primary-50 font-medium">Each lesson completed boosts your points & unlocks higher tier potential</p>
                <div className="flex mt-4">
                  <BarChart3 className="h-8 w-8 text-white opacity-70" />
                </div>
              </div>
            </div>
            
            <div className="md:col-start-2 hidden md:block">
              <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-primary-500">
                <div className="flex items-center">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div className="ml-4">
                    <span className="block text-xl font-bold text-gray-800">Complete Lessons</span>
                    <span className="text-gray-600">Short, bite-sized financial education</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Connector dot */}
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary-500 rounded-full border-4 border-white shadow"></div>
          </div>
          
          {/* Second item */}
          <div className="mb-16 md:mb-0 relative md:grid md:grid-cols-2 md:gap-8 items-center md:mt-20">
            <div className="md:col-start-2 md:pl-10 relative z-10 mb-8 md:mb-0">
              <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 md:from-secondary-600 md:to-secondary-700 p-6 rounded-2xl shadow-xl transform -rotate-2 md:-rotate-3 relative overflow-hidden hover:rotate-1 transition-all duration-300">
                <div className="absolute top-0 left-0 w-16 h-16 -mt-4 -ml-4 bg-secondary-400 rounded-full opacity-50"></div>
                <h3 className="text-white text-xl md:text-2xl font-bold mb-3">Monthly Rewards</h3>
                <p className="text-secondary-50 font-medium">Real cash payouts distributed to members every single month</p>
                <div className="flex mt-4">
                  <DollarSign className="h-8 w-8 text-white opacity-70" />
                </div>
              </div>
            </div>
            
            <div className="md:col-start-1 hidden md:block">
              <div className="bg-white p-5 rounded-xl shadow-lg border-r-4 border-secondary-500">
                <div className="flex items-center">
                  <div className="bg-secondary-100 p-3 rounded-full">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <span className="block text-xl font-bold text-gray-800">Get Paid</span>
                    <span className="text-gray-600">50% of members receive rewards each month</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Connector dot */}
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-secondary-500 rounded-full border-4 border-white shadow"></div>
          </div>
          
          {/* Third item */}
          <div className="relative md:grid md:grid-cols-2 md:gap-8 items-center md:mt-20">
            <div className="md:col-start-1 md:pr-10 relative z-10">
              <div className="bg-gradient-to-br from-accent-500 to-accent-600 md:from-accent-600 md:to-accent-700 p-6 rounded-2xl shadow-xl transform rotate-2 md:rotate-3 relative overflow-hidden hover:-rotate-1 transition-all duration-300">
                <div className="absolute bottom-0 right-0 w-16 h-16 -mb-4 -mr-4 bg-accent-400 rounded-full opacity-50"></div>
                <h3 className="text-white text-xl md:text-2xl font-bold mb-3">Growing Pool</h3>
                <p className="text-accent-50 font-medium">The more members join, the bigger the rewards pool becomes for everyone</p>
                <div className="flex mt-4">
                  <Users className="h-8 w-8 text-white opacity-70" />
                </div>
              </div>
            </div>
            
            <div className="md:col-start-2 hidden md:block">
              <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-accent-500">
                <div className="flex items-center">
                  <div className="bg-accent-100 p-3 rounded-full">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="ml-4">
                    <span className="block text-xl font-bold text-gray-800">Community Power</span>
                    <span className="text-gray-600">Your success helps others succeed too</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Connector dot */}
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-accent-500 rounded-full border-4 border-white shadow"></div>
          </div>
          
          {/* Mobile-only cards - simpler versions of the desktop view */}
          <div className="md:hidden space-y-6 mt-8">
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-primary-500">
              <div className="flex items-center">
                <div className="bg-primary-100 p-2 rounded-full">
                  <span className="text-xl">🎓</span>
                </div>
                <div className="ml-3">
                  <span className="block text-lg font-bold text-gray-800">Complete Lessons</span>
                  <span className="text-sm text-gray-600">Short, bite-sized financial education</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-secondary-500">
              <div className="flex items-center">
                <div className="bg-secondary-100 p-2 rounded-full">
                  <span className="text-xl">💰</span>
                </div>
                <div className="ml-3">
                  <span className="block text-lg font-bold text-gray-800">Get Paid</span>
                  <span className="text-sm text-gray-600">50% of members receive rewards each month</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-accent-500">
              <div className="flex items-center">
                <div className="bg-accent-100 p-2 rounded-full">
                  <span className="text-xl">🚀</span>
                </div>
                <div className="ml-3">
                  <span className="block text-lg font-bold text-gray-800">Community Power</span>
                  <span className="text-sm text-gray-600">Your success helps others succeed too</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}