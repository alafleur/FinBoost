// client/src/hooks/useRewardsData.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type RewardStatus = "pending" | "earned" | "paid" | "failed";

export type RewardsHistoryItem = {
  cycleId: number;
  cycleLabel: string;
  awardedAt: string | null;
  amountCents: number;
  status: RewardStatus;
  paidAt: string | null;
};

export type RewardsSummary = {
  paidTotalCents: number;
  pendingTotalCents: number;
  rewardsReceived: number;
};

export type RewardsResponse = {
  summary: RewardsSummary;
  items: RewardsHistoryItem[];
};

async function fetchRewards(): Promise<RewardsResponse> {
  const ts = `?t=${Date.now()}`;
  let res = await apiRequest("GET", `/api/rewards/history${ts}`);
  if (!res.ok) {
    res = await apiRequest("GET", `/api/cycles/rewards/history${ts}`);
  }
  if (!res.ok) {
    // Always return a valid shape so UIs don't blow up
    return { summary: { paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 }, items: [] };
  }
  return res.json();
}

export function useRewardsData() {
  return useQuery({
    queryKey: ["rewards-history"],
    queryFn: fetchRewards,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

// tiny shared utility
export function dollars(cents: number | undefined | null) {
  const v = typeof cents === "number" ? cents : 0;
  return `$${(v / 100).toFixed(2)}`;
}