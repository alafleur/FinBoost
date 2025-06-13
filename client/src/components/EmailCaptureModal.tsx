import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function EmailCaptureModal({ 
  isOpen, 
  onClose, 
  title = "Start Your Financial Journey",
  description = "Enter your email to get started with FinBoost and begin earning rewards.",
  buttonText = "Get Started"
}: EmailCaptureModalProps) {
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
      // Save email to waitlist
      await apiRequest("POST", "/api/subscribe", { email });
      
      // Track conversion
      trackEvent("email_capture", "landing_page", buttonText);
      
      toast({
        title: "Success!",
        description: "Redirecting you to complete your signup...",
      });
      
      // Redirect to signup page with email pre-filled
      setTimeout(() => {
        navigate(`/auth?mode=signup&email=${encodeURIComponent(email)}`);
        onClose();
      }, 1000);
      
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">{title}</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : buttonText}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to receive updates about FinBoost and can unsubscribe at any time.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}