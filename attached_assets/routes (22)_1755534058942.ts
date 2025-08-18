// server/routes.ts
// Consolidated rewards endpoint with explicit no-store caching headers.

import type { Express, Request, Response } from "express";
import { authenticateToken } from "./middleware"; // adjust path to your project
import { getRewardsHistoryForUser } from "./storage";

export function registerRewardsRoutes(app: Express) {
  app.get("/api/rewards/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      res.set("Cache-Control", "no-store");
      if (!userId) return res.json({ summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] });
      const data = await getRewardsHistoryForUser(Number(userId));
      res.json(data);
    } catch (err) {
      console.error("GET /api/rewards/history error", err);
      res.status(500).json({ error: "Failed to load rewards history" });
    }
  });

  // Back-compat alias
  app.get("/api/cycles/rewards/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      res.set("Cache-Control", "no-store");
      if (!userId) return res.json({ summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] });
      const data = await getRewardsHistoryForUser(Number(userId));
      res.json(data);
    } catch (err) {
      console.error("GET /api/cycles/rewards/history error", err);
      res.status(500).json({ error: "Failed to load rewards history" });
    }
  });
}
