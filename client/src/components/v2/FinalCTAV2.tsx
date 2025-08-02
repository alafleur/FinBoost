import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { CheckCircle, Shield, Clock } from "lucide-react";

interface FinalCTAV2Props {
  onSubscribeSuccess: () => void;
}

export default function FinalCTAV2({ onSubscribeSuccess }: FinalCTAV2Props) {
  const [, navigate] = useLocation();

  const handleJoinEarlyAccess = () => {
    trackEvent("cta_click", "join_early_access_final");
    navigate("/auth?mode=signup");
  };

  return (
    <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-700 to-blue-900 text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">
          Ready to Turn Financial Stress into Financial Progress?
        </h2>
        
        <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
          Join FinBoost Early Access today and take control of your financial future with real rewards for every step you take.
        </p>
        
        {/* Key points */}
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
            <Clock className="h-6 w-6 text-blue-300 mx-auto mb-2" />
            <p className="text-sm text-blue-100">Community-funded model - transparent and fair</p>
          </div>
        </div>
        
        <div className="mb-8">
          <Button 
            onClick={handleJoinEarlyAccess}
            size="lg"
            className="w-full sm:w-auto h-[56px] bg-white text-blue-700 hover:bg-gray-100 font-semibold px-8 rounded-lg shadow-xl transition duration-300 text-lg flex items-center justify-center hover:shadow-2xl transform hover:-translate-y-0.5"
          >
            Claim Early Access & Start Earning
          </Button>
        </div>
        
        {/* Final trust elements */}
        <div className="text-center text-blue-200 text-sm space-y-1">
          <p>Prize pools guaranteed during Early Access</p>
          <p>No purchase necessary. See official rules.</p>
          <p>Early Access capped at a few hundred members</p>
        </div>
      </div>
    </section>
  );
}