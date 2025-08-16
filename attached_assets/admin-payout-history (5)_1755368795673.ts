
import { Express, Request, Response } from "express";

export function registerAdminPayoutHistoryRoutes(app: Express) {
  // List batches by cycleId
  app.get("/api/admin/payout-batches", async (req: Request, res: Response) => {
    const cycleId = req.query.cycleId;
    let results: any[] = [];
    let branch = "none";

    try {
      // Preferred storage method
      if ((global as any).storage?.listBatchesForCycle) {
        branch = "storage.listBatchesForCycle";
        results = await (global as any).storage.listBatchesForCycle(cycleId);
      }

      // Fallback 1: getBatchesForCycle
      if ((!results || results.length === 0) && (global as any).storage?.getBatchesForCycle) {
        branch = "storage.getBatchesForCycle";
        results = await (global as any).storage.getBatchesForCycle(cycleId);
      }

      // Fallback 2: raw DB
      if ((!results || results.length === 0) && (global as any).storage?.db?.execute) {
        branch = "storage.db.execute";
        const rows = await (global as any).storage.db.execute(
          "select id, status, created_at, completed_at, paypal_batch_id from payout_batches where cycle_setting_id = $1 order by created_at desc",
          [cycleId]
        );
        results = rows?.rows || [];
      }

      // Fallback 3: other db handles
      const dbHandles = [
        "db.query",
        "pool.query",
        "client.query",
        "database.execute",
      ];
      for (const handle of dbHandles) {
        if ((!results || results.length === 0) && (global as any).storage) {
          const parts = handle.split(".");
          let fn: any = (global as any).storage;
          for (const p of parts) {
            fn = fn?.[p];
          }
          if (typeof fn === "function") {
            branch = handle;
            const rows = await fn.call(
              (global as any).storage,
              "select id, status, created_at, completed_at, paypal_batch_id from payout_batches where cycle_setting_id = $1 order by created_at desc",
              [cycleId]
            );
            results = rows?.rows || [];
          }
        }
      }

      res.setHeader("X-History-Branch", branch);
      res.json(results);
    } catch (err: any) {
      console.error("Error in /api/admin/payout-batches", err);
      res.status(500).json({ error: err.message, branch });
    }
  });

  // Active batch for cycle
  app.get("/api/admin/payout-batches/active", async (req: Request, res: Response) => {
    try {
      if ((global as any).storage?.getActiveBatchForCycle) {
        const active = await (global as any).storage.getActiveBatchForCycle(req.query.cycleId);
        return res.json(active);
      }
      res.json({});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Debug raw handles
  app.get("/api/admin/payout-batches/debug/handles", (req: Request, res: Response) => {
    const storage = (global as any).storage || {};
    const handles = Object.keys(storage).filter(k => typeof (storage as any)[k] === "function");
    res.json({ availableHandles: handles });
  });

  // Debug single batch raw row
  app.get("/api/admin/payout-batches/:id/raw", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const rows = await (global as any).storage?.db?.execute(
        "select * from payout_batches where id = $1",
        [id]
      );
      res.json(rows?.rows || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
