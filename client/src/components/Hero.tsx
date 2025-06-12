import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import QuizDialog from "@/components/QuizDialog";
import { BarChart2, TrendingUp, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeroProps {
  onSubscribeSuccess: () => void;
}

export default function Hero({ onSubscribeSuccess }: HeroProps) {
  const [, navigate] = useLocation();
  const [memberCount] = useState("2,400+");

  const handleStartLearning = () => {
    trackEvent("cta_click", "start_learning_hero");
    navigate("/auth?mode=signup");
  };

  return (
    <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-24 bg-gradient-to-b from-white via-blue-50/30 to-blue-100/50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight text-gray-800">
              Get Your Free Financial Health Score <span className="gradient-text">+ Start Learning</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-lg">
              Take our 2-minute assessment to discover your financial personality and unlock personalized lessons + monthly cash rewards.
            </p>
            <div className="max-w-lg space-y-4">
              <Button 
                onClick={handleStartLearning}
                size="lg"
                className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 rounded-lg shadow-xl transition duration-300 border border-blue-700 text-lg flex items-center justify-center hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                <BarChart2 className="h-5 w-5 mr-2" />
                Get My Financial Score Free
              </Button>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1 text-blue-600" />
                  Free lessons
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  Personalized insights
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-purple-600" />
                  Cash rewards
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

              <h3 className="font-heading font-semibold text-xl mb-4 text-center">Financial Progress Made Simple</h3>

              <ul className="space-y-4 mt-6">
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Learn essential financial skills</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Take action and earn points</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Receive cash rewards monthly</p>
                </li>
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600">Join a community that grows together</p>
                <p className="text-primary-600 font-medium mt-2">The more we learn, the more we earn</p>
                <div className="mt-4 flex justify-center">
                  <div className="transform hover:scale-105 transition-transform">
                    <QuizDialog />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}