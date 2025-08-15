import type { Express, Request, Response } from "express";
import { storage } from "../storage";

export function registerAdminPayoutHistoryRoutes(app: Express) {
  app.get("/api/admin/payout-batches", async (req: Request, res: Response) => {
    try {
      const cycleId = Number(req.query.cycleId);
      if (!cycleId) return res.status(400).json({ error: "cycleId is required" });
      const rows = await (storage as any).listBatchesForCycle(cycleId);
      res.json(rows);
    } catch (e) {
      console.error("[HISTORY] list error:", e);
      res.status(500).json({ error: "Failed to load batches" });
    }
  });

  app.get("/api/admin/payout-batches/:batchId/summary", async (req: Request, res: Response) => {
    try {
      const batchId = Number(req.params.batchId);
      if (!batchId) return res.status(400).json({ error: "Invalid batchId" });
      const sum = await (storage as any).getBatchItemStats(batchId);
      res.json(sum);
    } catch (e) {
      console.error("[HISTORY] summary error:", e);
      res.status(500).json({ error: "Failed to load batch summary" });
    }
  });

  app.post("/api/admin/payout-batches/:batchId/retry-failed", async (req: Request, res: Response) => {
    try {
      const batchId = Number(req.params.batchId);
      if (!batchId) return res.status(400).json({ error: "Invalid batchId" });
      const newBatch = await (storage as any).createRetryBatchFromFailed(batchId);
      res.json({ success: true, batchId: newBatch.id });
    } catch (e: any) {
      console.error("[HISTORY] retry error:", e);
      res.status(400).json({ error: e?.message || "Failed to create retry batch" });
    }
  });
}