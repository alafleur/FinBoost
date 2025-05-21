import React from "react";
import { motion } from "framer-motion";

export default function MembershipValue() {
  return (
    <section className="py-16 px-4 bg-white" id="membership-value">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            Your Membership Fuels the Collective
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            More than half of every membership fee goes back into monthly rewards for members like you.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Pie Chart */}
          <div className="relative">
            <div className="w-[320px] h-[320px] mx-auto relative">
              {/* Outer Circle */}
              <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
              
              {/* Create a real pie chart using SVG instead of borders */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="white" stroke="#f1f1f1" strokeWidth="4"/>
                
                {/* Blue segment (55%) - Rewards Pool */}
                <motion.path
                  d="M50,50 L50,2 A48,48 0 0,1 96,50 A48,48 0 0,1 50,98 L50,50 Z"
                  fill="#4285F4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
                
                {/* Green segment (25%) - Education & Platform */}
                <motion.path
                  d="M50,50 L50,98 A48,48 0 0,1 2,50 L50,50 Z"
                  fill="#34A853"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
                
                {/* Purple segment (20%) - Operations */}
                <motion.path
                  d="M50,50 L2,50 A48,48 0 0,1 50,2 L50,50 Z"
                  fill="#A142F4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                />
                
                {/* White center circle */}
                <circle cx="50" cy="50" r="36" fill="white" stroke="#f8f8f8" strokeWidth="1"/>
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full w-[240px] h-[240px] flex flex-col items-center justify-center shadow-md">
                  <p className="text-4xl font-bold text-gray-800">$20</p>
                  <p className="text-gray-500 text-sm">monthly membership</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Breakdown Text */}
          <div>
            <h3 className="font-heading font-semibold text-2xl mb-6">Where Your Membership Fee Goes</h3>
            
            <div className="space-y-6">
              {/* 55% - Rewards Pool */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#E8F0FE] flex items-center justify-center mr-4">
                  <div className="w-6 h-6 bg-[#4285F4] rounded-sm"></div>
                </div>
                <div>
                  <p className="font-bold text-xl text-gray-800 flex items-center">
                    <span className="text-[#4285F4]">55%</span>
                    <span className="mx-2">→</span>
                    Rewards Pool
                  </p>
                  <p className="text-gray-600">
                    Distributed monthly to 50% of members based on points.
                  </p>
                </div>
              </div>
              
              {/* 25% - Education & Platform */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#E6F4EA] flex items-center justify-center mr-4">
                  <div className="w-6 h-6 bg-[#34A853] rounded-sm"></div>
                </div>
                <div>
                  <p className="font-bold text-xl text-gray-800 flex items-center">
                    <span className="text-[#34A853]">25%</span>
                    <span className="mx-2">→</span>
                    Education & Platform
                  </p>
                  <p className="text-gray-600">
                    Access bite-sized lessons, quizzes, and planning resources.
                  </p>
                </div>
              </div>
              
              {/* 20% - Platform Operations */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#F3E8FD] flex items-center justify-center mr-4">
                  <div className="w-6 h-6 bg-[#A142F4] rounded-sm"></div>
                </div>
                <div>
                  <p className="font-bold text-xl text-gray-800 flex items-center">
                    <span className="text-[#A142F4]">20%</span>
                    <span className="mx-2">→</span>
                    Operations
                  </p>
                  <p className="text-gray-600">
                    Supports the tech and growth of the community.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-gray-700 font-medium">
                A membership that benefits everyone. The more we grow, the more we all get rewarded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}