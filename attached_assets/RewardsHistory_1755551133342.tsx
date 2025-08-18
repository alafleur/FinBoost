// client/src/components/RewardsHistory.tsx
import { useRewardsData, dollars } from "@/hooks/useRewardsData";
import RewardsSummaryCards from "@/components/RewardsSummaryCards";
import PayoutSetupCard from "@/components/PayoutSetupCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";

function StatusBadge({ status }: { status: "pending" | "earned" | "paid" | "failed" }) {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-100 text-green-800">paid</Badge>;
    case "earned":
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">queued</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800">failed</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
}

export default function RewardsHistory() {
  const { data, isLoading } = useRewardsData();
  const summary = data?.summary ?? { paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 };
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rewards History</CardTitle>
          <CardDescription>Your complete reward disbursement timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <RewardsSummaryCards summary={summary} />
      <PayoutSetupCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reward History
          </CardTitle>
          <CardDescription>Your complete reward disbursement timeline</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No rewards yet</div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.cycleId}-${item.awardedAt}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.status === "paid" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : item.status === "failed" ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {(item.cycleLabel || `Cycle ${item.cycleId}`)} — {dollars(item.amountCents)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Awarded {item.awardedAt ? new Date(item.awardedAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.status} />
                    {item.paidAt && (
                      <p className="text-sm text-gray-600 mt-1">{new Date(item.paidAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
