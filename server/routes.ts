import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Authentication middleware
const authenticateToken = async (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

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

  // User Registration
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          success: false,
          message: validationError.message 
        });
      }

      const userData = result.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "User with this email already exists" 
        });
      }

      // Create user
      const user = await storage.createUser(userData);
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({ 
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          totalPoints: user.totalPoints,
          currentMonthPoints: user.currentMonthPoints,
          tier: user.tier
        }
      });
    } catch (error) {
      console.error("Error in register endpoint:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred during registration." 
      });
    }
  });

  // User Login
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const result = loginUserSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          success: false,
          message: validationError.message 
        });
      }

      const { email, password } = result.data;
      
      // Validate credentials
      const user = await storage.validatePassword(email, password);
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid email or password" 
        });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({ 
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          totalPoints: user.totalPoints,
          currentMonthPoints: user.currentMonthPoints,
          tier: user.tier
        }
      });
    } catch (error) {
      console.error("Error in login endpoint:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred during login." 
      });
    }
  });

  // Get current user profile (protected route)
  apiRouter.get("/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      return res.status(200).json({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          totalPoints: user.totalPoints,
          currentMonthPoints: user.currentMonthPoints,
          tier: user.tier,
          joinedAt: user.joinedAt,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      console.error("Error in me endpoint:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while fetching user profile." 
      });
    }
  });

  // Register API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
