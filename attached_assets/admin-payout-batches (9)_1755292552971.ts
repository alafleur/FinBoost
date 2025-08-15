import type { Express, Request, Response } from "express";
import { storage } from "../storage";

type AnyRecord = Record<string, any>;

interface BatchStatusPayload {
  batchId: number;
  status: string;
  totalChunks: number;
  completedChunks: number;
  processedItems: number;
  totalItems: number;
  paypalBatchId?: string | null;
  error?: string | null;
  pollVersion?: number;
}

function noCache(res: Response) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
}

function normalizeStatus(raw: any): string {
  const s = String(raw ?? "").toLowerCase();
  if (["completed","complete","success","succeeded","done","finished","partially_completed"].includes(s)) return "completed";
  if (["processing","in_progress","in-progress","pending","intent","running","queued"].includes(s)) return "processing";
  if (["failed","error","errored","canceled","cancelled"].includes(s)) return "failed";
  return s || "intent";
}

function getChunkInfo(batch: AnyRecord, totalItems: number, processedItems: number) {
  let totalChunks = Number(batch?.total_chunks ?? batch?.totalChunks ?? 0) || 0;
  let completedChunks = Number(batch?.processed_chunks ?? batch?.processedChunks ?? 0) || 0;

  if (!totalChunks) totalChunks = Math.max(1, Math.ceil(totalItems / 100));
  if (!completedChunks) completedChunks = Math.min(totalChunks, Math.floor(processedItems / 100));

  if (totalItems > 0 && processedItems >= totalItems) {
    completedChunks = totalChunks;
  }
  return { totalChunks, completedChunks };
}

function countProcessed(items: AnyRecord[]) {
  const terminal = new Set(["success","failed","unclaimed","pending"]);
  let processed = 0;
  for (const it of items) {
    const st = String(it?.status ?? "").toLowerCase();
    if (terminal.has(st)) processed++;
  }
  return processed;
}

function buildPayload(batch: AnyRecord, items: AnyRecord[]): BatchStatusPayload {
  const totalItems = items.length;
  const processedItems = countProcessed(items);
  const { totalChunks, completedChunks } = getChunkInfo(batch, totalItems, processedItems);

  let status = normalizeStatus(batch?.status);
  if (totalItems > 0 && processedItems >= totalItems) {
    status = "completed";
  }

  return {
    batchId: Number(batch.id),
    status,
    totalChunks,
    completedChunks,
    processedItems,
    totalItems,
    paypalBatchId: batch?.paypal_batch_id ?? batch?.paypalBatchId ?? null,
    error: batch?.error_details ?? batch?.errorDetails ?? null,
    pollVersion: Date.now(),
  };
}

export function registerAdminPayoutBatchRoutes(app: Express) {
  app.get("/api/admin/payout-batches/active", async (req: Request, res: Response) => {
    noCache(res);
    const cycleId = Number(req.query.cycleId);
    if (!cycleId) return res.status(400).json({ error: "cycleId query param is required" });

    try {
      const batch = await (storage as any).getActivePayoutBatchForCycle(cycleId);
      if (!batch) return res.status(404).json({ error: "No active batch for this cycle" });

      const items = await (storage as any).getPayoutBatchItems(Number(batch.id));
      return res.status(200).json(buildPayload(batch, items));
    } catch (e) {
      console.error("[ADMIN BATCHES] /active error:", e);
      return res.status(500).json({ error: "Failed to load active batch" });
    }
  });

  app.get("/api/admin/payout-batches/:batchId/status", async (req: Request, res: Response) => {
    noCache(res);
    const batchId = Number(req.params.batchId);
    if (!batchId) return res.status(400).json({ error: "Invalid batchId" });

    try {
      const batch = await (storage as any).getPayoutBatch(batchId);
      if (!batch) return res.status(404).json({ error: "Batch not found" });

      const items = await (storage as any).getPayoutBatchItems(batchId);
      return res.status(200).json(buildPayload(batch, items));
    } catch (e) {
      console.error("[ADMIN BATCHES] /:batchId/status error:", e);
      return res.status(500).json({ error: "Failed to load batch status" });
    }
  });
}
