import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { Award, Shield, Users } from "lucide-react";

interface HeroV2Props {
  onSubscribeSuccess: () => void;
}

export default function HeroV2({ onSubscribeSuccess }: HeroV2Props) {
  const [, navigate] = useLocation();

  const handleClaimEarlyAccess = () => {
    trackEvent("cta_click", "claim_early_access_hero");
    navigate("/auth?mode=signup");
  };

  return (
    <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-24 bg-gradient-to-b from-white via-blue-50/30 to-blue-100/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight text-gray-800">
            Your Financial Comeback Starts Here. 
            <span className="gradient-text"> And We'll Reward You For It.</span>
          </h1>
          
          <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            Learn powerful money skills. Take real financial actions. Earn points and win real cash rewards every two weeks. Join our limited Early Access where every prize pool is guaranteed.
          </p>
          
          <div className="mb-8">
            <Button 
              onClick={handleClaimEarlyAccess}
              size="lg"
              className="w-full sm:w-auto h-[56px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 rounded-lg shadow-xl transition duration-300 border border-blue-700 text-lg flex items-center justify-center hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Claim Early Access & Start Earning
            </Button>
          </div>
          
          {/* Trust Elements */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-600 mb-12">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Prize pools guaranteed during Early Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              <span>No purchase necessary (see official rules)</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span>Limited to our first few hundred members</span>
            </div>
          </div>
          
          {/* Hero Visual/Screenshot Placeholder */}
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-600 font-medium">App Screenshot: Dashboard Overview</p>
                <p className="text-sm text-gray-500 mt-1">Points, Tiers, and Reward Progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}