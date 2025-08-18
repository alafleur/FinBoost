// server/storage.ts
// Rewards history storage — finalized contract for dev mode.
// Returns separate totals for paid and pending, and never fails the whole request due to secondary lookups.
// Adjust the `db` import and schema imports to your project as needed.

import { db } from "./db"; // <-- adjust to your project's db export
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
  summary: {
    paidTotalCents: number;     // sum of items with status === 'paid'
    pendingTotalCents: number;  // sum of items with status in ['earned','pending']
    rewardsReceived: number;    // count of items with status === 'paid'
  };
  items: RewardsHistoryItem[];
};

function normalizePayoutStatus(raw?: string): RewardStatus {
  switch ((raw || "").toLowerCase()) {
    case "success":
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    // Treat all in-flight states as 'earned' so the UI shows them as queued/pending
    case "processing":
    case "queued":
    case "earned":
    case "pending":
      return "earned";
    default:
      return "pending";
  }
}

export async function getRewardsHistoryForUser(userId: number): Promise<RewardsHistoryResponse> {
  // 1) Winners for user — sealed only
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
    return { summary: { paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 }, items: [] };
  }

  const cycleIds = Array.from(new Set(winners.map((w) => Number(w.cycleId)).filter((n) => Number.isFinite(n)))) as number[];

  // 2) Cycle names (guarded — if this fails, we default to "Cycle <id>")
  const nameMap = new Map<number, string>();
  if (cycleIds.length > 0) {
    try {
      const names = await db
        .select({
          id: cycleSettings.id,
          name: cycleSettings.cycleName,
        })
        .from(cycleSettings)
        .where(inArray(cycleSettings.id, cycleIds));
      for (const row of names) {
        if (typeof row?.id !== "undefined") {
          const id = Number(row.id);
          const nm = (row?.name ? String(row.name) : "").trim();
          nameMap.set(id, nm);
        }
      }
    } catch {
      // swallow; we'll fallback to "Cycle <id>"
    }
  }

  // 3) Payout items (guarded — if this fails, we rely on winner data only)
  const payoutMap = new Map<number, { amountCents: number; status: string; paidAt: Date | null }>();
  if (cycleIds.length > 0) {
    try {
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
        if (typeof r?.cycleSettingId !== "undefined") {
          payoutMap.set(Number(r.cycleSettingId), {
            amountCents: Number(r?.amountCents || 0),
            status: String(r?.status || ""),
            paidAt: (r?.paidAt as any) ?? null,
          });
        }
      }
    } catch {
      // swallow; we'll rely on winners data
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

  const paidTotalCents = items
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amountCents || 0), 0);

  const pendingTotalCents = items
    .filter((i) => i.status === "earned" || i.status === "pending")
    .reduce((s, i) => s + (i.amountCents || 0), 0);

  const rewardsReceived = items.filter((i) => i.status === "paid").length;

  return { summary: { paidTotalCents, pendingTotalCents, rewardsReceived }, items };
}
