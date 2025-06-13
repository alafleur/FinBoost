import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import QuizDialog from "@/components/QuizDialog";
import EmailCaptureModal from "@/components/EmailCaptureModal";
import { BarChart2, TrendingUp, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeroProps {
  onSubscribeSuccess: () => void;
}

export default function Hero({ onSubscribeSuccess }: HeroProps) {
  const [, navigate] = useLocation();
  const [memberCount] = useState("2,400+");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleStartLearning = () => {
    trackEvent("cta_click", "start_learning_hero");
    setIsEmailModalOpen(true);
  };

  return (
    <section className="pt-24 pb-16 px-6 md:pt-40 md:pb-24 bg-gradient-to-b from-white via-blue-50/30 to-blue-100/50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 lg:mb-8 leading-tight text-gray-800">
              Turn Financial Stress into Financial Progress <span className="gradient-text">– Together</span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg md:text-xl mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0">
              Earn monthly cash rewards while leveling up your money smarts, with the power of the collective behind you.
            </p>
            <div className="max-w-lg mx-auto lg:mx-0 space-y-6">
              <Button 
                onClick={handleStartLearning}
                size="lg"
                className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 rounded-lg shadow-xl transition duration-300 border border-blue-700 text-base sm:text-lg flex items-center justify-center hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                Get Started on Boosting Your Finances
              </Button>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-blue-600" />
                  Free lessons
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                  Financial assessment
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-purple-600" />
                  Cash rewards
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-6 lg:mt-4">Join {memberCount} learners already improving their financial health</p>
          </div>
          <div className="relative mt-12 lg:mt-0">
            <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 max-w-md mx-auto lg:max-w-none">
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <BarChart2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>

              <h3 className="font-heading font-semibold text-lg sm:text-xl mb-6 text-center">Financial Progress Made Simple</h3>

              <ul className="space-y-5 mb-8">
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-gray-700 text-sm sm:text-base">Learn essential financial skills</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-gray-700 text-sm sm:text-base">Take action and earn points</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-gray-700 text-sm sm:text-base">Receive cash rewards monthly</p>
                </li>
              </ul>

              <div className="pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600 text-sm sm:text-base mb-2">Join a community that grows together</p>
                <p className="text-primary-600 font-medium mb-6 text-sm sm:text-base">The more we learn, the more we earn</p>
                <div className="flex justify-center">
                  <div className="transform hover:scale-105 transition-transform">
                    <QuizDialog />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <EmailCaptureModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Start Your Financial Journey"
        description="Enter your email to get started with FinBoost and begin earning rewards."
        buttonText="Get Started"
      />
    </section>
  );
}