import type { Express, Request, Response } from "express";
import { storage } from "../storage";

type AnyRecord = Record<string, any>;

interface BatchStatusPayload {
  batchId: string | number;
  status: string;
  totalChunks: number;
  completedChunks: number;
  processedItems: number;
  totalItems: number;
  paypalBatchId?: string | null;
  error?: string | null;
}

async function requireAdminFromToken(req: Request, res: Response): Promise<{ ok: boolean; userId?: number }> {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Invalid token" }); return { ok: false }; }
    const user = await (storage as any).getUserByToken?.(token);
    if (!user || !user.isAdmin) { res.status(403).json({ error: "Admin access required" }); return { ok: false }; }
    return { ok: true, userId: user.id };
  } catch {
    res.status(401).json({ error: "Authentication failed" });
    return { ok: false };
  }
}

function pick<T = any>(obj: AnyRecord, keys: string[], fallback?: any): T {
  for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) return obj[k];
  return fallback as T;
}

function normalizeBatch(raw: AnyRecord) {
  return {
    id: pick<number>(raw, ["id", "batchId", "batch_id"]),
    status: pick<string>(raw, ["status"], "created"),
    metadata: pick<any>(raw, ["metadata", "meta"]),
    paypalBatchId: pick<string | null>(raw, ["paypalBatchId", "paypal_batch_id"], null),
    errorDetails: pick<string | null>(raw, ["errorDetails", "error_details", "error"], null),
  };
}

function normalizeItems(items: AnyRecord[]) {
  return items.map((it) => ({ status: String(pick<string>(it, ["status"], "")) }));
}

function normalizeStatus(raw: any): string {
  const s = String(raw ?? "").toLowerCase();
  if (["completed", "complete", "success", "succeeded", "done", "finished"].includes(s)) return "completed";
  if (["processing", "in_progress", "in-progress", "running"].includes(s)) return "processing";
  if (["failed", "error", "errored", "canceled", "cancelled"].includes(s)) return "failed";
  return s || "created";
}

function deriveChunkInfoFromMeta(metadata: any, totalItems: number, processedItems: number) {
  let totalChunks = 1;
  let completedChunks = 0;
  try {
    const meta = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    const chunkInfo = meta?.chunkInfo;
    if (chunkInfo) {
      totalChunks = Number(pick(chunkInfo, ["totalChunks", "total_chunks"], 1));
      completedChunks = Number(pick(chunkInfo, ["completedChunks", "completed_chunks"], 0));
    } else {
      totalChunks = Math.max(1, Math.ceil(totalItems / 100));
      completedChunks = Math.min(totalChunks, Math.floor(processedItems / 100));
    }
  } catch {
    totalChunks = Math.max(1, Math.ceil(totalItems / 100));
    completedChunks = Math.min(totalChunks, Math.floor(processedItems / 100));
  }
  return { totalChunks, completedChunks };
}

function computeBatchStatus(batchRaw: AnyRecord, itemsRaw: AnyRecord[]): BatchStatusPayload {
  const batch = normalizeBatch(batchRaw);
  const items = normalizeItems(itemsRaw);
  const terminal = new Set(["success", "failed", "unclaimed", "pending"]);
  const processedItems = items.filter((it) => terminal.has(it.status.toLowerCase())).length;
  const totalItems = items.length;
  const { totalChunks, completedChunks } = deriveChunkInfoFromMeta(batch.metadata, totalItems, processedItems);
  return {
    batchId: batch.id,
    status: normalizeStatus(batch.status),
    totalChunks,
    completedChunks,
    processedItems,
    totalItems,
    paypalBatchId: batch.paypalBatchId,
    error: batch.errorDetails,
  };
}

export function registerAdminPayoutBatchRoutes(app: Express) {
  app.get("/api/admin/payout-batches/active", async (req: Request, res: Response) => {
    const auth = await requireAdminFromToken(req, res);
    if (!auth.ok) return;
    const cycleId = Number(req.query.cycleId);
    if (!cycleId) { res.status(400).json({ error: "cycleId query param is required" }); return; }
    try {
      const batch = await (storage as any).getActivePayoutBatchForCycle(cycleId);
      if (!batch) { res.status(404).json({ error: "No active batch for this cycle" }); return; }
      const items = await (storage as any).getPayoutBatchItems(batch.id);
      res.json(computeBatchStatus(batch, items));
    } catch (error) {
      console.error("[PAYOUT-BATCHES] /active error:", error);
      res.status(500).json({ error: "Failed to load active batch status" });
    }
  });

  app.get("/api/admin/payout-batches/:batchId/status", async (req: Request, res: Response) => {
    const auth = await requireAdminFromToken(req, res);
    if (!auth.ok) return;
    const batchId = Number(req.params.batchId);
    if (!batchId) { res.status(400).json({ error: "Invalid batchId" }); return; }
    try {
      const batch = await (storage as any).getPayoutBatch(batchId);
      if (!batch) { res.status(404).json({ error: "Batch not found" }); return; }
      const items = await (storage as any).getPayoutBatchItems(batchId);
      res.json(computeBatchStatus(batch, items));
    } catch (error) {
      console.error("[PAYOUT-BATCHES] /:batchId/status error:", error);
      res.status(500).json({ error: "Failed to load batch status" });
    }
  });
}
