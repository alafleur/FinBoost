import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { useLocation } from "wouter";
import { BarChart2, Zap, Award } from "lucide-react";

interface FinalCTAProps {
  onSubscribeSuccess: () => void;
}

export default function FinalCTA({ onSubscribeSuccess }: FinalCTAProps) {
  const [, navigate] = useLocation();

  const handleStartLearning = () => {
    trackEvent("cta_click", "start_learning_final");
    navigate("/auth?mode=signup");
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
          Ready to Turn Learning Into Earning?
        </h2>
        <p className="text-xl text-blue-100 mb-8 leading-relaxed">
          Join thousands of members who are building wealth through knowledge and earning real rewards.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleStartLearning}
            size="lg"
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-2xl transition duration-300 transform hover:scale-105 border border-blue-400"
          >
            Join the FinBoost Movement
          </Button>
          
          <div className="flex items-center justify-center space-x-8 text-sm text-blue-200">
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              Instant access
            </div>
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1" />
              Free lessons & assessment
            </div>
          </div>
        </div>
        
        <p className="text-sm text-blue-200 mt-4">
          100% free to start • No credit card required • Begin learning immediately
        </p>
      </div>
    </section>
  );
}