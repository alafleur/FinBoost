import type { Express, Request, Response } from "express";
import { storage } from "../storage";

function mapBatchRow(row: any) {
  return {
    id: Number(row?.id),
    status: String(row?.status ?? ""),
    createdAt: row?.created_at || row?.createdAt || null,
    completedAt: row?.completed_at || row?.completedAt || null,
    paypalBatchId: row?.paypal_batch_id ?? row?.paypalBatchId ?? null,
  };
}

export function registerAdminPayoutHistoryRoutes(app: Express) {
  // List batches for a cycle
  app.get("/api/admin/payout-batches", async (req: Request, res: Response) => {
    try {
      const cycleId = Number(req.query.cycleId);
      if (!cycleId) return res.status(400).json({ error: "cycleId is required" });

      // Prefer the project's storage method if present
      if ((storage as any).listBatchesForCycle) {
        const rows = await (storage as any).listBatchesForCycle(cycleId);
        if (Array.isArray(rows) && rows.length) {
          return res.json(rows.map(mapBatchRow));
        }
        // If it exists but returned empty, continue to fallback (to be robust)
      }

      // Fallback: attempt a direct query if a db handle exists
      const dbAny = (storage as any).db || (storage as any).database || null;
      if (dbAny?.execute) {
        const sql = `select id, status, created_at, completed_at, paypal_batch_id from payout_batches where cycle_setting_id = $1 order by created_at desc`;
        const r: any = await dbAny.execute(sql, [cycleId]);
        const rows = Array.isArray(r?.rows) ? r.rows : Array.isArray(r) ? r : [];
        return res.json(rows.map(mapBatchRow));
      }

      // Last resort: no data source
      return res.json([]);
    } catch (e) {
      console.error("[HISTORY] list error:", e);
      res.status(500).json({ error: "Failed to load batches" });
    }
  });

  // Summary for a batch (existing storage implementation is expected)
  app.get("/api/admin/payout-batches/:batchId/summary", async (req: Request, res: Response) => {
    try {
      const batchId = Number(req.params.batchId);
      if (!batchId) return res.status(400).json({ error: "Invalid batchId" });

      if ((storage as any).getBatchItemStats) {
        const sum = await (storage as any).getBatchItemStats(batchId);
        return res.json(sum || null);
      }

      // Minimal fallback if project lacks getBatchItemStats:
      if ((storage as any).db?.execute) {
        const sql = `
          select
            count(*)::int as total_items,
            sum(case when status = 'success' then 1 else 0 end)::int as success,
            sum(case when status = 'failed' then 1 else 0 end)::int as failed,
            sum(case when status = 'unclaimed' then 1 else 0 end)::int as unclaimed,
            sum(case when status = 'pending' then 1 else 0 end)::int as pending,
            sum(case when status = 'processing' then 1 else 0 end)::int as processing,
            sum(case when status = 'success' then amount else 0 end)::numeric as paid_total
          from payout_batch_items
          where batch_id = $1
        `;
        const r: any = await (storage as any).db.execute(sql, [batchId]);
        const row = Array.isArray(r?.rows) ? r.rows[0] : (Array.isArray(r) ? r[0] : null);
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
      }

      return res.json(null);
    } catch (e) {
      console.error("[HISTORY] summary error:", e);
      res.status(500).json({ error: "Failed to load batch summary" });
    }
  });

  // Retry failed (kept as-is; assumes a project helper exists)
  app.post("/api/admin/payout-batches/:batchId/retry-failed", async (req: Request, res: Response) => {
    try {
      const batchId = Number(req.params.batchId);
      if (!batchId) return res.status(400).json({ error: "Invalid batchId" });
      if (!(storage as any).createRetryBatchFromFailed) {
        return res.status(400).json({ error: "Retry not supported in this build" });
      }
      const newBatch = await (storage as any).createRetryBatchFromFailed(batchId);
      res.json({ success: true, batchId: newBatch.id });
    } catch (e: any) {
      console.error("[HISTORY] retry error:", e);
      res.status(400).json({ error: e?.message || "Failed to create retry batch" });
    }
  });
}
