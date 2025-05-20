import { Users } from "lucide-react";
import { motion } from "framer-motion";

export default function PowerOfCollective() {
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
      pool: '$100,000+',
      width: '100%'
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50" id="power-of-collective">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            <span className="text-primary-500">💪</span> The Power of the Collective
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The more members who join, the larger the monthly rewards pool.
            <br />
            <span className="font-medium">Real people. Real money. Real financial progress.</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="font-heading font-semibold text-2xl mb-6">Growing Together</h3>
            <p className="text-gray-600 mb-8">
              Every new member who joins increases the potential rewards for everyone. As our community grows, 
              the financial impact increases exponentially.
            </p>
            
            <div className="mb-8">
              <p className="text-lg font-medium mb-4">How it works:</p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 mr-3">
                    <span className="text-green-600 text-sm font-bold">1</span>
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">Members contribute:</span> Everyone pays the same monthly fee ($19.99)
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1 mr-3">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">Rewards pool forms:</span> Over half of all fees go directly into the monthly rewards pool
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-1 mr-3">
                    <span className="text-purple-600 text-sm font-bold">3</span>
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">Distributed by tiers:</span> The pool is distributed to members based on their tier and random selection
                  </p>
                </li>
              </ul>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-gray-600 text-sm">
                <span className="block text-lg font-medium text-gray-800">Community-Powered Finance</span>
                Your success helps others, and their success helps you
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-100">
            <h3 className="font-heading font-semibold text-xl mb-8 text-center">Reward Pool Growth</h3>
            
            <div className="space-y-8">
              {tiers.map((tier, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xl md:text-2xl font-bold">{tier.members}</span>
                      <span className="text-gray-500 ml-2">members</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl md:text-2xl font-bold gradient-text">{tier.pool}</span>
                      <span className="text-gray-500 ml-2">rewards pool</span>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
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
            
            <div className="mt-8 text-center text-gray-500 text-sm">
              These figures are illustrative and based on a portion of membership fees going to the rewards pool.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}