// client/src/components/PayoutSetupCard.tsx
// Minimal payout setup card retained from the old /payouts page.
// Uses the existing endpoint /api/stripe/connect-onboarding (rename if needed).

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PayoutSetupCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // TODO: wire to real status if available
  const { toast } = useToast();

  const handleConnectOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/paypal/connect-onboarding");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.onboardingUrl) {
          window.location.href = data.onboardingUrl;
        } else {
          throw new Error(data.message || "Failed to create onboarding link");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payout service unavailable");
      }
    } catch (error: any) {
      console.error("Connect onboarding error:", error);
      toast({
        title: "Setup Error",
        description: error.message || "Unable to start payout setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-6 w-6 mr-2" />
          Setup Payment Details
        </CardTitle>
        <CardDescription>Configure your payout account to receive rewards.</CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete account verification to receive payouts.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleConnectOnboarding}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Setting up..." : "Set Up Payout Account"}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium text-green-800">Account Connected</p>
              <p className="text-sm text-gray-600">
                Your payout account is set up and ready to receive rewards.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}