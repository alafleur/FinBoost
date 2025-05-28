import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, DollarSign, Users, TrendingUp, Star, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Subscribe() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CAD'>('USD');
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stripe/create-subscription", {
        currency: selectedCurrency
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error(data.message || "Failed to create checkout session");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment service unavailable");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Unable to process subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const priceDisplay = selectedCurrency === 'USD' ? '$20' : '$27 CAD';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <DollarSign className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Join FinBoost</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your financial knowledge into real rewards. Learn, earn, and grow with our community.
          </p>
        </div>

        {/* Currency Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <Button
              variant={selectedCurrency === 'USD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCurrency('USD')}
              className="mr-1"
            >
              🇺🇸 USD
            </Button>
            <Button
              variant={selectedCurrency === 'CAD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCurrency('CAD')}
            >
              🇨🇦 CAD
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pricing Card */}
          <Card className="relative overflow-hidden border-2 border-blue-200 shadow-xl">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-blue-500 text-white px-4 py-2 rounded-bl-lg">
              <span className="text-sm font-semibold">Most Popular</span>
            </div>
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Monthly Membership
              </CardTitle>
              <CardDescription className="text-lg">
                Learn financial skills and earn real rewards
              </CardDescription>
              
              <div className="mt-6">
                <div className="text-5xl font-bold text-blue-600">
                  {priceDisplay}
                </div>
                <div className="text-gray-500 mt-2">per month</div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Access to all financial education content</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Earn points for completing lessons and activities</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Monthly cash rewards from the community pool</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Leaderboards and tier-based benefits</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Community referral bonuses</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? "Processing..." : `Subscribe for ${priceDisplay}/month`}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Secure payment powered by Stripe. Cancel anytime.
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
                  How You Earn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">Complete Lessons</h4>
                  <p className="text-sm text-gray-600">
                    Earn 10-50 points for each financial education module
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold">Take Action</h4>
                  <p className="text-sm text-gray-600">
                    Upload proof of real financial improvements for bonus points
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold">Refer Friends</h4>
                  <p className="text-sm text-gray-600">
                    Get 100+ points for each successful referral
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-6 w-6 text-blue-500 mr-2" />
                  Community Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">55% goes to reward pool</span>
                    <Badge variant="secondary">$11/month</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">45% for education & platform</span>
                    <Badge variant="outline">$9/month</Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600">
                      Higher tiers get larger shares of monthly rewards based on points earned
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust & Security */}
        <div className="mt-12 text-center">
          <div className="flex justify-center items-center space-x-6 text-gray-500">
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              <span className="text-sm">Available in US & Canada</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              <span className="text-sm">Secure payments by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}