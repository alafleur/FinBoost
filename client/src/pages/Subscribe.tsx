import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to FinBoost Premium! You now have access to all features.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Subscription</CardTitle>
        <CardDescription>
          Enter your payment details to start your $20/month FinBoost membership
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || !elements || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Subscribe for $20/month`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user already has a subscription
    const checkSubscription = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data.subscription.status);
          
          if (data.subscription.status === 'active') {
            setLoading(false);
            return; // Don't create new subscription if already active
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }

      // Create new subscription if none exists or not active
      try {
        const response = await apiRequest("POST", "/api/create-subscription");
        if (response.ok) {
          const data = await response.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else if (data.message?.includes('already has active subscription')) {
            setSubscriptionStatus('active');
          }
        } else {
          const errorData = await response.json();
          toast({
            title: "Subscription Error",
            description: errorData.message || "Failed to create subscription",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error creating subscription:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to payment system",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Loading subscription details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (subscriptionStatus === 'active') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <CardTitle>Already Subscribed!</CardTitle>
            <CardDescription>
              You already have an active FinBoost Premium membership
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Subscription Error</CardTitle>
            <CardDescription>
              Unable to initialize payment. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Join FinBoost Premium</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get access to all premium features, earn points, and win monthly cash rewards!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>What You Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Complete Education Library</h4>
                <p className="text-sm text-muted-foreground">Access all 27 financial education modules and quizzes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Monthly Reward Eligibility</h4>
                <p className="text-sm text-muted-foreground">Earn points and compete for cash rewards distributed monthly</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Tier-Based Rewards</h4>
                <p className="text-sm text-muted-foreground">Higher tiers = bigger reward pools and better winning odds</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Progress Tracking</h4>
                <p className="text-sm text-muted-foreground">Track your learning journey and streak bonuses</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg mt-6">
              <h4 className="font-medium text-green-800 mb-2">How Rewards Work</h4>
              <p className="text-sm text-green-700">
                $11 from every $20 membership goes into monthly reward pools. 
                Winners are selected based on points earned through learning activities.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SubscribeForm />
        </Elements>
      </div>
    </div>
  );
}