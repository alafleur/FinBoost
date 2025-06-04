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
      const users = await storage.getAllUsers();
      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/admin/modules", async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json({ success: true, modules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin module management routes
  app.post("/api/admin/modules", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleData = req.body;
      const module = await storage.createModule(moduleData);
      res.json({ success: true, module });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put("/api/admin/modules/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleId = parseInt(req.params.id);
      const moduleData = req.body;
      const module = await storage.updateModule(moduleId, moduleData);
      res.json({ success: true, module });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete("/api/admin/modules/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleId = parseInt(req.params.id);
      await storage.deleteModule(moduleId);
      res.json({ success: true, message: "Module deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin user management routes
  app.post("/api/admin/users", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userData = req.body;
      const newUser = await storage.createUser(userData);
      res.json({ success: true, user: newUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      const userData = req.body;
      const updatedUser = await storage.updateUser(userId, userData);
      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin points management routes
  app.post("/api/admin/points/award", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, points, reason } = req.body;
      await storage.awardPoints(userId, points, 'admin-award', reason);
      res.json({ success: true, message: "Points awarded successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/points/deduct", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, points, reason } = req.body;
      await storage.deductPoints(userId, points, 'admin-deduction', reason);
      res.json({ success: true, message: "Points deducted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin rewards configuration routes
  app.post("/api/admin/rewards/config", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const config = req.body;
      await storage.updateRewardsConfig(config);
      res.json({ success: true, message: "Rewards configuration updated" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/rewards/distribute", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { month } = req.body;
      const result = await storage.executeMonthlyDistribution(month);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}