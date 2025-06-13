import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { ArrowRight, Mail } from "lucide-react";

interface EmailCaptureSectionProps {
  onSubscribeSuccess?: () => void;
}

export default function EmailCaptureSection({ onSubscribeSuccess }: EmailCaptureSectionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Save email to waitlist/subscribers
      await apiRequest("POST", "/api/subscribe", { email });
      
      // Track conversion
      trackEvent("email_capture", "landing_page", "prominent_section");
      
      toast({
        title: "Success!",
        description: "You're on the waitlist! Redirecting you to complete your account...",
      });
      
      // Call success callback if provided
      if (onSubscribeSuccess) {
        onSubscribeSuccess();
      }
      
      // Redirect to signup page with email pre-filled
      setTimeout(() => {
        navigate(`/auth?mode=signup&email=${encodeURIComponent(email)}`);
      }, 1500);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4 text-gray-800">
            Ready to Start Your Financial Journey?
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Enter your email below to join the waitlist and be among the first to start earning rewards while learning about personal finance.
          </p>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 text-base"
                required
              />
              
              <Button 
                type="submit" 
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Joining..." : "Join Waitlist"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </form>
          
          <p className="text-sm text-gray-500 mt-4">
            100% free to start • No credit card required • Join 2,400+ members
          </p>
        </div>
      </div>
    </section>
  );
}