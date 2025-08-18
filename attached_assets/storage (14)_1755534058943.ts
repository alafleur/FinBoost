// server/storage.ts
// Storage helpers for rewards history (Drizzle + Node).
// Strategy: avoid leftJoin (which was triggering Drizzle's field ordering bug).
// We run 3 small queries and reconcile in TypeScript.

import { db } from "./db"; // adjust to your project's db export
import { and, desc, eq, inArray } from "drizzle-orm";
import { cycleSettings, cycleWinnerSelections, payoutBatchItems } from "../shared/schema";

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
  // 1) Pull winners for user — sealed only
  const winners = await db
    .select({
      cycleId: cycleWinnerSelections.cycleSettingId,
      awardedAt: cycleWinnerSelections.sealedAt,
      payoutFinal: cycleWinnerSelections.payoutFinal,
      rewardAmount: cycleWinnerSelections.rewardAmount,
      payoutStatus: cycleWinnerSelections.payoutStatus,
    })
    .from(cycleWinnerSelections)
    .where(and(eq(cycleWinnerSelections.userId, userId), eq(cycleWinnerSelections.isSealed, true)))
    .orderBy(desc(cycleWinnerSelections.sealedAt));

  if (!winners || winners.length === 0) {
    return { summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] };
  }

  const cycleIds = Array.from(
    new Set(winners.map((w) => Number(w.cycleId)).filter((n) => Number.isFinite(n)))
  ) as number[];

  // 2) Map cycle id -> cycle name
  const nameMap = new Map<number, string>();
  if (cycleIds.length > 0) {
    const names = await db
      .select({
        id: cycleSettings.id,
        name: cycleSettings.cycleName,
      })
      .from(cycleSettings)
      .where(inArray(cycleSettings.id, cycleIds));
    for (const row of names) {
      const id = Number(row.id);
      const nm = (row.name ? String(row.name) : "").trim();
      nameMap.set(id, nm);
    }
  }

  // 3) Pull payout items for these cycles (if any)
  const payoutMap = new Map<number, { amountCents: number; status: string; paidAt: Date | null }>();
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

    for (const r of rows) {
      payoutMap.set(Number(r.cycleSettingId), {
        amountCents: Number(r.amountCents || 0),
        status: String(r.status || ""),
        paidAt: (r.paidAt as any) ?? null,
      });
    }
  }

  // 4) Reconcile into UI items
  const items: RewardsHistoryItem[] = winners.map((w) => {
    const cycleId = Number(w.cycleId);
    const paid = payoutMap.get(cycleId);

    const amount =
      (paid?.amountCents ?? 0) ||
      Number(w.payoutFinal || 0) ||
      Number(w.rewardAmount || 0) ||
      0;

    const status = normalizePayoutStatus(paid?.status || w.payoutStatus || "pending");
    const paidAt = paid?.paidAt ? new Date(paid.paidAt).toISOString() : null;
    const awardedAt = w.awardedAt ? new Date(w.awardedAt as any).toISOString() : null;
    const cycleLabel = (nameMap.get(cycleId) || "").trim() || `Cycle ${cycleId}`;

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
