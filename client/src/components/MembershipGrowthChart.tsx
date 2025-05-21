import { motion } from "framer-motion";

export default function MembershipGrowthChart() {
  const tiers = [
    {
      members: '1,000',
      pool: '$10,000',
      width: '25%'
    },
    {
      members: '5,000',
      pool: '$50,000', 
      width: '50%'
    },
    {
      members: '10,000',
      pool: '$100,000',
      width: '75%'
    },
    {
      members: '25,000+',
      pool: '$250,000+',
      width: '100%'
    }
  ];

  return (
    <div className="mt-10 bg-white rounded-xl shadow-md p-8 border border-gray-100">
      <h3 className="text-xl font-semibold text-center mb-6">More Members = Bigger Monthly Rewards</h3>
      
      <div className="space-y-8 mt-8">
        {tiers.map((tier, index) => (
          <div key={index} className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-lg font-medium">{tier.members}</span>
                <span className="text-gray-500 ml-2">Members</span>
              </div>
              <div>
                <span className="text-lg font-medium text-primary-600">{tier.pool}</span>
                <span className="text-gray-500 ml-2">Pool</span>
              </div>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 via-teal-400 to-green-500"
                style={{ width: '0%' }}
                animate={{ width: tier.width }}
                transition={{ 
                  duration: 1.5,
                  delay: index * 0.3,
                  ease: "easeOut"
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-gray-600 mt-8">
        <p>The more members join, the larger the monthly rewards pool becomes</p>
        <p className="text-sm text-gray-500 mt-2">Based on $19.99 monthly membership fee</p>
      </div>
    </div>
  );
}