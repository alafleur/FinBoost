// server/diag/rewardsDiag.ts
// Optional: diagnostics to quickly identify schema mismatch, ORM version bug, or data corruption.
import { and, desc, eq, inArray } from "drizzle-orm";
import { cycleSettings, cycleWinnerSelections, payoutBatchItems } from "../../shared/schema";
import { db } from "../db";

type DiagResult = {
  drizzleVersion?: string;
  env: { node: string };
  tablesPresent: Record<string, boolean>;
  probes: Array<{ name: string; ok: boolean; rows?: number; sample?: any; error?: string }>;
  verdict: "schema_mismatch" | "data_corruption" | "orm_bug" | "unknown" | "ok";
};

async function getDrizzleVersion(): Promise<string | undefined> {
  try { const pkg = require("drizzle-orm/package.json"); return pkg?.version; } catch { return undefined; }
}

async function rawQuery(sqlText: string) {
  const anyDb: any = db as any;
  const client = anyDb?.session?.client || anyDb?.client || anyDb?.$client;
  if (!client || !client.query) throw new Error("No underlying client.query available");
  return client.query(sqlText);
}

export async function runRewardsDiagnostics(): Promise<DiagResult> {
  const result: DiagResult = {
    drizzleVersion: await getDrizzleVersion(),
    env: { node: process.version },
    tablesPresent: { cycle_winner_selections: false, cycle_settings: false, payout_batch_items: false },
    probes: [],
    verdict: "unknown",
  };

  // Tables present?
  try {
    const colRows = await rawQuery(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('cycle_winner_selections','cycle_settings','payout_batch_items');
    `);
    for (const r of colRows.rows) {
      result.tablesPresent[r.table_name] = true;
    }
  } catch (e: any) {
    result.probes.push({ name: "information_schema.tables", ok: false, error: String(e?.message || e) });
  }

  // Simple Drizzle selects (no joins)
  try {
    const rows = await db
      .select({
        cycleId: cycleWinnerSelections.cycleSettingId,
        userId: cycleWinnerSelections.userId,
        sealedAt: cycleWinnerSelections.sealedAt,
        payoutFinal: cycleWinnerSelections.payoutFinal,
        rewardAmount: cycleWinnerSelections.rewardAmount,
        payoutStatus: cycleWinnerSelections.payoutStatus,
      })
      .from(cycleWinnerSelections)
      .where(eq(cycleWinnerSelections.isSealed, true))
      .orderBy(desc(cycleWinnerSelections.sealedAt))
      .limit(3);
    result.probes.push({ name: "drizzle_select_winners_simple", ok: true, rows: rows.length, sample: rows[0] || null });
  } catch (e: any) {
    result.probes.push({ name: "drizzle_select_winners_simple", ok: false, error: String(e?.message || e) });
  }

  try {
    const rows = await db
      .select({
        id: cycleSettings.id,
        cycleName: cycleSettings.cycleName,
      })
      .from(cycleSettings)
      .limit(3);
    result.probes.push({ name: "drizzle_select_cycle_settings_simple", ok: true, rows: rows.length, sample: rows[0] || null });
  } catch (e: any) {
    result.probes.push({ name: "drizzle_select_cycle_settings_simple", ok: false, error: String(e?.message || e) });
  }

  try {
    const rows = await db
      .select({
        cycleSettingId: payoutBatchItems.cycleSettingId,
        userId: payoutBatchItems.userId,
        amountCents: payoutBatchItems.amountCents,
        status: payoutBatchItems.status,
        paidAt: payoutBatchItems.paidAt,
      })
      .from(payoutBatchItems)
      .limit(3);
    result.probes.push({ name: "drizzle_select_payout_items_simple", ok: true, rows: rows.length, sample: rows[0] || null });
  } catch (e: any) {
    result.probes.push({ name: "drizzle_select_payout_items_simple", ok: false, error: String(e?.message || e) });
  }

  // Raw fallbacks
  try {
    const r = await rawQuery("SELECT cycle_setting_id, user_id, payout_final FROM cycle_winner_selections ORDER BY 1 DESC LIMIT 3;");
    result.probes.push({ name: "raw_select_winners", ok: true, rows: r.rowCount, sample: r.rows?.[0] || null });
  } catch (e: any) {
    result.probes.push({ name: "raw_select_winners", ok: false, error: String(e?.message || e) });
  }
  try {
    const r = await rawQuery("SELECT id, cycle_name FROM cycle_settings ORDER BY 1 DESC LIMIT 3;");
    result.probes.push({ name: "raw_select_cycle_settings", ok: true, rows: r.rowCount, sample: r.rows?.[0] || null });
  } catch (e: any) {
    result.probes.push({ name: "raw_select_cycle_settings", ok: false, error: String(e?.message || e) });
  }
  try {
    const r = await rawQuery("SELECT cycle_setting_id, user_id, amount_cents, status FROM payout_batch_items ORDER BY 1 DESC LIMIT 3;");
    result.probes.push({ name: "raw_select_payout_items", ok: true, rows: r.rowCount, sample: r.rows?.[0] || null });
  } catch (e: any) {
    result.probes.push({ name: "raw_select_payout_items", ok: false, error: String(e?.message || e) });
  }

  // Verdict
  const anyTableMissing = Object.values(result.tablesPresent).some((p) => !p);
  const anyDrizzleProbeFailed = result.probes.some((p) => p.name.startsWith("drizzle_") && !p.ok);
  const allRawOk = result.probes.filter((p) => p.name.startsWith("raw_")).every((p) => p.ok);

  if (anyTableMissing) result.verdict = "schema_mismatch";
  else if (anyDrizzleProbeFailed && allRawOk) result.verdict = "orm_bug";
  else if (!anyDrizzleProbeFailed) result.verdict = "ok";
  else result.verdict = "unknown";

  return result;
}
