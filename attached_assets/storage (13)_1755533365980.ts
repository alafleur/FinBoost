// server/storage.ts
// Storage helpers for rewards history (Drizzle + Node).
// Hardened: remove raw `sql` expressions entirely; compute fallbacks in TS.
// Fixed: use inArray(...) for set membership; guard for empty arrays.

import { db } from "./db"; // adjust to your project's db export
import { and, desc, eq, inArray } from "drizzle-orm";
import { users, cycleSettings, cycleWinnerSelections, payoutBatchItems } from "../shared/schema";

export type RewardStatus = "pending" | "earned" | "paid" | "failed";

export type RewardsHistoryItem = {
  cycleId: number;
  cycleLabel: string;
  awardedAt: string | null;
  amountCents: number;
  status: RewardStatus;
  paidAt: string | null;
};

export type RewardsHistoryResponse = {
  summary: { totalEarnedCents: number; rewardsReceived: number };
  items: RewardsHistoryItem[];
};

function normalizePayoutStatus(raw?: string): RewardStatus {
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
  const winners = await db
    .select({
      cycleId: cycleWinnerSelections.cycleSettingId,
      awardedAt: cycleWinnerSelections.sealedAt,
      rewardAmount: cycleWinnerSelections.payoutFinal,
      rewardAmountFallback: cycleWinnerSelections.rewardAmount,
      payoutStatus: cycleWinnerSelections.payoutStatus,
      dbCycleName: cycleSettings.cycleName,
    })
    .from(cycleWinnerSelections)
    .leftJoin(cycleSettings, eq(cycleWinnerSelections.cycleSettingId, cycleSettings.id))
    .where(and(eq(cycleWinnerSelections.userId, userId), eq(cycleWinnerSelections.isSealed, true)))
    .orderBy(desc(cycleWinnerSelections.sealedAt));

  if (!winners || winners.length === 0) {
    return { summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] };
  }

  const cycleIds = Array.from(
    new Set(winners.map((w) => Number(w.cycleId)).filter((n) => Number.isFinite(n)))
  ) as number[];

  // 2) Payout batch items for these cycles (if any)
  let payoutItems:
    | Array<{ cycleSettingId: number; amountCents: number; status: string; paidAt: Date | null }>
    | [] = [];

  if (cycleIds.length > 0) {
    const rows = await db
      .select({
        cycleSettingId: payoutBatchItems.cycleSettingId,
        amountCents: payoutBatchItems.amountCents,
        status: payoutBatchItems.status,
        paidAt: payoutBatchItems.paidAt,
      })
      .from(payoutBatchItems)
      .where(and(eq(payoutBatchItems.userId, userId), inArray(payoutBatchItems.cycleSettingId, cycleIds)));

    payoutItems = rows.map((r) => ({
      cycleSettingId: Number(r.cycleSettingId),
      amountCents: Number(r.amountCents),
      status: String(r.status || ""),
      paidAt: (r.paidAt as any) ?? null,
    }));
  }

  const byCycle = new Map<number, { amountCents: number; status: string; paidAt: Date | null }>();
  payoutItems.forEach((p) =>
    byCycle.set(Number(p.cycleSettingId), {
      amountCents: Number(p.amountCents),
      status: p.status,
      paidAt: p.paidAt as any,
    })
  );

  const items: RewardsHistoryItem[] = winners.map((w) => {
    const cycleId = Number(w.cycleId);
    const match = byCycle.get(cycleId);
    const amount =
      (match?.amountCents ?? 0) ||
      Number(w.rewardAmount || 0) ||
      Number(w.rewardAmountFallback || 0) ||
      0;

    const status = normalizePayoutStatus(match?.status || w.payoutStatus || "pending");
    const paidAt = match?.paidAt ? new Date(match.paidAt).toISOString() : null;
    const awardedAt = w.awardedAt ? new Date(w.awardedAt as any).toISOString() : null;

    // Avoid Drizzle SQL template issues: compute label purely in TS.
    const cycleLabel = (w.dbCycleName && String(w.dbCycleName).trim()) || `Cycle ${cycleId}`;

    return {
      cycleId,
      cycleLabel,
      awardedAt,
      amountCents: amount,
      status,
      paidAt,
    };
  });

  const totalEarnedCents = items
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amountCents || 0), 0);
  const rewardsReceived = items.filter((i) => i.status === "paid").length;

  return { summary: { totalEarnedCents, rewardsReceived }, items };
}
