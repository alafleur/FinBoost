// client/src/components/RewardsSummary.tsx
import { useRewardsData } from "@/hooks/useRewardsData";
import RewardsSummaryCards from "@/components/RewardsSummaryCards";

export default function RewardsSummary() {
  const { data } = useRewardsData();
  const summary = data?.summary ?? { paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 };
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <RewardsSummaryCards summary={summary} ctaHref="/dashboard?tab=rewards" compactHeader />
    </div>
  );
}
