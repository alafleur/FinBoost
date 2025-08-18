// client/src/components/RewardsSummary.tsx
import { useRewardsData } from "@/hooks/useRewardsData";
import RewardsSummaryCards from "@/components/RewardsSummaryCards";

export default function RewardsSummary() {
  const { data, isLoading } = useRewardsData();
  const summary = data?.summary ?? { paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 };

  if (isLoading) {
    // Lightweight skeleton that keeps layout stable
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[0,1,2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-28 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <RewardsSummaryCards summary={summary} ctaHref="/dashboard?tab=rewards" compactHeader />
    </div>
  );
}