// server/routes.ts
// Rewards routes with canonical endpoint and legacy alias.
// - Canonical: /api/rewards/history
// - Legacy:    /api/cycles/rewards/history
// Both return the SAME payload/contract.
// Adds no-store caching to avoid 304s while developing.
// Optional admin diagnostics route included (guarded).

import type { Express, Request, Response } from "express";
import { authenticateToken } from "./middleware"; // <-- adjust path to your project
import { getRewardsHistoryForUser } from "./storage";
import { runRewardsDiagnostics } from "./diag/rewardsDiag"; // optional; remove if not used

function sendNoStore(res: Response) {
  res.set("Cache-Control", "no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

export function registerRewardsRoutes(app: Express) {
  // Canonical
  app.get("/api/rewards/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      sendNoStore(res);
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.json({ summary: { paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 }, items: [] });
      }
      const data = await getRewardsHistoryForUser(Number(userId));
      res.json(data);
    } catch (err) {
      console.error("GET /api/rewards/history error", err);
      res.status(500).json({ error: "Failed to load rewards history" });
    }
  });

  // Legacy alias (kept for back-compat). Returns the SAME shape as canonical.
  app.get("/api/cycles/rewards/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      sendNoStore(res);
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.json({ summary: { paidTotalCents: 0, pendingTotalCents: 0, rewardsReceived: 0 }, items: [] });
      }
      const data = await getRewardsHistoryForUser(Number(userId));
      res.json(data);
    } catch (err) {
      console.error("GET /api/cycles/rewards/history error", err);
      res.status(500).json({ error: "Failed to load rewards history" });
    }
  });

  // Diagnostics (admin-only). Comment out if not needed.
  app.get("/api/admin/diag/rewards", authenticateToken, async (req: Request, res: Response) => {
    try {
      sendNoStore(res);
      const isAdmin = (req as any).user?.isAdmin ?? false;
      if (!isAdmin) return res.status(403).json({ error: "Admin only" });
      const report = await runRewardsDiagnostics();
      res.json(report);
    } catch (err) {
      console.error("GET /api/admin/diag/rewards error", err);
      res.status(500).json({ error: "Diagnostics failed" });
    }
  });
}
