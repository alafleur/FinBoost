// server/routes.ts
// New consolidated rewards endpoint + alias (Express).
// Merge into your routes file. Requires an auth middleware or token parsing function.

import type { Express, Request, Response } from "express";
import { authenticateToken } from "./middleware"; // adjust import to your project
import { getRewardsHistoryForUser } from "./storage";

export function registerRewardsRoutes(app: Express) {
  // Primary endpoint used by the client
  app.get("/api/rewards/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.json({ summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] });
      const data = await getRewardsHistoryForUser(Number(userId));
      res.json(data);
    } catch (err) {
      console.error("GET /api/rewards/history error", err);
      res.status(500).json({ error: "Failed to load rewards history" });
    }
  });

  // Backward-compat alias to keep existing clients working if any:
  app.get("/api/cycles/rewards/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.json([]);
      const data = await getRewardsHistoryForUser(Number(userId));
      // Older clients expected a plain list; preserve compatibility by returning items only if needed:
      res.json(data);
    } catch (err) {
      console.error("GET /api/cycles/rewards/history error", err);
      res.status(500).json({ error: "Failed to load cycle rewards history" });
    }
  });
}
