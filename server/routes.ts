import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { findBestContent, fallbackContent } from "./contentDatabase";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, ordersController } from "./paypal";
import { User, users, paypalPayouts, winnerSelectionCycles, winnerSelections, winnerAllocationTemplates } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-30.basil",
  });
}

// JWT Helper function
async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
    const user = await storage.getUserById(decoded.userId);
    return user;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

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

      const user = await storage.createUser({ 
        username, 
        email, 
        password,
        subscriptionStatus: 'inactive' // All new users start as free
      });

      // Automatically generate token and log in the user
      const token = await storage.generateToken(user.id);
      
      res.json({ 
        success: true, 
        message: "User created successfully", 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          isAdmin: user.isAdmin || user.email === 'lafleur.andrew@gmail.com'
        },
        token 
      });
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
          isAdmin: user.isAdmin || user.email === 'lafleur.andrew@gmail.com' // Admin check by database field or original admin email
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
          firstName: user.firstName,
          lastName: user.lastName,
          totalPoints: user.totalPoints || 0,
          currentMonthPoints: user.currentMonthPoints || 0,
          tier: user.tier,
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0,
          subscriptionStatus: user.subscriptionStatus || 'inactive',
          theoreticalPoints: user.theoreticalPoints || 0,
          isAdmin: user.isAdmin || user.email === 'lafleur.andrew@gmail.com'
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
      // Only return published actions for regular users
      const publishedActions = actions.filter(action => action.isActive);
      res.json({ success: true, actions: publishedActions });
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
      // Always calculate fresh distribution data for real-time countdown
      const distribution = await storage.getNextDistribution();
      res.json({ success: true, distribution });
    } catch (error: any) {
      console.error('Error getting next distribution:', error);
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

  // Get current rewards configuration
  app.get('/api/rewards/config', async (req, res) => {
    try {
      // For now, return the hardcoded admin configuration
      // In a full implementation, this would come from a database table
      // storing the admin's current configuration
      res.json({
        success: true,
        config: {
          tierAllocations: {
            tier1: 20,  // tier 1 (lowest) gets 20%
            tier2: 30,  // tier 2 (middle) gets 30%
            tier3: 50   // tier 3 (highest) gets 50%
          }
        }
      });
    } catch (error) {
      console.error('Error fetching rewards config:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch rewards configuration' });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const period = req.query.period as string || 'monthly';
      const limit = parseInt(req.query.limit as string) || 50;

      // Get the requested leaderboard
      const leaderboard = await storage.getLeaderboard(period === 'monthly' ? 'monthly' : 'allTime', limit);
      
      // Get current user's rank
      const userRank = await storage.getUserRank(user.id, period === 'monthly' ? 'monthly' : 'allTime');

      // For Dashboard sidebar compatibility, return data in expected format
      if (!req.query.period && !req.query.limit) {
        // This is likely a Dashboard sidebar request, return both monthly and all-time
        const monthlyLeaderboard = await storage.getLeaderboard('monthly', 50);
        const allTimeLeaderboard = await storage.getLeaderboard('allTime', 50);
        const monthlyUserRank = await storage.getUserRank(user.id, 'monthly');

        return res.json({
          success: true,
          leaderboard: monthlyLeaderboard,
          currentUser: monthlyUserRank || { rank: null, points: 0, tier: 'tier3', username: user.username, id: user.id },
          monthly: monthlyLeaderboard,
          allTime: allTimeLeaderboard
        });
      }

      // For specific period requests (from Leaderboard component)
      res.json({
        success: true,
        leaderboard: leaderboard,
        currentUser: userRank || { rank: null, points: 0, tier: 'tier3' }
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
    }
  });

  // Get expanded leaderboard (all premium members)
  app.get("/api/leaderboard/expanded", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const timeFilter = req.query.timeFilter as string || 'monthly';
      const search = req.query.search as string || '';
      const page = parseInt(req.query.page as string) || 1;

      const users = await storage.getExpandedLeaderboard(timeFilter, page, search);

      res.json({
        success: true,
        users: users,
        totalCount: users.length
      });
    } catch (error) {
      console.error('Error fetching expanded leaderboard:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch expanded leaderboard' });
    }
  });

  // User stats for leaderboard
  app.get("/api/leaderboard/user-stats", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const user = await storage.validateToken(token);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const { timeFilter = 'month' } = req.query;
      const userStats = await storage.getUserLeaderboardStats(user.id, timeFilter as string);
      res.json({ success: true, currentUser: userStats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/subscribers", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const subscribers = await storage.getAllSubscribers();
      res.json({ success: true, subscribers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

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

  app.get("/api/modules", async (req, res) => {
    try {
      const modules = await storage.getPublishedModules();
      res.json({ success: true, modules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Lesson completion endpoint
  app.post("/api/lessons/:id/complete", async (req, res) => {
    try {
      const lessonId = req.params.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const user = await storage.validateToken(token);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const result = await storage.markLessonComplete(user.id, lessonId);
      res.json({ 
        success: true, 
        pointsEarned: result.pointsEarned,
        streakBonus: result.streakBonus,
        newStreak: result.newStreak
      });
    } catch (error: any) {
      console.error('Lesson completion error:', error);
      if (error.message.includes('already completed')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin module management routes
  app.post("/api/admin/modules", async (req, res) => {
    try {
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

  app.patch("/api/admin/modules/:id/publish", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const { isPublished } = req.body;

      // If publishing a module, auto-populate content if it's empty
      if (isPublished) {
        await autoPopulateModuleContent(moduleId);
      }

      const module = await storage.toggleModulePublish(moduleId, isPublished);
      res.json({ success: true, module });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Bulk auto-populate all published modules
  app.post("/api/admin/modules/auto-populate", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allModules = await storage.getAllModules();
      let populatedCount = 0;

      for (const module of allModules) {
        if (module.isPublished && (!module.content || !module.quiz)) {
          await autoPopulateModuleContent(module.id);
          populatedCount++;
        }
      }

      res.json({ 
        success: true, 
        message: `Auto-populated ${populatedCount} modules with educational content` 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Helper function to auto-populate module content
  async function autoPopulateModuleContent(moduleId: number) {
    const currentModule = await storage.getModuleById(moduleId);
    console.log(`Auto-population check for module ${moduleId}:`, {
      title: currentModule?.title,
      hasContent: !!currentModule?.content,
      hasQuiz: !!currentModule?.quiz,
      category: currentModule?.category
    });

    if (currentModule && (!currentModule.content || !currentModule.quiz)) {
      // Find matching content from database
      const contentTemplate = findBestContent(
        currentModule.title, 
        currentModule.description || '', 
        currentModule.category
      ) || fallbackContent;

      console.log(`Found content template:`, {
        templateFound: !!contentTemplate,
        contentLength: contentTemplate?.content?.length,
        quizQuestions: contentTemplate?.quiz?.length
      });

      // Update module with auto-populated content
      await storage.updateModule(moduleId, {
        ...currentModule,
        content: currentModule.content || contentTemplate.content,
        quiz: currentModule.quiz || JSON.stringify(contentTemplate.quiz)
      });

      console.log(`Module ${moduleId} updated with auto-populated content`);
    }
  }

  // Admin proof review routes
  app.get("/api/admin/pending-proofs", async (req, res) => {
    try {
      const proofs = await storage.getPendingProofUploads();
      res.json({ success: true, proofs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/approve-proof/:id", async (req, res) => {
    try {
      const proofId = parseInt(req.params.id);
      // For admin approval, we'll use a placeholder admin ID (1)
      await storage.approveProofUpload(proofId, 1);
      res.json({ success: true, message: "Proof approved and points awarded" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/reject-proof/:id", async (req, res) => {
    try {
      const proofId = parseInt(req.params.id);
      const { reason } = req.body;
      // For admin rejection, we'll use a placeholder admin ID (1)
      await storage.rejectProofUpload(proofId, 1, reason || "Does not meet requirements");
      res.json({ success: true, message: "Proof rejected" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Points submission route
  app.post("/api/points/submit-proof", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const user = await storage.validateToken(token);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const { actionId, description, proofUrl } = req.body;

      // Get the action configuration to determine points
      const actions = await storage.getPointActions();
      const action = actions.find(a => a.id === actionId);

      if (!action) {
        return res.status(400).json({ success: false, message: "Invalid action" });
      }

      // Submit proof for review
      const historyEntry = await storage.awardPointsWithProof(
        user.id,
        actionId,
        action.basePoints,
        description,
        proofUrl
      );

      res.json({ 
        success: true, 
        message: "Proof submitted for review",
        historyEntry 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin user management routes
  app.post("/api/admin/users", async (req, res) => {
    try {
      const userData = req.body;
      const newUser = await storage.createUser(userData);
      res.json({ success: true, user: newUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    try {
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
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin points actions management routes
  app.get("/api/admin/points/actions", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const actions = await storage.getPointActions();
      res.json({ success: true, actions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/points/actions", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const action = await storage.createOrUpdatePointAction(req.body, user.id);
      res.json({ success: true, action });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put("/api/admin/points/actions/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const actionId = parseInt(req.params.id);
      const action = await storage.updatePointAction(actionId, req.body, user.id);
      res.json({ success: true, action });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete("/api/admin/points/actions/:actionId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deletePointAction(req.params.actionId);
      res.json({ success: true, message: "Action deleted successfully" });
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

  // Referral API endpoints
  app.get("/api/referrals/my-code", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Get or create referral code
      let referralCode = await storage.getUserReferralCode(user.id);
      if (!referralCode) {
        referralCode = await storage.createUserReferralCode(user.id);
      }

      // Get referral stats
      const stats = await storage.getReferralStats(user.id);

      res.json({ 
        success: true, 
        referralCode: referralCode.referralCode,
        stats 
      });
    } catch (error: any) {
      console.error('Error getting referral code:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/referrals/history", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const referrals = await storage.getUserReferrals(user.id);

      res.json({ 
        success: true, 
        referrals: referrals.map(r => ({
          id: r.referral.id,
          referredUser: r.referredUser,
          status: r.referral.status,
          pointsAwarded: r.referral.pointsAwarded,
          completedAt: r.referral.completedAt,
          createdAt: r.referral.createdAt
        }))
      });
    } catch (error: any) {
      console.error('Error getting referral history:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Points history API endpoint
  app.get("/api/points/history", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const history = await storage.getUserPointsHistory(user.id);

      res.json({ 
        success: true, 
        history:<replit_final_file>
 history.map(h => ({
          id: h.id,
          points: h.points,
          action: h.action,
          description: h.description,
          status: 'approved',
          createdAt: h.createdAt,
          metadata: {}
        }))
      });
    } catch (error: any) {
      console.error('Error getting points history:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Rewards history API endpoint
  app.get("/api/rewards/history", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const history = await storage.getUserMonthlyRewardsHistory(user.id);

      res.json({ 
        success: true, 
        history: history.map(h => ({
          id: h.id,
          month: h.monthlyRewardId,
          tier: h.tier,
          pointsAtDistribution: h.pointsAtDistribution,
          rewardAmount: h.rewardAmount,
          pointsDeducted: h.pointsDeducted,
          pointsRolledOver: h.pointsRolledOver,
          isWinner: h.isWinner,
          createdAt: h.createdAt
        }))
      });
    } catch (error: any) {
      console.error('Error getting rewards history:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Support ticket routes
  app.post("/api/support", async (req, res) => {
    try {
      const { name, email, category, message, hasAttachment, fileName } = req.body;

      let userId = null;
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const user = await storage.getUserByToken(token);
        if (user) {
          userId = user.id;
        }
      }

      const supportRequest = await storage.createSupportRequest({
        userId,
        name,
        email,
        category,
        message,
        hasAttachment: hasAttachment || false,
        fileName: fileName || null
      });

      res.json({ success: true, supportRequest });
    } catch (error: any) {
      console.error('Error creating support request:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin support ticket routes
  app.get("/api/admin/support", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tickets = await storage.getSupportRequests({});
      res.json({ success: true, tickets });
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch("/api/admin/support/:ticketId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const ticketId = parseInt(req.params.ticketId);
      const { response, status, resolvedAt } = req.body;

      await storage.updateSupportRequest(ticketId, {
        response,
        status,
        resolvedAt: resolvedAt ? new Date(resolvedAt) : null
      });

      res.json({ success: true, message: "Support ticket updated successfully" });
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Removed duplicate session-based subscription endpoint - using token-based version below

  // Get subscription status
  app.get('/api/subscription/status', async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        subscription: {
          status: user.subscriptionStatus || 'inactive',
          subscriptionId: user.stripeSubscriptionId,
          nextBillingDate: user.nextBillingDate
        }
      });
    } catch (error: any) {
      console.error('Error getting subscription status:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!stripe) {
      return res.status(500).json({ success: false, message: "Stripe not configured" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ success: false, message: "No active subscription found" });
      }

      await stripe.subscriptions.cancel(user.stripeSubscriptionId);

      await storage.updateUser(user.id, {
        subscriptionStatus: 'canceled'
      });

      res.json({ success: true, message: "Subscription canceled successfully" });
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Stripe webhook handler
  app.post('/webhook/stripe', async (req, res) => {
    if (!stripe) {
      return res.status(500).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (!sig) {
        throw new Error('No stripe signature found');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as any;

          if (invoice.subscription) {
            // Get subscription and customer details
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const customer = await stripe.customers.retrieve(subscription.customer as string);

            if (!customer || customer.deleted) break;

            const userId = (customer as any).metadata?.userId;
            if (userId) {
              // Update user subscription status
              await storage.updateUser(parseInt(userId), {
                subscriptionStatus: 'active',
                nextBillingDate: new Date(subscription.current_period_end * 1000)
              });

              // Get current pool settings for dynamic percentage calculation
              const poolSettings = await storage.getCurrentPoolSettingsForDate(new Date());
              if (poolSettings) {
                const membershipFeeInDollars = poolSettings.membershipFee / 100;
                const rewardAmount = Math.round((membershipFeeInDollars * poolSettings.rewardPoolPercentage / 100) * 100);
                await storage.addToRewardPool(rewardAmount);

                console.log(`Payment succeeded for user ${userId}, added $${rewardAmount/100} (${poolSettings.rewardPoolPercentage}% of $${membershipFeeInDollars}) to reward pool`);
              } else {
                // Fallback to default settings
                const rewardAmount = Math.round(20 * 0.55 * 100); // $11 in cents
                await storage.addToRewardPool(rewardAmount);
                console.log(`Payment succeeded for user ${userId}, added $11 (default 55% of $20) to reward pool`);
              }
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as any;

          if (failedInvoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
            const customer = await stripe.customers.retrieve(subscription.customer as string);

            if (!customer || customer.deleted) break;

            const userId = (customer as any).metadata?.userId;
            if (userId) {
              await storage.updateUser(parseInt(userId), {
                subscriptionStatus: 'past_due'
              });

              console.log(`Payment failed for user ${userId}`);
            }
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as any;
          const customer = await stripe.customers.retrieve(deletedSubscription.customer);

          if (!customer || customer.deleted) break;

          const userId = (customer as any).metadata?.userId;
          if (userId) {
            await storage.updateUser(parseInt(userId), {
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null
            });

            console.log(`Subscription canceled for user ${userId}`);
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || (!user.isAdmin && user.email !== 'lafleur.andrew@gmail.com')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Monthly pool settings routes (admin only)
  app.get("/api/admin/monthly-pool-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllMonthlyPoolSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching monthly pool settings:', error);
      res.status(500).json({ message: "Error fetching monthly pool settings" });
    }
  });

  app.post("/api/admin/monthly-pool-settings", requireAdmin, async (req, res) => {
    try {
      const { cycleName, cycleStartDate, cycleEndDate, rewardPoolPercentage, membershipFee } = req.body;

      const newSetting = await storage.createMonthlyPoolSetting({
        cycleName,
        cycleStartDate: new Date(cycleStartDate),
        cycleEndDate: new Date(cycleEndDate),
        rewardPoolPercentage: parseInt(rewardPoolPercentage),
        membershipFee: parseInt(membershipFee),
        createdBy: req.user?.id
      });

      res.json(newSetting);
    } catch (error) {
      console.error('Error creating monthly pool setting:', error);
      res.status(500).json({ message: "Error creating monthly pool setting" });
    }
  });

  app.put("/api/admin/monthly-pool-settings/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { cycleName, cycleStartDate, cycleEndDate, rewardPoolPercentage, membershipFee, isActive } = req.body;

      const updates: any = {};
      if (cycleName) updates.cycleName = cycleName;
      if (cycleStartDate) updates.cycleStartDate = new Date(cycleStartDate);
      if (cycleEndDate) updates.cycleEndDate = new Date(cycleEndDate);
      if (rewardPoolPercentage !== undefined) updates.rewardPoolPercentage = parseInt(rewardPoolPercentage);
      if (membershipFee !== undefined) updates.membershipFee = parseInt(membershipFee);
      if (isActive !== undefined) updates.isActive = isActive;

      const updated = await storage.updateMonthlyPoolSetting(parseInt(id), updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating monthly pool setting:', error);
      res.status(500).json({ message: "Error updating monthly pool setting" });
    }
  });

  app.get("/api/admin/current-pool-settings", requireAdmin, async (req, res) => {
    try {
      const currentSettings = await storage.getCurrentPoolSettingsForDate(new Date());
      res.json(currentSettings);
    } catch (error) {
      console.error('Error fetching current pool settings:', error);
      res.status(500).json({ message: "Error fetching current pool settings" });
    }
  });

  // User subscription status management
  app.patch("/api/admin/users/:id/subscription", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { subscriptionStatus } = req.body;

      const updatedUser = await storage.updateUser(parseInt(id), { subscriptionStatus });
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user subscription status:', error);
      res.status(500).json({ message: "Error updating subscription status" });
    }
  });

  // Demo upgrade to premium route
  app.post("/api/upgrade-to-premium", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Update user subscription status to active
      const updatedUser = await storage.updateUser(user.id, {
        subscriptionStatus: 'active',
        stripeCustomerId: 'demo_customer_' + user.id,
        stripeSubscriptionId: 'demo_subscription_' + user.id,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      res.json({ 
        success: true, 
        message: "Successfully upgraded to premium",
        user: updatedUser
      });
    } catch (error: any) {
      console.error('Premium upgrade error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Stripe subscription routes
  app.post("/api/create-subscription", async (req, res) => {
    try {
      if (!stripe) {
        console.error('Stripe not configured - missing STRIPE_SECRET_KEY');
        return res.status(500).json({ error: { message: "Stripe not configured" } });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      console.log('Token received:', token ? 'Present' : 'Missing');
      
      if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      const user = await storage.getUserByToken(token);
      console.log('User lookup result:', user ? `Found user ${user.id}` : 'No user found');
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication failed" });
      }

      // Check if user already has an active subscription
      if (user.subscriptionStatus === 'active') {
        return res.status(400).json({ error: { message: "User already has an active subscription" } });
      }

      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeCustomerId(user.id, stripeCustomerId);
      }

      // Create subscription with immediate payment intent creation
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Store subscription ID
      await storage.updateUserStripeSubscriptionId(user.id, subscription.id);

      // Extract or create client secret for payment
      let clientSecret = null;
      const subInvoice = subscription.latest_invoice as any;
      
      if (subInvoice?.payment_intent?.client_secret) {
        clientSecret = subInvoice.payment_intent.client_secret;
      } else {
        // Create a standalone payment intent for the subscription amount
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 2000, // $20.00 in cents
          currency: 'usd',
          customer: stripeCustomerId,
          metadata: {
            subscription_id: subscription.id,
            user_id: user.id.toString()
          }
        });
        clientSecret = paymentIntent.client_secret;
      }

      console.log('Subscription created:', {
        subscriptionId: subscription.id,
        clientSecret: clientSecret ? 'Present' : 'Missing'
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Stripe webhook to handle subscription events
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

            // Find user by Stripe customer ID
            const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
            if (user) {
              // Update user subscription status to active
              await storage.updateUserSubscriptionStatus(user.id, 'active');

              // Convert theoretical points to real points
              if (user.theoreticalPoints > 0) {
                await storage.convertTheoreticalPoints(user.id);
              }

              console.log(`✅ User ${user.id} subscription activated`);
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as any;
          if (failedInvoice.subscription) {
            const failedSubscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);

            const failedUser = await storage.getUserByStripeCustomerId(failedSubscription.customer as string);
            if (failedUser) {
              await storage.updateUserSubscriptionStatus(failedUser.id, 'inactive');
              console.log(`❌ User ${failedUser.id} subscription payment failed`);
            }
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as any;
          const canceledUser = await storage.getUserByStripeCustomerId(deletedSubscription.customer as string);
          if (canceledUser) {
            await storage.updateUserSubscriptionStatus(canceledUser.id, 'inactive');
            console.log(`🚫 User ${canceledUser.id} subscription canceled`);
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PayPal routes
  app.get("/api/paypal/setup", loadPaypalDefault);
  app.post("/api/paypal/order", authenticateToken, createPaypalOrder);
  app.post("/api/paypal/order/:orderID/capture", authenticateToken, capturePaypalOrder);
  
  // Legacy PayPal routes for backward compatibility
  app.get("/setup", loadPaypalDefault);
  app.post("/order", createPaypalOrder);
  app.post("/order/:orderID/capture", capturePaypalOrder);

  // PayPal subscription integration
  app.post("/api/paypal/create-order", authenticateToken, async (req, res) => {
    try {
      const { amount, currency, intent } = req.body;
      const user = req.user as User;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount. Amount must be a positive number."
        });
      }

      const collect = {
        body: {
          intent: intent || "CAPTURE",
          purchaseUnits: [{
            amount: {
              currencyCode: currency || "USD",
              value: amount.toString()
            },
            description: "FinBoost Premium Subscription"
          }],
          applicationContext: {
            returnUrl: `${req.protocol}://${req.get('host')}/api/paypal/success`,
            cancelUrl: `${req.protocol}://${req.get('host')}/subscribe`
          }
        },
        prefer: "return=representation"
      };

      const { body, ...httpResponse } = await ordersController.createOrder(collect);
      const jsonResponse = JSON.parse(String(body));

      if (httpResponse.statusCode === 201) {
        // Store order ID with user for later verification
        await storage.updateUserPayPalOrderId(user.id, jsonResponse.id);
        
        const approvalUrl = jsonResponse.links.find((link: any) => link.rel === "approve")?.href;
        
        res.json({
          success: true,
          orderId: jsonResponse.id,
          approvalUrl
        });
      } else {
        res.status(httpResponse.statusCode).json({
          success: false,
          error: "Failed to create PayPal order"
        });
      }
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create PayPal order"
      });
    }
  });

  app.post("/api/paypal/capture-order/:orderID", authenticateToken, async (req, res) => {
    try {
      const { orderID } = req.params;
      const user = req.user as User;

      const collect = {
        id: orderID,
        prefer: "return=representation"
      };

      const { body, ...httpResponse } = await ordersController.captureOrder(collect);
      const jsonResponse = JSON.parse(String(body));

      if (httpResponse.statusCode === 201 && jsonResponse.status === "COMPLETED") {
        // Update user to premium status
        await storage.updateUserMembershipStatus(user.id, true, "paypal");
        
        res.json({
          success: true,
          message: "Payment captured successfully"
        });
      } else {
        res.status(httpResponse.statusCode).json({
          success: false,
          error: "Failed to capture PayPal payment"
        });
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to capture PayPal payment"
      });
    }
  });

  app.get("/api/paypal/success", async (req, res) => {
    const { token } = req.query; // PayPal returns token (order ID)
    if (token) {
      res.redirect(`/subscribe?paypal_success=${token}`);
    } else {
      res.redirect('/subscribe?paypal_error=invalid_token');
    }
  });

  // PayPal subscription route for membership
  app.post("/api/paypal/create-subscription", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Check if user already has an active subscription
      if (user.subscriptionStatus === 'active') {
        return res.status(400).json({ error: { message: "User already has an active subscription" } });
      }

      // For PayPal subscriptions, we'll use a one-time payment approach
      // Since PayPal subscriptions require more complex setup
      res.json({
        success: true,
        message: "PayPal subscription setup initiated",
        amount: "20.00", // $20 membership fee
        currency: "USD"
      });
    } catch (error: any) {
      console.error('Error creating PayPal subscription:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Helper function for tier distribution calculation
  function calculateTierDistribution(users: any[]) {
    // Sort users by current month points (descending)
    const sortedUsers = users.sort((a, b) => b.currentMonthPoints - a.currentMonthPoints);
    
    // Divide into three tiers
    const totalUsers = sortedUsers.length;
    const tier1Count = Math.ceil(totalUsers / 3); // Top third
    const tier2Count = Math.ceil((totalUsers - tier1Count) / 2); // Middle third
    const tier3Count = totalUsers - tier1Count - tier2Count; // Bottom third
    
    const tier1Users = sortedUsers.slice(0, tier1Count);
    const tier2Users = sortedUsers.slice(tier1Count, tier1Count + tier2Count);
    const tier3Users = sortedUsers.slice(tier1Count + tier2Count);
    
    // Get current pool settings (simplified calculation)
    const averageMonthlyFee = 2000; // $20 in cents
    const totalMonthlyRevenue = totalUsers * averageMonthlyFee;
    const rewardPoolPercentage = 50; // 50% goes to rewards
    const totalRewardPool = Math.floor(totalMonthlyRevenue * (rewardPoolPercentage / 100));
    
    // Pool distribution: Tier 1 (50%), Tier 2 (35%), Tier 3 (15%)
    const tier1Pool = Math.floor(totalRewardPool * 0.5);
    const tier2Pool = Math.floor(totalRewardPool * 0.35);
    const tier3Pool = totalRewardPool - tier1Pool - tier2Pool;
    
    // Calculate individual rewards (50% of each tier gets rewards)
    const tier1Winners = Math.floor(tier1Count * 0.5) || 1;
    const tier2Winners = Math.floor(tier2Count * 0.5) || 1;
    const tier3Winners = Math.floor(tier3Count * 0.5) || 1;
    
    const tier1Reward = tier1Winners > 0 ? Math.floor(tier1Pool / tier1Winners) : 0;
    const tier2Reward = tier2Winners > 0 ? Math.floor(tier2Pool / tier2Winners) : 0;
    const tier3Reward = tier3Winners > 0 ? Math.floor(tier3Pool / tier3Winners) : 0;
    
    // Create payout list with selected winners (simplified: top performers from each tier)
    const payouts = [
      ...tier1Users.slice(0, tier1Winners).map(user => ({
        ...user,
        tier: 'gold',
        rewardAmount: tier1Reward,
        selected: true
      })),
      ...tier2Users.slice(0, tier2Winners).map(user => ({
        ...user,
        tier: 'silver',
        rewardAmount: tier2Reward,
        selected: true
      })),
      ...tier3Users.slice(0, tier3Winners).map(user => ({
        ...user,
        tier: 'bronze',
        rewardAmount: tier3Reward,
        selected: true
      }))
    ];
    
    return {
      totalPool: totalRewardPool,
      tiers: {
        tier1: { users: tier1Users, pool: tier1Pool, winners: tier1Winners, rewardPerWinner: tier1Reward },
        tier2: { users: tier2Users, pool: tier2Pool, winners: tier2Winners, rewardPerWinner: tier2Reward },
        tier3: { users: tier3Users, pool: tier3Pool, winners: tier3Winners, rewardPerWinner: tier3Reward }
      },
      payouts
    };
  }

  // PayPal Disbursement Routes
  app.post("/api/admin/disbursements/calculate", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Get all premium users with points
      const premiumUsers = await storage.getPremiumUsersForRewards();
      
      // Calculate tier distributions based on current month points
      const tierDistribution = calculateTierDistribution(premiumUsers);
      
      res.json({
        success: true,
        totalUsers: premiumUsers.length,
        tierDistribution,
        estimatedPayouts: tierDistribution.payouts
      });
    } catch (error) {
      console.error("Error calculating disbursements:", error);
      res.status(500).json({ error: "Failed to calculate disbursements" });
    }
  });

  app.post("/api/admin/disbursements/process", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { selectedUsers, totalAmount } = req.body;

      if (!selectedUsers || selectedUsers.length === 0) {
        return res.status(400).json({ error: "No users selected for disbursement" });
      }

      // Prepare PayPal payout recipients
      const recipients = selectedUsers.map((user: any) => ({
        email: user.paypalEmail || user.email,
        amount: user.rewardAmount, // Amount in cents
        currency: "USD",
        note: `FinBoost ${user.tier} tier reward for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        recipientId: `user_${user.id}_${Date.now()}`
      }));

      // Create PayPal batch payout
      const { createPaypalPayout } = await import('./paypal');
      const payoutResult = await createPaypalPayout(recipients);

      // Save payout records to database
      const payoutPromises = selectedUsers.map(async (user: any, index: number) => {
        return db.insert(paypalPayouts).values({
          userId: user.id,
          paypalPayoutId: payoutResult.batch_header?.payout_batch_id,
          paypalItemId: payoutResult.items?.[index]?.payout_item_id,
          recipientEmail: user.paypalEmail || user.email,
          amount: user.rewardAmount,
          currency: "usd",
          status: "pending",
          reason: "monthly_reward",
          tier: user.tier,
          pointsUsed: user.currentMonthPoints,
          processedAt: new Date(),
          paypalResponse: JSON.stringify(payoutResult)
        });
      });

      await Promise.all(payoutPromises);

      res.json({
        success: true,
        batchId: payoutResult.batch_header?.payout_batch_id,
        message: `Successfully initiated payouts to ${selectedUsers.length} users`,
        totalAmount: totalAmount
      });
    } catch (error) {
      console.error("Error processing disbursements:", error);
      res.status(500).json({ error: "Failed to process disbursements" });
    }
  });

  app.get("/api/admin/disbursements/history", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const payouts = await db
        .select({
          id: paypalPayouts.id,
          userId: paypalPayouts.userId,
          recipientEmail: paypalPayouts.recipientEmail,
          amount: paypalPayouts.amount,
          currency: paypalPayouts.currency,
          status: paypalPayouts.status,
          reason: paypalPayouts.reason,
          tier: paypalPayouts.tier,
          processedAt: paypalPayouts.processedAt,
          createdAt: paypalPayouts.createdAt,
          username: users.username,
          email: users.email
        })
        .from(paypalPayouts)
        .leftJoin(users, eq(paypalPayouts.userId, users.id))
        .orderBy(desc(paypalPayouts.createdAt))
        .limit(100);

      res.json({ success: true, payouts });
    } catch (error) {
      console.error("Error fetching disbursement history:", error);
      res.status(500).json({ error: "Failed to fetch disbursement history" });
    }
  });

  app.post("/api/user/paypal-email", authenticateToken, async (req, res) => {
    try {
      const { paypalEmail } = req.body;
      const userId = req.user.id;

      if (!paypalEmail || !paypalEmail.includes("@")) {
        return res.status(400).json({ error: "Valid PayPal email required" });
      }

      await db.update(users)
        .set({ paypalEmail })
        .where(eq(users.id, userId));

      res.json({ success: true, message: "PayPal email updated successfully" });
    } catch (error) {
      console.error("Error updating PayPal email:", error);
      res.status(500).json({ error: "Failed to update PayPal email" });
    }
  });

  app.get("/api/user/payouts", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

      const userPayouts = await db
        .select()
        .from(paypalPayouts)
        .where(eq(paypalPayouts.userId, userId))
        .orderBy(desc(paypalPayouts.createdAt));

      res.json({ success: true, payouts: userPayouts });
    } catch (error) {
      console.error("Error fetching user payouts:", error);
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}