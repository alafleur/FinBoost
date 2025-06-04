import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }
      
      const user = await storage.createUser({ username, email, password });
      res.json({ success: true, message: "User created successfully", user: { id: user.id, username: user.username, email: user.email } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Generate token
      const token = await storage.generateToken(user.id);
      
      res.json({ 
        success: true, 
        message: "Login successful", 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          isAdmin: user.email === 'lafleur.andrew@gmail.com' // Admin check by email
        },
        token 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          points: user.currentMonthPoints || 0,
          tier: user.tier,
          isAdmin: user.email === 'lafleur.andrew@gmail.com'
        } 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Points routes
  app.get("/api/points/actions", async (req, res) => {
    try {
      const actions = await storage.getPointActions();
      res.json({ success: true, actions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // User progress routes
  app.get("/api/user/progress", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const progress = await storage.getUserProgress(user.id);
      res.json({ success: true, progress, completedCount: progress.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Pool routes
  app.get("/api/pool/monthly", async (req, res) => {
    try {
      const pool = await storage.getMonthlyPool();
      res.json({ success: true, pool });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/pool/next-distribution", async (req, res) => {
    try {
      const distribution = await storage.getNextDistribution();
      res.json({ success: true, distribution });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Tier routes
  app.get("/api/tiers/thresholds", async (req, res) => {
    try {
      const thresholds = await storage.getTierThresholds();
      res.json({ success: true, thresholds });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json({ success: true, leaderboard });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const analytics = await storage.getAdminAnalytics();
      res.json({ success: true, analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/admin/modules", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const modules = await storage.getAllModules();
      res.json({ success: true, modules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}