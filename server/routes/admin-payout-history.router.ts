import { Router, Request, Response, Express } from "express";
import { storage } from "../storage";

type Row = Record<string, any>;

const mapRow = (r: Row) => ({
  id: Number(r?.id),
  status: String(r?.status ?? ""),
  createdAt: r?.created_at ?? r?.createdAt ?? null,
  completedAt: r?.completed_at ?? r?.completedAt ?? null,
  paypalBatchId: r?.paypal_batch_id ?? r?.paypalBatchId ?? null,
});

function rowsFrom(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result)) return result;
  return [];
}

async function queryAny(sql: string, params: any[]): Promise<any[]> {
  const s: any = storage as any;
  const candidates: [string, any, "execute" | "query"][] = [
    ["db.execute", s?.db?.execute, "execute"],
    ["db.query", s?.db?.query, "query"],
    ["pool.query", s?.pool?.query, "query"],
    ["client.query", s?.client?.query, "query"],
    ["database.execute", s?.database?.execute, "execute"],
  ];
  for (const [name, fn, kind] of candidates) {
    if (typeof fn === "function") {
      try {
        const res = kind === "execute" ? await fn(sql, params) : await fn(sql, params);
        const rows = rowsFrom(res);
        if (process.env.DEBUG_PAY_HISTORY) console.log("[HISTORY] via", name, "rows:", rows.length);
        if (rows.length) return rows;
      } catch (err) {
        if (process.env.DEBUG_PAY_HISTORY) console.log("[HISTORY] handle failed:", name, err);
      }
    }
  }
  return [];
}

export function registerAdminPayoutHistoryRoutes(app: Express) {
  const router = Router();

  router.get("/payout-batches/ping", (_req: Request, res: Response) => {
    res.setHeader("X-History-Branch", "ping");
    res.json({ ok: true, at: "/api/admin/payout-batches/ping" });
  });

  router.get("/payout-batches", async (req: Request, res: Response) => {
    const cycleId = Number(req.query.cycleId);
    if (!cycleId) return res.status(400).json({ error: "cycleId is required" });
    const s: any = storage as any;
    try {
      if (typeof s.listBatchesForCycle === "function") {
        const rows = await s.listBatchesForCycle(cycleId);
        res.setHeader("X-History-Branch", "storage.listBatchesForCycle");
        return res.json((rows || []).map(mapRow));
      }
      if (typeof s.getBatchesForCycle === "function") {
        const rows = await s.getBatchesForCycle(cycleId);
        res.setHeader("X-History-Branch", "storage.getBatchesForCycle");
        return res.json((rows || []).map(mapRow));
      }
      const sql = `
        select id, status, created_at, completed_at, paypal_batch_id
        from payout_batches
        where cycle_setting_id = $1
        order by created_at desc
      `;
      const rows = await queryAny(sql, [cycleId]);
      res.setHeader("X-History-Branch", "fallback.sql");
      return res.json((rows || []).map(mapRow));
    } catch (e: any) {
      console.error("[HISTORY] list error:", e?.message || e);
      res.status(500).json({ error: "Failed to load batches", detail: e?.message || String(e) });
    }
  });

  router.get("/payout-batches/:batchId/summary", async (req: Request, res: Response) => {
    const batchId = Number(req.params.batchId);
    if (!batchId) return res.status(400).json({ error: "Invalid batchId" });
    const s: any = storage as any;
    try {
      if (typeof s.getBatchItemStats === "function") {
        const sum = await s.getBatchItemStats(batchId);
        res.setHeader("X-History-Branch", "storage.getBatchItemStats");
        return res.json(sum || null);
      }
      const sql = `
        select
          count(*)::int as total_items,
          sum(case when status = 'success' then 1 else 0 end)::int as success,
          sum(case when status = 'failed' then 1 else 0 end)::int as failed,
          sum(case when status = 'unclaimed' then 1 else 0 end)::int as unclaimed,
          sum(case when status = 'pending' then 1 else 0 end)::int as pending,
          sum(case when status = 'processing' then 1 else 0 end)::int as processing,
          coalesce(sum(case when status = 'success' then amount else 0 end),0)::numeric as paid_total
        from payout_batch_items
        where batch_id = $1
      `;
      const rows = await queryAny(sql, [batchId]);
      const row = rows[0];
      res.setHeader("X-History-Branch", "fallback.sql.summary");
      if (!row) return res.json(null);
      return res.json({
        id: batchId,
        totalItems: Number(row.total_items || 0),
        success: Number(row.success || 0),
        failed: Number(row.failed || 0),
        unclaimed: Number(row.unclaimed || 0),
        pending: Number(row.pending || 0),
        processing: Number(row.processing || 0),
        totals: { success: Number(row.paid_total || 0) }
      });
    } catch (e: any) {
      console.error("[HISTORY] summary error:", e?.message || e);
      return res.status(500).json({ error: "Failed to load batch summary", detail: e?.message || String(e) });
    }
  });

  app.use("/api/admin", router);
}