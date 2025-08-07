import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessModal from "@/components/SuccessModal";
import { trackPageView, trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Shield, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target, 
  Trophy, 
  CheckCircle, 
  DollarSign,
  BarChart3,
  Calendar,
  Award
} from "lucide-react";

export default function HomeV2Clean() {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [, navigate] = useLocation();
  
  useEffect(() => {
    trackPageView("home_v2_clean");
  }, []);

  const handleCTAClick = () => {
    trackEvent("cta_click", "early_access_v2");
    navigate("/auth?mode=signup");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-24 bg-gradient-to-b from-white via-blue-50/30 to-blue-100/50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight text-gray-800">
                  Your Financial Comeback Starts Here <span className="gradient-text">– And We'll Reward You For It</span>
                </h1>
                <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-lg">
                  Learn powerful money skills. Take real financial actions. Earn tickets and win real cash rewards every two weeks. Join our limited Early Access where every prize pool is guaranteed.
                </p>
                <div className="max-w-lg space-y-4">
                  <Button 
                    onClick={handleCTAClick}
                    size="lg"
                    className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 rounded-lg shadow-xl transition duration-300 border border-blue-700 text-lg flex items-center justify-center hover:shadow-2xl transform hover:-translate-y-0.5"
                  >
                    Claim Early Access & Start Earning
                  </Button>
                  
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-green-600" />
                      Prize pools guaranteed
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-blue-600" />
                      Over 50% win rate
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-purple-600" />
                      Limited spots
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-3">Join 2,400+ learners already improving their financial health</p>
              </div>
              <div className="relative">
                <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                      <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-4 text-center">Early Access Benefits</h3>
                  <ul className="space-y-4 mt-6">
                    <li className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="ml-3 text-gray-700">Prize pools guaranteed by FinBoost</p>
                    </li>
                    <li className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="ml-3 text-gray-700">Over half of members win each cycle</p>
                    </li>
                    <li className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      <p className="ml-3 text-gray-700">Better odds with smaller community</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-20 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
                How FinBoost Works: Learn, Act, Earn
              </h2>
              <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
                A simple 4-step process to improve your finances while earning real rewards
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">1. Learn</h3>
                <p className="text-gray-600 text-sm">Complete interactive lessons on budgeting, saving, investing, and debt management</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">2. Take Action</h3>
                <p className="text-gray-600 text-sm">Apply what you learned with real financial actions and upload proof to earn tickets</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">3. Earn Tickets</h3>
                <p className="text-gray-600 text-sm">Build your tier status with tickets from lessons, quizzes, and verified financial actions</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">4. Win Rewards</h3>
                <p className="text-gray-600 text-sm">Get selected for cash rewards every two weeks based on your engagement and progress</p>
              </div>
            </div>
          </div>
        </section>

        {/* Transparent Economics */}
        <section className="py-16 md:py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
                Transparent, Community-Funded Economics
              </h2>
              <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
                No hidden fees. No surprise costs. Just a simple model where member subscriptions fund the prize pools.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">$20/Month Subscription</h3>
                <p className="text-gray-600 text-sm">Simple, predictable pricing for all members</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">55% Goes to Rewards</h3>
                <p className="text-gray-600 text-sm">Most of your subscription funds the prize pool</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Over 50% Win</h3>
                <p className="text-gray-600 text-sm">Multiple tiers ensure frequent wins</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
              <h3 className="font-semibold text-xl mb-6 text-gray-800 text-center">Early Access Advantage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Guaranteed Prize Pools</h4>
                  <p className="text-sm text-green-700">FinBoost guarantees all prize pools during Early Access, even with smaller member counts</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Better Odds</h4>
                  <p className="text-sm text-blue-700">Smaller community means better chances of winning before we scale up</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* High Win Rates */}
        <section className="py-16 md:py-20 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
                Over Half of Members Receive Rewards Each Cycle
              </h2>
              <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
                Multiple prize tiers and point-weighted selection ensure frequent wins. The most engaged members win consistently because they earn it.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Point-Weighted Selection</h3>
                <p className="text-gray-600 text-sm">Better engagement = better odds of winning</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                <Trophy className="h-8 w-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Multiple Prize Tiers</h3>
                <p className="text-gray-600 text-sm">Not winner-takes-all, everyone has chances</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Bi-Weekly Cycles</h3>
                <p className="text-gray-600 text-sm">26 opportunities to win throughout the year</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">
              Ready to Turn Financial Stress into Financial Progress?
            </h2>
            
            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Join FinBoost Early Access today and take control of your financial future with real rewards for every step you take.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <CheckCircle className="h-6 w-6 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Over half of members receive rewards each cycle</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <Shield className="h-6 w-6 text-yellow-300 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Prize pools guaranteed for Early Access participants</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <Award className="h-6 w-6 text-purple-300 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Community-funded model - transparent and fair</p>
              </div>
            </div>
            
            <div className="mb-8">
              <Button 
                onClick={handleCTAClick}
                size="lg"
                className="w-full sm:w-auto h-[56px] bg-white text-blue-700 hover:bg-gray-100 font-semibold px-8 rounded-lg shadow-xl transition duration-300 text-lg flex items-center justify-center hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                Claim Early Access & Start Earning
              </Button>
            </div>
            
            <div className="text-center text-blue-200 text-sm space-y-1">
              <p>Prize pools guaranteed during Early Access</p>
              <p>No purchase necessary. See official rules.</p>
              <p>Early Access capped at a few hundred members</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onClose={() => setIsSuccessModalOpen(false)} 
      />
    </div>
  );
}