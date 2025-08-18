// server/storage.ts
// Storage helpers for rewards history (Drizzle + Node).
// FIX: Replace sql.array(...) with inArray(...) (Drizzle doesn't expose sql.array).
// Also guard against empty cycleIds to avoid invalid SQL.

import { db } from "./db"; // adjust to your project's db export
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
    case "pending":
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
  const cycleIds = [...new Set(winners.map(w => Number(w.cycleId)).filter(n => Number.isFinite(n)))] as number[];

  let payoutItems: Array<{ cycleSettingId: number; amountCents: number; status: string; paidAt: Date | null }> = [];

  if (cycleIds.length > 0) {
    const rows = await db.select({
        cycleSettingId: payoutBatchItems.cycleSettingId,
        amountCents: payoutBatchItems.amountCents,
        status: payoutBatchItems.status,
        paidAt: payoutBatchItems.paidAt
      })
      .from(payoutBatchItems)
      .where(and(
        eq(payoutBatchItems.userId, userId),
        inArray(payoutBatchItems.cycleSettingId, cycleIds) // <-- FIXED
      ));

    payoutItems = rows.map(r => ({
      cycleSettingId: Number(r.cycleSettingId),
      amountCents: Number(r.amountCents),
      status: String(r.status),
      paidAt: (r.paidAt as any) ?? null
    }));
  }

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
