// client/src/components/RewardsSummaryCards.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Gift, ExternalLink } from "lucide-react";
import { RewardsSummary, dollars } from "@/hooks/useRewardsData";

type Props = {
  summary: RewardsSummary;
  ctaHref?: string;      // optional "view full rewards" link
  compactHeader?: boolean;
};

export default function RewardsSummaryCards({ summary, ctaHref, compactHeader }: Props) {
  const paid = summary?.paidTotalCents ?? 0;
  const pending = summary?.pendingTotalCents ?? 0;
  const count = summary?.rewardsReceived ?? 0;

  return (
    <Card>
      <CardHeader>
        {compactHeader ? (
          <>
            <CardTitle>Rewards Overview</CardTitle>
            <CardDescription>Celebrating your financial learning achievements</CardDescription>
          </>
        ) : (
          <>
            <CardTitle>Rewards Overview</CardTitle>
            <CardDescription>Celebrating your financial learning achievements</CardDescription>
          </>
        )}
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

        {ctaHref && (
          <div className="mt-6">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href={ctaHref}>
                View full rewards
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
