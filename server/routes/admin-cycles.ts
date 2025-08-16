import type { Express, Request, Response } from "express";
import { storage } from "../storage";

export function registerAdminCyclesRoutes(app: Express) {
  app.get("/api/admin/cycles", async (_req: Request, res: Response) => {
    try {
      const rows = await (storage as any).getAllCycles?.();
      res.json(rows || []);
    } catch (e) {
      console.error("[CYCLES] list failed", e);
      res.json([]);
    }
  });
}