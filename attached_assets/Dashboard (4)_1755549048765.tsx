// client/src/pages/Dashboard.tsx
// Overview tab — updated to consume /api/rewards/history with the new contract:
// summary: { paidTotalCents, pendingTotalCents, rewardsReceived }
//
// Drop-in replacement for your existing Dashboard page's "Rewards Summary" section.
// If your project splits this into a separate RewardsSummary component, you can
// move the <RewardsSummary /> subcomponent out into its own file.

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Gift, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type RewardsResponse = {
  summary: {
    paidTotalCents: number;
    pendingTotalCents: number;
    rewardsReceived: number;
  };
  items: Array<{
    cycleId: number;
    cycleLabel: string;
    awardedAt: string | null;
    amountCents: number;
    status: "pending" | "earned" | "paid" | "failed";
    paidAt: string | null;
  }>;
};

function dollars(cents: number | undefined | null) {
  const v = typeof cents === "number" ? cents : 0;
  return `$${(v / 100).toFixed(2)}`;
}

function RewardsSummary() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<RewardsResponse["summary"] | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ts = `?t=${Date.now()}`;
        let res = await apiRequest("GET", `/api/rewards/history${ts}`);
        if (!res.ok) {
          res = await apiRequest("GET", `/api/cycles/rewards/history${ts}`);
        }
        if (res.ok) {
          const data: RewardsResponse = await res.json();
          setSummary(data.summary);
        } else {
          setSummary({ paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 });
        }
      } catch (e) {
        console.error("Rewards summary fetch failed:", e);
        setSummary({ paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const paid = summary?.paidTotalCents ?? 0;
  const pending = summary?.pendingTotalCents ?? 0;
  const count = summary?.rewardsReceived ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards Overview</CardTitle>
        <CardDescription>Celebrating your financial learning achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="rounded-md bg-gray-100 p-2">
              <DollarSign className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-2xl font-semibold">{dollars(paid)}</p>
              <p className="text-xs text-gray-500">Paid rewards</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="rounded-md bg-yellow-100 p-2">
              <Clock className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending / Queued</p>
              <p className="text-2xl font-semibold text-yellow-700">{dollars(pending)}</p>
              <p className="text-xs text-gray-500">Awaiting processing</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="rounded-md bg-gray-100 p-2">
              <Gift className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rewards Received</p>
              <p className="text-2xl font-semibold">{count}</p>
              <p className="text-xs text-gray-500">Count of paid</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
            <a href="/rewards">
              View full rewards
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  // If your existing Dashboard has more sections, render them here as well.
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <RewardsSummary />
        {/* ...other dashboard cards/sections can follow here... */}
      </div>
    </div>
  );
}
