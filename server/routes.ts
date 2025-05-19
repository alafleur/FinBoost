import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create API routes
  const apiRouter = express.Router();
  
  // Subscribe to waitlist endpoint
  apiRouter.post("/subscribe", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const result = insertSubscriberSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          success: false,
          message: validationError.message 
        });
      }
      
      const { email } = result.data;
      
      // Check if email already exists
      const existingSubscriber = await storage.getSubscriberByEmail(email);
      
      if (existingSubscriber) {
        return res.status(200).json({ 
          success: true,
          message: "You're already on the waitlist!" 
        });
      }
      
      // Create new subscriber
      await storage.createSubscriber({ email });
      
      return res.status(201).json({ 
        success: true,
        message: "Successfully joined the waitlist!" 
      });
    } catch (error) {
      console.error("Error in subscribe endpoint:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while processing your request." 
      });
    }
  });
  
  // Get all subscribers (for admin purposes, would require auth in production)
  apiRouter.get("/subscribers", async (_req: Request, res: Response) => {
    try {
      const subscribers = await storage.getAllSubscribers();
      return res.status(200).json({ subscribers });
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      return res.status(500).json({ 
        message: "An error occurred while fetching subscribers." 
      });
    }
  });
  
  // Get subscriber count 
  apiRouter.get("/subscribers/count", async (_req: Request, res: Response) => {
    try {
      const count = await storage.getSubscribersCount();
      return res.status(200).json({ count });
    } catch (error) {
      console.error("Error fetching subscriber count:", error);
      return res.status(500).json({ 
        message: "An error occurred while fetching subscriber count." 
      });
    }
  });

  // Register API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
