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
          <div className="flex justify-center">
            <div className="relative w-80 h-80">
              {/* Colored segments */}
              <div className="absolute inset-0 overflow-hidden rounded-full border-[12px] border-gray-100">
                <div className="w-full h-full relative">
                  {/* Blue segment (55%) */}
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[#4285F4] rounded-full" 
                       style={{ clipPath: 'polygon(50% 50%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
                  
                  {/* Green segment (25%) */}
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[#34A853] rounded-full" 
                       style={{ clipPath: 'polygon(50% 50%, 50% 100%, 0% 100%, 0% 50%)' }}></div>
                  
                  {/* Purple segment (20%) */}
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[#A142F4] rounded-full" 
                       style={{ clipPath: 'polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%)' }}></div>
                </div>
              </div>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full w-52 h-52 flex flex-col items-center justify-center shadow-sm">
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
          </div>
        </div>
      </div>
    </section>
  );
}