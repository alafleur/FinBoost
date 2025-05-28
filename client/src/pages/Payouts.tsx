import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  DollarSign, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Payout {
  id: number;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  processedAt: string | null;
  createdAt: string;
}

export default function Payouts() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await apiRequest("GET", "/api/stripe/payouts");
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    }
  };

  const handleConnectOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stripe/connect-onboarding");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.onboardingUrl) {
          // Redirect to Stripe Connect onboarding
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'usd' ? '$' : '$';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward Payouts</h1>
          <p className="text-gray-600">
            Set up your payout method to receive monthly rewards and bonuses
          </p>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-6 w-6 mr-2" />
              Payout Account Setup
            </CardTitle>
            <CardDescription>
              Connect your bank account or debit card to receive reward payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to complete account verification to receive payouts. This is a secure 
                    process managed by Stripe to comply with financial regulations.
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
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>What you'll need:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Government-issued ID</li>
                    <li>Bank account details or debit card</li>
                    <li>Social Security Number (US) or Social Insurance Number (Canada)</li>
                    <li>Personal information for verification</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-800">Account Connected</p>
                  <p className="text-sm text-gray-600">
                    Your payout account is set up and ready to receive rewards
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-gray-600">All-time earnings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-gray-600">Current month rewards</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-gray-600">Processing payouts</p>
            </CardContent>
          </Card>
        </div>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Payout History
            </CardTitle>
            <CardDescription>
              Track your reward payments and earnings over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No payouts yet
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Start earning points by completing lessons and activities. 
                  Rewards are distributed monthly based on your tier and performance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div 
                    key={payout.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(payout.status)}
                      <div>
                        <p className="font-medium">
                          {formatAmount(payout.amount, payout.currency)}
                        </p>
                        <p className="text-sm text-gray-600">{payout.reason}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How Rewards Work */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Reward Payouts Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Monthly Distributions</h4>
                <p className="text-sm text-gray-600">
                  Rewards are calculated and distributed at the end of each month based 
                  on your tier and points earned.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Tier-Based Rewards</h4>
                <p className="text-sm text-gray-600">
                  Higher tiers (Silver, Gold) receive larger shares of the monthly 
                  reward pool based on community performance.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Processing Time</h4>
                <p className="text-sm text-gray-600">
                  Payouts typically arrive in your account within 2-5 business days 
                  after being processed.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Minimum Payout</h4>
                <p className="text-sm text-gray-600">
                  A minimum balance of $10 is required before payouts can be processed 
                  to your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}