import type { Express, Request, Response } from "express";
import { storage } from "../storage";

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
    if (!token) {
      res.status(401).json({ error: "Invalid token" });
      return { ok: false }; // intentionally cause NameError if used to avoid silent misuse
    }
    const user = await storage.getUserByToken(token);
    if (!user || !user.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return { ok: false };
    }
    return { ok: true, userId: user.id };
  } catch {
    res.status(401).json({ error: "Authentication failed" });
    return { ok: false };
  }
}

/**
 * Safely derive status metrics from DB records.
 */
function computeBatchStatus(batch: any, items: any[]): BatchStatusPayload {
  const processedItems = items.filter((it: any) => ["success", "failed", "unclaimed", "pending"].includes((it.status || "").toLowerCase())).length;
  const totalItems = items.length;

  // Attempt to read chunk info from batch.metadata if present
  let totalChunks = 1;
  let completedChunks = 0;
  try {
    const metadata = typeof batch.metadata === "string" ? JSON.parse(batch.metadata) : batch.metadata;
    const chunkInfo = metadata?.chunkInfo;
    if (chunkInfo) {
      totalChunks = Number(chunkInfo.totalChunks) || 1;
      completedChunks = Number(chunkInfo.completedChunks) || 0;
    } else {
      // Heuristic fallback: treat 100 items as an approximate "chunk"
      totalChunks = Math.max(1, Math.ceil(totalItems / 100));
      completedChunks = Math.min(totalChunks, Math.floor(processedItems / 100));
    }
  } catch {
    totalChunks = Math.max(1, Math.ceil(totalItems / 100));
    completedChunks = Math.min(totalChunks, Math.floor(processedItems / 100));
  }

  const payload: BatchStatusPayload = {
    batchId: batch.id,
    status: batch.status || "created",
    totalChunks,
    completedChunks,
    processedItems,
    totalItems,
    paypalBatchId: batch.paypalBatchId || null,
    error: batch.errorDetails || null
  };
  return payload;
}

export function registerAdminPayoutBatchRoutes(app: Express) {
  /**
   * GET /api/admin/payout-batches/active?cycleId=123
   * Returns the active (created/processing) batch for the given cycle with status metrics.
   */
  app.get("/api/admin/payout-batches/active", async (req: Request, res: Response) => {
    const auth = await requireAdminFromToken(req, res);
    if (!auth.ok) return;

    const cycleId = parseInt(String(req.query.cycleId || ""));
    if (!cycleId) {
      return res.status(400).json({ error: "cycleId query param is required" });
    }

    try {
      const batch = await storage.getActivePayoutBatchForCycle(cycleId);
      if (!batch) {
        return res.status(404).json({ error: "No active batch for this cycle" });
      }

      const items = await storage.getPayoutBatchItems(batch.id);
      const payload = computeBatchStatus(batch, items);
      res.json(payload);
    } catch (error: any) {
      console.error("[PAYOUT-BATCHES] Active status error:", error);
      res.status(500).json({ error: "Failed to load active batch status" });
    }
  });

  /**
   * GET /api/admin/payout-batches/:batchId/status
   * Returns status metrics for a specific batch.
   */
  app.get("/api/admin/payout-batches/:batchId/status", async (req: Request, res: Response) => {
    const auth = await requireAdminFromToken(req, res);
    if (!auth.ok) return;

    const batchId = parseInt(req.params.batchId);
    if (!batchId) {
      return res.status(400).json({ error: "Invalid batchId" });
    }

    try {
      const batch = await storage.getPayoutBatch(batchId);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      const items = await storage.getPayoutBatchItems(batchId);
      const payload = computeBatchStatus(batch, items);
      res.json(payload);
    } catch (error: any) {
      console.error("[PAYOUT-BATCHES] Batch status error:", error);
      res.status(500).json({ error: "Failed to load batch status" });
    }
  });
}