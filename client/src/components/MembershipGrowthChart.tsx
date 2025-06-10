import { motion } from "framer-motion";

export default function MembershipGrowthChart() {
  return (
    <div className="mt-12">
      {/* Growth Chart */}
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 mb-8">
        <h3 className="text-xl font-semibold text-center mb-6">More Members = Bigger Monthly Rewards</h3>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>1,000 Members</span>
              <span className="font-medium">$10,000 Pool</span>
            </div>
            <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 via-teal-400 to-green-500"
                style={{ width: '0%' }}
                animate={{ width: '25%' }}
                transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>5,000 Members</span>
              <span className="font-medium">$50,000 Pool</span>
            </div>
            <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 via-teal-400 to-green-500"
                style={{ width: '0%' }}
                animate={{ width: '50%' }}
                transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>10,000 Members</span>
              <span className="font-medium">$100,000 Pool</span>
            </div>
            <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 via-teal-400 to-green-500"
                style={{ width: '0%' }}
                animate={{ width: '75%' }}
                transition={{ duration: 1.6, delay: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>25,000+ Members</span>
              <span className="font-medium">$250,000+ Pool</span>
            </div>
            <div className="bg-gray-200 rounded-full h-[30px] w-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 via-teal-400 to-green-500"
                style={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, delay: 1.0, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>The more members join, the larger the monthly rewards pool becomes</p>
          <p className="mt-2 text-xs font-medium text-gray-600">Based on $20 monthly membership fee</p>
        </div>
      </div>

      

      {/* Example Reward Distribution */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
        <p className="text-center text-lg font-medium flex items-center justify-center gap-2 mb-4">
          <span className="text-amber-500">💰</span> Example Reward Distribution
        </p>
        <p className="text-gray-600 mb-6 text-center">
          If the reward pool is $100,000, the top third shares $50,000, the middle third shares $35,000, and the bottom third shares $15,000.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary-50 p-4 rounded-lg text-center">
            <p className="font-semibold text-lg">Top Tier</p>
            <p className="text-primary-600 font-bold text-xl">$50,000</p>
            <p className="text-sm text-gray-600">50% of pool</p>
          </div>
          <div className="bg-secondary-50 p-4 rounded-lg text-center">
            <p className="font-semibold text-lg">Middle Tier</p>
            <p className="text-secondary-600 font-bold text-xl">$35,000</p>
            <p className="text-sm text-gray-600">35% of pool</p>
          </div>
          <div className="bg-accent-50 p-4 rounded-lg text-center">
            <p className="font-semibold text-lg">Bottom Tier</p>
            <p className="text-accent-600 font-bold text-xl">$15,000</p>
            <p className="text-sm text-gray-600">15% of pool</p>
          </div>
        </div>
      </div>
    </div>
  );
}