import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Gift } from "lucide-react";

export default function MembershipValue() {
  return (
    <section className="py-16 px-4 bg-white" id="membership-value">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            Where Your Membership Fee Goes
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            You're not just paying for a service — you're fueling a collective system designed to help everyone thrive financially.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Simplified Pie Chart */}
          <div className="relative">
            <div className="w-[320px] h-[320px] mx-auto relative">
              {/* Create a donut chart using CSS approach */}
              <div className="relative w-full h-full">
                {/* Outer circle with conic gradient */}
                <motion.div 
                  className="w-full h-full rounded-full relative"
                  style={{
                    background: `conic-gradient(from 0deg, #4285F4 0deg 198deg, #34A853 198deg 360deg)`
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {/* Inner white circle to create donut effect */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-white rounded-full shadow-md flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-gray-800">$20</p>
                    <p className="text-gray-500 text-sm">monthly membership</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Breakdown below pie chart */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 bg-[#4285F4] rounded-sm mr-3"></div>
                <span className="text-lg font-medium">55% → Collective Rewards Pool</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 bg-[#34A853] rounded-sm mr-3"></div>
                <span className="text-lg font-medium">45% → Financial Education & Platform Operations</span>
              </div>
            </div>
          </div>

          {/* Right column - What You Get */}
          <div>
            <h3 className="font-heading font-semibold text-2xl mb-6">What You Get in Return</h3>

            <div className="space-y-6">
              {/* Learn Card */}
              <motion.div 
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-800 mb-2 flex items-center">
                      📘 Learn
                    </h4>
                    <p className="text-gray-700">
                      Access to high-quality, bite-sized financial education that fits into your busy life.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Earn Card */}
              <motion.div 
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-800 mb-2 flex items-center">
                      🎁 Earn
                    </h4>
                    <p className="text-gray-700">
                      Monthly chance to receive real cash rewards, with top rewards reaching thousands of dollars.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}