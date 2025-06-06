import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, TrendingUp, Users, CheckCircle, ArrowLeft } from 'lucide-react';

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
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?upgraded=true`,
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
        title: "Welcome to Premium!",
        description: "Your membership is now active. Redirecting to dashboard...",
      });
      setTimeout(() => setLocation('/dashboard'), 2000);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Processing..." : "Start Premium Membership - $20/month"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Create subscription as soon as the page loads
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login');
      return;
    }

    fetch("/api/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error(data.error?.message || 'Failed to create subscription');
        }
      })
      .catch((error) => {
        console.error('Subscription creation error:', error);
        setLocation('/dashboard');
      });
  }, [setLocation]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" aria-label="Loading"/>
          <p className="mt-4 text-gray-600">Setting up your premium membership...</p>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="mb-6">
          <Button 
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-2 border-gradient-to-r from-yellow-400 to-orange-500 bg-white shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-yellow-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              Upgrade to Premium
            </CardTitle>
            <Badge variant="secondary" className="mx-auto bg-yellow-100 text-yellow-800 border-yellow-300">
              Start Earning Real Rewards
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Premium Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Access All Content</p>
                    <p className="text-sm text-gray-600">Unlock all premium lessons and resources</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Earn Real Points</p>
                    <p className="text-sm text-gray-600">Convert theoretical points to claimable rewards</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Monthly Rewards Pool</p>
                    <p className="text-sm text-gray-600">Compete for cash rewards distributed monthly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Priority Support</p>
                    <p className="text-sm text-gray-600">Get faster help when you need it</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-gray-800 mb-2">$20</div>
              <p className="text-gray-600">per month • Cancel anytime</p>
            </div>

            {/* Payment Form */}
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>

            <p className="text-xs text-gray-500 text-center">
              By subscribing, you agree to our terms of service. Your subscription will automatically renew monthly unless canceled.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}