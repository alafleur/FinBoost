import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, TrendingUp, Users, CheckCircle, ArrowLeft } from 'lucide-react';

const SubscribeForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get user token
      const token = localStorage.getItem('token');
      if (!token) {
        setLocation('/auth');
        return;
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user subscription status
      const response = await fetch('/api/upgrade-to-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }

      toast({
        title: "Welcome to Premium!",
        description: "Your membership is now active. Redirecting to dashboard...",
      });
      
      setTimeout(() => setLocation('/dashboard'), 2000);
    } catch (error) {
      console.error('Subscription upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Demo Payment Form */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border rounded-md p-3 bg-white">
              <input 
                type="text" 
                placeholder="1234 1234 1234 1234" 
                className="w-full border-none outline-none text-gray-700"
                defaultValue="4242 4242 4242 4242"
                readOnly
              />
              <div className="flex gap-4 mt-2 pt-2 border-t">
                <input 
                  type="text" 
                  placeholder="MM / YY" 
                  className="flex-1 border-none outline-none text-gray-700"
                  defaultValue="12 / 28"
                  readOnly
                />
                <input 
                  type="text" 
                  placeholder="CVC" 
                  className="w-16 border-none outline-none text-gray-700"
                  defaultValue="123"
                  readOnly
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name
            </label>
            <input 
              type="text" 
              className="w-full border rounded-md p-3 bg-gray-50"
              placeholder="Your Name"
              defaultValue="Demo User"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Demo Mode:</strong> This is a demonstration of the subscription flow. 
          In production, this would process real payments through Stripe.
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Processing Payment..." : "Start Premium Membership - $20/month"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/dashboard')}
              className="mb-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl font-bold text-gray-900">FinBoost Premium</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock your full financial potential with premium features, exclusive content, and real reward earnings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Benefits Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Premium Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Access All 27 Learning Modules</p>
                      <p className="text-sm text-gray-600">Complete financial education from basics to advanced strategies</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Earn Real Points & Rewards</p>
                      <p className="text-sm text-gray-600">Every action counts toward monthly cash distributions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Monthly Reward Pool</p>
                      <p className="text-sm text-gray-600">Share in 55% of all premium subscriptions collected</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Priority Support</p>
                      <p className="text-sm text-gray-600">Get help when you need it most</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Advanced Analytics</p>
                      <p className="text-sm text-gray-600">Track your learning progress and earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Pool Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Current Month Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">$11.00</div>
                    <p className="text-sm text-gray-600 mb-4">Available in reward pool</p>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>1 Premium Member</span>
                      </div>
                      <Badge variant="outline">55% Pool Share</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Choose Premium</CardTitle>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">$20</div>
                  <p className="text-gray-600">per month • Cancel anytime</p>
                </div>
              </CardHeader>
              <CardContent>
                <SubscribeForm />
                <p className="text-xs text-gray-500 text-center mt-4">
                  By subscribing, you agree to our terms of service. Your subscription will automatically renew monthly unless canceled.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}