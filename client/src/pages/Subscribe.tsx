import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PayPalButton from "@/components/PayPalButton";
import { CheckCircle, DollarSign, Trophy, Users } from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const StripeSubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
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
        description: "Welcome to FinBoost Premium!",
      });
    }

    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Subscribe with Stripe"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [activeTab, setActiveTab] = useState("stripe");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Create Stripe subscription intent when component loads
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth?mode=signup');
      return;
    }

    apiRequest("POST", "/api/create-subscription", {}, {
      'Authorization': `Bearer ${token}`
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.error) {
          toast({
            title: "Error",
            description: data.error.message,
            variant: "destructive"
          });
        }
      })
      .catch((error) => {
        console.error('Error creating subscription:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
      });
  }, []);

  const benefits = [
    {
      icon: <Trophy className="h-5 w-5 text-blue-600" />,
      title: "Access to Monthly Reward Pools",
      description: "Compete for real cash prizes every month"
    },
    {
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      title: "Higher Earning Potential",
      description: "Unlock premium lessons with bigger point rewards"
    },
    {
      icon: <Users className="h-5 w-5 text-purple-600" />,
      title: "Exclusive Community Access",
      description: "Join premium-only discussions and events"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-orange-600" />,
      title: "Priority Support",
      description: "Get faster responses to your questions"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade to FinBoost Premium
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of members earning real cash while learning about money
          </p>
          <div className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold">
            Only $20/month
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Premium Benefits</CardTitle>
              <CardDescription>
                What you get with your FinBoost Premium membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose Your Payment Method</CardTitle>
              <CardDescription>
                Select how you'd like to pay for your premium membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stripe">Credit Card</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="mt-6">
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripeSubscribeForm />
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="paypal" className="mt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Pay securely with PayPal or your credit card through PayPal
                    </p>
                    <PayPalButton 
                      amount="20.00"
                      currency="USD"
                      intent="CAPTURE"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Cancel anytime. No long-term commitments. Your subscription helps fund the monthly reward pools.
          </p>
        </div>
      </div>
    </div>
  );
}