import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { useLocation } from "wouter";
import MembershipGrowthChart from "./MembershipGrowthChart";
import { BarChart2, Users, TrendingUp } from "lucide-react";

interface GrowthCTAProps {
  onSubscribeSuccess: () => void;
}

export default function GrowthCTA({ onSubscribeSuccess }: GrowthCTAProps) {
  const [, navigate] = useLocation();
  const [memberCount] = useState("2,400+");

  const handleStartLearning = () => {
    trackEvent("cta_click", "start_learning_growth");
    navigate("/auth?mode=signup");
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h3 className="font-heading font-bold text-2xl md:text-3xl mb-4 text-gray-800">
            Join the Growing Community
          </h3>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            The earlier you join, the more you benefit from our collective growth. 
            Be part of building something bigger than yourself.
          </p>
        </div>
        
        {/* Growth Chart */}
        <MembershipGrowthChart />
        
        {/* CTA Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center mt-8">
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
            Ready to join? Start learning and earning with our financial community platform.
          </p>
          
          <div className="max-w-md mx-auto">
            <Button 
              onClick={handleStartLearning}
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 rounded-lg shadow-lg transition duration-300"
            >
              Start Learning Free
            </Button>
            
            <div className="flex items-center justify-center space-x-8 mt-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-blue-600" />
                Free to start
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                Instant access
              </div>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm mt-4">
            Join {memberCount} learners already improving their financial health
          </p>
        </div>
      </div>
    </section>
  );
}