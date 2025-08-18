// server/storage.ts
// Storage helpers for rewards history (Drizzle + Node).
// Merge these functions into your existing storage layer if you already have one.

import { db } from "./db"; // adjust to your project's db export
import { and, desc, eq, sql } from "drizzle-orm";
import { users, cycleSettings, cycleWinnerSelections, payoutBatchItems } from "../shared/schema";

export type RewardsHistoryItem = {
  cycleId: number;
  cycleLabel: string | null;
  awardedAt: string | null;
  amountCents: number;
  status: "pending" | "earned" | "paid" | "failed";
  paidAt: string | null;
};

export type RewardsHistoryResponse = {
  summary: { totalEarnedCents: number; rewardsReceived: number };
  items: RewardsHistoryItem[];
};

function normalizePayoutStatus(raw?: string): "pending" | "earned" | "paid" | "failed" {
  switch ((raw || "").toLowerCase()) {
    case "success":
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "earned":
    case "queued":
      return "earned";
    default:
      return "pending";
  }
}

export async function getRewardsHistoryForUser(userId: number): Promise<RewardsHistoryResponse> {
  // 1) Winners for this user (sealed only)
  const winners = await db.select({
      cycleId: cycleWinnerSelections.cycleSettingId,
      awardedAt: cycleWinnerSelections.sealedAt,
      rewardAmount: cycleWinnerSelections.payoutFinal,
      rewardAmountFallback: cycleWinnerSelections.rewardAmount,
      payoutStatus: cycleWinnerSelections.payoutStatus,
      cycleName: sql<string>`COALESCE(${cycleSettings.cycleName}, 'Cycle')`,
    })
    .from(cycleWinnerSelections)
    .leftJoin(cycleSettings, eq(cycleWinnerSelections.cycleSettingId, cycleSettings.id))
    .where(and(
      eq(cycleWinnerSelections.userId, userId),
      eq(cycleWinnerSelections.isSealed, true)
    ))
    .orderBy(desc(cycleWinnerSelections.sealedAt));

  if (!winners || winners.length === 0) {
    return { summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] };
  }

  // 2) Payout batch items for these cycles (if any)
  const cycleIds = [...new Set(winners.map(w => Number(w.cycleId)))];
  const payoutItems = await db.select({
      cycleSettingId: payoutBatchItems.cycleSettingId,
      amountCents: payoutBatchItems.amountCents,
      status: payoutBatchItems.status,
      paidAt: payoutBatchItems.paidAt
    })
    .from(payoutBatchItems)
    .where(and(
      eq(payoutBatchItems.userId, userId),
      sql`${payoutBatchItems.cycleSettingId} = ANY(${sql.array(cycleIds, "int4")})`
    ));

  const byCycle = new Map<number, { amountCents: number; status: string; paidAt: Date | null }>();
  payoutItems.forEach(p => byCycle.set(Number(p.cycleSettingId), { amountCents: Number(p.amountCents), status: p.status, paidAt: p.paidAt as any }));

  const items: RewardsHistoryItem[] = winners.map(w => {
    const match = byCycle.get(Number(w.cycleId));
    const amount = match?.amountCents ?? Number(w.rewardAmount || 0) || Number(w.rewardAmountFallback || 0) || 0;
    const status = normalizePayoutStatus(match?.status || w.payoutStatus || "pending");
    const paidAt = match?.paidAt ? new Date(match.paidAt).toISOString() : null;
    return {
      cycleId: Number(w.cycleId),
      cycleLabel: w.cycleName,
      awardedAt: w.awardedAt ? new Date(w.awardedAt as any).toISOString() : null,
      amountCents: amount,
      status,
      paidAt
    };
  });

  const totalEarnedCents = items.filter(i => i.status === "paid").reduce((s, i) => s + (i.amountCents || 0), 0);
  const rewardsReceived = items.filter(i => i.status === "paid").length;

  return { summary: { totalEarnedCents, rewardsReceived }, items };
}
