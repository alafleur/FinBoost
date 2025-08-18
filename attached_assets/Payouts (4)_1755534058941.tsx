// client/src/pages/Payouts.tsx
// Add cache-busting to fetch to avoid 304s on stale empty responses

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

type RewardStatus = "pending" | "earned" | "paid" | "failed";

interface RewardItem {
  cycleId: number;
  cycleLabel: string | null;
  awardedAt: string | null;
  amountCents: number;
  status: RewardStatus;
  paidAt: string | null;
}

interface RewardsResponse {
  summary: { totalEarnedCents: number; rewardsReceived: number };
  items: RewardItem[];
}

export default function Payouts() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<RewardsResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const cacheBust = `?t=${Date.now()}`;
      const response = await apiRequest("GET", `/api/rewards/history${cacheBust}`);
      if (response.ok) {
        const data: RewardsResponse = await response.json();
        setHistory(data);
      } else {
        // try alias if primary path isn't wired yet
        const alt = await apiRequest("GET", `/api/cycles/rewards/history${cacheBust}`);
        if (alt.ok) {
          const data: RewardsResponse = await alt.json();
          setHistory(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch rewards history:", error);
    }
  };

  const handleConnectOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stripe/connect-onboarding");
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

  const getStatusIcon = (status: RewardStatus) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'earned':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: RewardStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'earned':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const dollars = (cents: number) => `$${(cents/100).toFixed(2)}`;

  const totalEarned = history?.summary.totalEarnedCents ?? 0;
  const rewardsReceived = history?.summary.rewardsReceived ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewards & Payouts</h1>
          <p className="text-gray-600">
            Setup your payout method and track rewards—pending, queued, and paid.
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
              Connect your payout account to receive payments
            </CardDescription>
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

        {/* Earnings Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dollars(totalEarned)}</div>
              <p className="text-xs text-gray-600">All-time paid rewards</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending / Queued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dollars((history?.items || []).filter(i => i.status !== "paid" && i.status !== "failed").reduce((s, i) => s + i.amountCents, 0))}
              </div>
              <p className="text-xs text-gray-600">Awaiting payout processing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rewards Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewardsReceived}</div>
              <p className="text-xs text-gray-600">Count of paid rewards</p>
            </CardContent>
          </Card>
        </div>

        {/* Reward History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Reward History
            </CardTitle>
            <CardDescription>
              Winners are visible immediately as Pending or Queued, and flip to Paid when processed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!history || history.items.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No rewards yet
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Participate this cycle to become eligible for rewards.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.items.map((item) => (
                  <div 
                    key={item.cycleId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <p className="font-medium">
                          {item.cycleLabel || `Cycle ${item.cycleId}`} — {dollars(item.amountCents)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Awarded {item.awardedAt ? new Date(item.awardedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      {item.paidAt && (
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(item.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
