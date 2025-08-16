import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { stringify } from "csv-stringify/sync";

/**
 * CSV Export routes for payout batches.
 * Provides a simple, schema-safe export of payout_batch_items.
 */
export function registerAdminPayoutExportRoutes(app: Express) {
  app.get("/api/admin/payout-batches/:batchId/items.csv", async (req: Request, res: Response) => {
    try {
      const batchId = Number(req.params.batchId);
      if (!batchId) return res.status(400).send("invalid batchId");

      const items = await (storage as any).getPayoutBatchItems(batchId);
      const rows = (items || []).map((it: any) => ({
        id: it.id,
        batch_id: it.batch_id ?? it.batchId,
        user_id: it.user_id ?? it.userId,
        paypal_email: it.paypal_email ?? it.paypalEmail,
        amount: it.amount,
        currency: it.currency || "USD",
        status: it.status,
        created_at: it.created_at || it.createdAt,
        updated_at: it.updated_at || it.updatedAt,
        cycle_winner_selection_id: it.cycle_winner_selection_id ?? it.cycleWinnerSelectionId,
      }));

      const csv = stringify(rows, { header: true });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="payout-batch-${batchId}.csv"`);
      res.send(csv);
    } catch (e) {
      console.error("[EXPORT] csv error", e);
      res.status(500).send("export failed");
    }
  });
}
