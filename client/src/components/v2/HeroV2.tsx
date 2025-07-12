import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { BarChart2, TrendingUp, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeroV2Props {
  onSubscribeSuccess: () => void;
}

export default function HeroV2({ onSubscribeSuccess }: HeroV2Props) {
  const [, navigate] = useLocation();
  const [memberCount] = useState("2,400+");

  const handleStartLearning = () => {
    trackEvent("cta_click", "start_learning_hero_v2");
    navigate("/auth?mode=signup");
  };

  return (
    <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-24 bg-gradient-to-b from-white via-blue-50/30 to-blue-100/50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight text-gray-800">
              Your Financial Comeback Starts Here <span className="gradient-text">– And We'll Reward You For It</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-lg">
              Learn powerful money skills. Take real financial actions. Earn points and win real cash rewards every two weeks. Join our limited Early Access where every prize pool is guaranteed.
            </p>
            <div className="max-w-lg space-y-4">
              <Button 
                onClick={handleStartLearning}
                size="lg"
                className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 rounded-lg shadow-xl transition duration-300 border border-blue-700 text-lg flex items-center justify-center hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                Claim Early Access & Start Earning
              </Button>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1 text-blue-600" />
                  Prize pools guaranteed
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  Over 50% win rate
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-purple-600" />
                  Limited Early Access
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3">Join {memberCount} learners already improving their financial health</p>
          </div>
          <div className="relative">
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <BarChart2 className="h-10 w-10 text-white" />
                </div>
              </div>

              <h3 className="font-heading font-semibold text-xl mb-4 text-center">Early Access Benefits</h3>

              <ul className="space-y-4 mt-6">
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Prize pools guaranteed by FinBoost</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Over half of members win each cycle</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Better odds with smaller community</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}