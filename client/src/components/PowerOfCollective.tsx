import { Users } from "lucide-react";
import { motion } from "framer-motion";
import RewardSteps from "./RewardSteps";

export default function PowerOfCollective() {
  // No tiers needed anymore since we removed the reward pool growth section

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
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="font-heading font-semibold text-xl mb-4 text-center">Join a Community That Grows Together</h3>
            <p className="text-gray-600 text-center">
              Our members support each other's financial journeys through shared knowledge, accountability, and a rewards system that benefits everyone.
            </p>
          </div>
        </div>
        
        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-center mb-8">How Our Reward System Works</h3>
          <RewardSteps />
        </div>
      </div>
    </section>
  );
}