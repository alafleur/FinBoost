import { motion } from "framer-motion";

export default function MembershipGrowthChart() {
  return (
    <div className="mt-12 bg-white rounded-xl shadow-md p-8 border border-gray-100">
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
        <p className="mt-2 text-xs font-medium text-gray-600">Based on $19.99 monthly membership fee</p>
      </div>
    </div>
  );
}