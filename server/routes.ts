import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { findBestContent, fallbackContent } from "./contentDatabase";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, ordersController } from "./paypal";
import { User, users, paypalPayouts, winnerSelectionCycles, winnerSelections, winnerAllocationTemplates } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, sum, gte, lte, isNull, isNotNull, inArray, asc } from "drizzle-orm";

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

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        'finboost-secret-key-2024',
        { expiresIn: '24h' }
      );

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
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
      const user = await storage.getUserById(decoded.userId);
      
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

      const user = await getUserFromToken(token);
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

  // Update user PayPal payment information
  app.patch("/api/user/payment-info", authenticateToken, async (req, res) => {
    try {
      const { paypalEmail, payoutMethod } = req.body;
      const user = req.user;

      if (!paypalEmail || typeof paypalEmail !== 'string') {
        return res.status(400).json({ success: false, message: 'Valid PayPal email is required' });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paypalEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      // Update user payment information
      await db.update(users)
        .set({
          paypalEmail: paypalEmail.toLowerCase().trim(),
          payoutMethod: payoutMethod || 'paypal'
        })
        .where(eq(users.id, user.id));

      res.json({ 
        success: true, 
        message: 'Payment information updated successfully',
        paypalEmail: paypalEmail.toLowerCase().trim(),
        payoutMethod: payoutMethod || 'paypal'
      });
    } catch (error: any) {
      console.error('Error updating payment info:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment information' });
    }
  });

  // Admin endpoint to view all users' payment information for disbursements
  app.get("/api/admin/users/payment-info", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all premium users with their payment information
      const usersWithPaymentInfo = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        subscriptionStatus: users.subscriptionStatus,
        paypalEmail: users.paypalEmail,
        payoutMethod: users.payoutMethod,
        totalPoints: users.totalPoints,
        currentMonthPoints: users.currentMonthPoints,
        tier: users.tier,
        subscriptionAmount: users.subscriptionAmount,
        subscriptionCurrency: users.subscriptionCurrency,
        subscriptionPaymentMethod: users.subscriptionPaymentMethod,
        subscriptionStartDate: users.subscriptionStartDate,
        lastPaymentDate: users.lastPaymentDate,
        nextBillingDate: users.nextBillingDate,
        lastPaymentAmount: users.lastPaymentAmount,
        lastPaymentStatus: users.lastPaymentStatus
      })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'))
      .orderBy(desc(users.currentMonthPoints));

      // Add payment status information
      const usersWithStatus = usersWithPaymentInfo.map(user => ({
        ...user,
        paymentStatus: user.paypalEmail ? 'configured' : 'missing',
        paymentIssues: []
      }));

      res.json({ 
        success: true, 
        users: usersWithStatus,
        summary: {
          totalPremiumUsers: usersWithPaymentInfo.length,
          usersWithPayment: usersWithPaymentInfo.filter(u => u.paypalEmail).length,
          usersWithoutPayment: usersWithPaymentInfo.filter(u => !u.paypalEmail).length
        }
      });
    } catch (error: any) {
      console.error('Error fetching admin payment info:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment information' });
    }
  });

  // Admin endpoint to update individual user subscription details
  app.patch("/api/admin/users/:userId/subscription", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const {
        subscriptionAmount,
        subscriptionCurrency,
        subscriptionPaymentMethod,
        subscriptionStartDate,
        lastPaymentDate,
        nextBillingDate,
        lastPaymentAmount,
        lastPaymentStatus,
        subscriptionStatus
      } = req.body;

      // Calculate next billing date as last day of month if not provided
      let calculatedNextBilling = nextBillingDate;
      if (!calculatedNextBilling && (subscriptionStatus === 'active' || lastPaymentDate)) {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
        calculatedNextBilling = nextMonth.toISOString();
      }

      // Update user subscription information
      await db.update(users)
        .set({
          ...(subscriptionAmount !== undefined && { subscriptionAmount }),
          ...(subscriptionCurrency !== undefined && { subscriptionCurrency }),
          ...(subscriptionPaymentMethod !== undefined && { subscriptionPaymentMethod }),
          ...(subscriptionStartDate !== undefined && { subscriptionStartDate: new Date(subscriptionStartDate) }),
          ...(lastPaymentDate !== undefined && { lastPaymentDate: new Date(lastPaymentDate) }),
          ...(calculatedNextBilling && { nextBillingDate: new Date(calculatedNextBilling) }),
          ...(lastPaymentAmount !== undefined && { lastPaymentAmount }),
          ...(lastPaymentStatus !== undefined && { lastPaymentStatus }),
          ...(subscriptionStatus !== undefined && { subscriptionStatus })
        })
        .where(eq(users.id, parseInt(userId)));

      res.json({ 
        success: true, 
        message: 'User subscription details updated successfully',
        updatedFields: {
          subscriptionAmount,
          subscriptionCurrency,
          subscriptionPaymentMethod,
          subscriptionStartDate,
          lastPaymentDate,
          nextBillingDate: calculatedNextBilling,
          lastPaymentAmount,
          lastPaymentStatus,
          subscriptionStatus
        }
      });
    } catch (error: any) {
      console.error('Error updating user subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to update user subscription details' });
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

      const user = await getUserFromToken(token);
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

      const user = await getUserFromToken(token);
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

      const user = await getUserFromToken(token);
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

              // Auto-enroll user in current/next cycle
              await storage.autoEnrollUserInCycle(parseInt(userId));

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

  // Admin middleware - using JWT authentication
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
      const user = await storage.getUserById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      if (!user.isAdmin && user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Cycle settings routes (admin only) - consolidated from monthly
  app.get("/api/admin/cycle-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllCycleSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching cycle settings:', error);
      res.status(500).json({ message: "Error fetching cycle settings" });
    }
  });

  app.post("/api/admin/cycle-settings", requireAdmin, async (req, res) => {
    try {
      const { cycleName, cycleStartDate, cycleEndDate, rewardPoolPercentage, membershipFee } = req.body;

      const newSetting = await storage.createCycleSetting({
        cycleName,
        cycleStartDate: new Date(cycleStartDate),
        cycleEndDate: new Date(cycleEndDate),
        rewardPoolPercentage: parseInt(rewardPoolPercentage),
        membershipFee: parseInt(membershipFee),
        createdBy: req.user?.id
      });

      res.json(newSetting);
    } catch (error) {
      console.error('Error creating cycle setting:', error);
      res.status(500).json({ message: "Error creating cycle setting" });
    }
  });

  app.put("/api/admin/cycle-settings/:id", requireAdmin, async (req, res) => {
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

      const updated = await storage.updateCycleSetting(parseInt(id), updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating cycle setting:', error);
      res.status(500).json({ message: "Error updating cycle setting" });
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

  // Get user's reward disbursement history
  app.get('/api/rewards/history', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const disbursements = await db
        .select({
          id: paypalPayouts.id,
          amount: paypalPayouts.amount,
          currency: paypalPayouts.currency,
          status: paypalPayouts.status,
          tier: paypalPayouts.tier,
          processedAt: paypalPayouts.processedAt,
          reason: paypalPayouts.reason,
          cycleName: paypalPayouts.cycleName
        })
        .from(paypalPayouts)
        .where(eq(paypalPayouts.userId, user.id))
        .orderBy(desc(paypalPayouts.processedAt));

      const totalEarned = disbursements
        .filter(d => d.status === 'success' || d.status === 'pending')
        .reduce((sum, d) => sum + d.amount, 0);

      res.json({ 
        success: true, 
        disbursements,
        totalEarned,
        totalCount: disbursements.length
      });
    } catch (error) {
      console.error('Error fetching reward history:', error);
      res.status(500).json({ error: "Failed to fetch reward history" });
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

  // Enhanced Winner Selection and Disbursement System
  
  // Helper function for random selection within tiers
  function performRandomSelection(users: any[], selectionPercentage: number = 50) {
    const numToSelect = Math.floor(users.length * (selectionPercentage / 100));
    if (numToSelect === 0) return [];
    
    // Shuffle users randomly
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    
    // Select the specified percentage
    const selected = shuffled.slice(0, numToSelect);
    
    // Assign random ranks
    return selected.map((user, index) => ({
      ...user,
      tierRank: index + 1,
      rewardPercentage: 0 // Will be set by admin
    }));
  }

  // Create new winner selection cycle
  app.post("/api/admin/winner-cycles/create", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { cycleName, cycleStartDate, cycleEndDate, poolSettings } = req.body;

      const [cycle] = await db
        .insert(winnerSelectionCycles)
        .values({
          cycleName,
          cycleStartDate: new Date(cycleStartDate),
          cycleEndDate: new Date(cycleEndDate),
          poolSettings: JSON.stringify(poolSettings),
          createdBy: user.id
        })
        .returning();

      res.json({ success: true, cycle });
    } catch (error) {
      console.error("Error creating winner cycle:", error);
      res.status(500).json({ error: "Failed to create winner cycle" });
    }
  });

  // Run random selection for a cycle
  app.post("/api/admin/winner-cycles/:cycleId/run-selection", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);

      // Get cycle details
      const [cycle] = await db
        .select()
        .from(winnerSelectionCycles)
        .where(eq(winnerSelectionCycles.id, cycleId));

      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }

      if (cycle.selectionCompleted) {
        return res.status(400).json({ error: "Selection already completed for this cycle" });
      }

      // Get current pool settings and calculate total reward pool
      const poolSettings = await storage.getCurrentPoolSettingsForDate(new Date());
      if (!poolSettings) {
        return res.status(400).json({ error: "No active pool settings found for current date" });
      }

      // Calculate total reward pool from subscription revenue
      const totalSubscribers = await storage.getUserCount();
      const monthlyRevenue = totalSubscribers * (poolSettings.membershipFee / 100);
      const totalRewardPool = Math.floor(monthlyRevenue * (poolSettings.rewardPoolPercentage / 100));

      // Get all premium users and calculate percentile-based tiers
      const premiumUsers = await storage.getPremiumUsersForRewards();
      
      // Sort users by points to calculate percentile ranks
      const sortedUsers = premiumUsers
        .map(u => ({ ...u, points: u.currentMonthPoints || 0 }))
        .sort((a, b) => b.points - a.points); // Highest to lowest
      
      const totalUsers = sortedUsers.length;
      // Use admin-configurable tier thresholds
      const tier1Cutoff = Math.floor(totalUsers * (cycle.tier1Threshold || 33) / 100);
      const tier2Cutoff = Math.floor(totalUsers * (cycle.tier2Threshold || 67) / 100);
      
      // Assign percentile-based tiers using admin thresholds
      const usersByTier = {
        tier1: sortedUsers.slice(0, tier1Cutoff),
        tier2: sortedUsers.slice(tier1Cutoff, tier2Cutoff),
        tier3: sortedUsers.slice(tier2Cutoff)
      };

      // Calculate tier pool allocations (50% to tier1, 35% to tier2, 15% to tier3)
      const tier1Pool = Math.floor(totalRewardPool * 0.50);
      const tier2Pool = Math.floor(totalRewardPool * 0.35);
      const tier3Pool = Math.floor(totalRewardPool * 0.15);

      // Perform random selection for each tier using admin-configurable percentage
      const selectionPercentage = cycle.selectionPercentage || 50;
      const tier1Winners = performRandomSelection(usersByTier.tier1, selectionPercentage);
      const tier2Winners = performRandomSelection(usersByTier.tier2, selectionPercentage);
      const tier3Winners = performRandomSelection(usersByTier.tier3, selectionPercentage);

      // Calculate individual reward amounts
      const tier1RewardPerWinner = tier1Winners.length > 0 ? Math.floor(tier1Pool / tier1Winners.length) : 0;
      const tier2RewardPerWinner = tier2Winners.length > 0 ? Math.floor(tier2Pool / tier2Winners.length) : 0;
      const tier3RewardPerWinner = tier3Winners.length > 0 ? Math.floor(tier3Pool / tier3Winners.length) : 0;

      // Insert winner selections into database with actual reward amounts
      const allWinners = [
        ...tier1Winners.map((w, index) => ({ 
          ...w, 
          tier: 'tier1', 
          cycleId, 
          rewardAmount: tier1RewardPerWinner,
          tierRank: index + 1
        })),
        ...tier2Winners.map((w, index) => ({ 
          ...w, 
          tier: 'tier2', 
          cycleId, 
          rewardAmount: tier2RewardPerWinner,
          tierRank: index + 1
        })),
        ...tier3Winners.map((w, index) => ({ 
          ...w, 
          tier: 'tier3', 
          cycleId, 
          rewardAmount: tier3RewardPerWinner,
          tierRank: index + 1
        }))
      ];

      if (allWinners.length > 0) {
        await db.insert(winnerSelections).values(
          allWinners.map(winner => ({
            cycleId,
            userId: winner.id,
            tier: winner.tier,
            tierRank: winner.tierRank,
            rewardPercentage: 0, // Will be set during allocation
            rewardAmount: winner.rewardAmount,
            paypalEmail: winner.paypalEmail
          }))
        );
      }

      // Update cycle with pool information
      await db
        .update(winnerSelectionCycles)
        .set({ 
          selectionCompleted: true,
          totalRewardPool: totalRewardPool,
          tier1Pool: tier1Pool,
          tier2Pool: tier2Pool,
          tier3Pool: tier3Pool
        })
        .where(eq(winnerSelectionCycles.id, cycleId));

      res.json({
        success: true,
        message: "Random selection completed",
        poolCalculation: {
          totalSubscribers,
          monthlyRevenue: monthlyRevenue,
          rewardPoolPercentage: poolSettings.rewardPoolPercentage,
          totalRewardPool,
          tier1Pool,
          tier2Pool,
          tier3Pool
        },
        results: {
          tier1: { total: usersByTier.tier1.length, winners: tier1Winners.length, rewardPerWinner: tier1RewardPerWinner },
          tier2: { total: usersByTier.tier2.length, winners: tier2Winners.length, rewardPerWinner: tier2RewardPerWinner },
          tier3: { total: usersByTier.tier3.length, winners: tier3Winners.length, rewardPerWinner: tier3RewardPerWinner }
        },
        winners: allWinners
      });
    } catch (error) {
      console.error("Error running selection:", error);
      res.status(500).json({ error: "Failed to run selection" });
    }
  });

  // Process PayPal disbursements for a winner cycle
  app.post("/api/admin/winner-cycles/:cycleId/process-disbursements", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);
      const { selectedWinnerIds } = req.body;

      // Get cycle and verify it's ready for disbursement
      const [cycle] = await db
        .select()
        .from(winnerSelectionCycles)
        .where(eq(winnerSelectionCycles.id, cycleId));

      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }

      if (!cycle.selectionCompleted) {
        return res.status(400).json({ error: "Winner selection must be completed first" });
      }

      // Build query conditions - either selected winners or all undisbursed winners
      const baseConditions = [
        eq(winnerSelections.cycleId, cycleId),
        eq(winnerSelections.disbursed, false)
      ];
      
      if (selectedWinnerIds && selectedWinnerIds.length > 0) {
        baseConditions.push(inArray(winnerSelections.id, selectedWinnerIds));
      }

      // Get winners for this cycle with their reward amounts
      const winners = await db
        .select({
          id: winnerSelections.id,
          userId: winnerSelections.userId,
          tier: winnerSelections.tier,
          rewardAmount: winnerSelections.rewardAmount,
          paypalEmail: winnerSelections.paypalEmail,
          disbursed: winnerSelections.disbursed,
          username: users.username,
          email: users.email
        })
        .from(winnerSelections)
        .innerJoin(users, eq(winnerSelections.userId, users.id))
        .where(and(...baseConditions));

      if (winners.length === 0) {
        return res.status(400).json({ error: "No undisbursed winners found for this cycle" });
      }

      // Validate all winners have PayPal emails and reward amounts
      const winnersWithoutPayPal = winners.filter(w => !w.paypalEmail);
      if (winnersWithoutPayPal.length > 0) {
        return res.status(400).json({ 
          error: "Some winners are missing PayPal emails", 
          usernames: winnersWithoutPayPal.map(w => w.username)
        });
      }

      const winnersWithoutAmount = winners.filter(w => !w.rewardAmount || w.rewardAmount <= 0);
      if (winnersWithoutAmount.length > 0) {
        return res.status(400).json({ 
          error: "Some winners have invalid reward amounts", 
          usernames: winnersWithoutAmount.map(w => w.username)
        });
      }

      // Use existing PayPal integration function
      const { createPaypalPayout } = await import('./paypal');
      
      const recipients = winners.map(winner => ({
        email: winner.paypalEmail!,
        amount: winner.rewardAmount!,
        currency: "USD",
        note: `FinBoost Reward - ${cycle.cycleName} - Tier ${winner.tier.toUpperCase()}`,
        recipientId: `winner_${winner.id}`
      }));

      const payoutResult = await createPaypalPayout(recipients);

      // Record successful payouts in database
      const payoutRecords = winners.map(winner => ({
        userId: winner.userId,
        paypalPayoutId: payoutResult.batch_header?.payout_batch_id,
        paypalItemId: payoutResult.items?.find((item: any) => 
          item.payout_item.sender_item_id === `winner_${winner.id}`
        )?.payout_item_id || null,
        recipientEmail: winner.paypalEmail!,
        amount: winner.rewardAmount!,
        currency: "usd",
        status: "pending",
        reason: "winner_cycle_reward",
        tier: winner.tier,
        processedAt: new Date(),
        cycleId: cycleId,
        cycleName: cycle.cycleName,
        paypalResponse: JSON.stringify(payoutResult)
      }));

      await db.insert(paypalPayouts).values(payoutRecords);

      // Mark only the processed winners as disbursed
      const winnerIds = winners.map(w => w.id);
      await db
        .update(winnerSelections)
        .set({ 
          disbursed: true, 
          disbursementId: payoutResult.batch_header?.payout_batch_id 
        })
        .where(inArray(winnerSelections.id, winnerIds));

      // Check if all winners for this cycle are now disbursed
      const remainingWinners = await db
        .select()
        .from(winnerSelections)
        .where(
          and(
            eq(winnerSelections.cycleId, cycleId),
            eq(winnerSelections.disbursed, false)
          )
        );

      // Mark cycle as disbursement completed only if all winners are disbursed
      if (remainingWinners.length === 0) {
        await db
          .update(winnerSelectionCycles)
          .set({ 
            disbursementCompleted: true,
            completedAt: new Date()
          })
          .where(eq(winnerSelectionCycles.id, cycleId));
      }

      res.json({
        success: true,
        message: "Disbursements processed successfully",
        batchId: payoutResult.batch_header?.payout_batch_id,
        totalAmount: winners.reduce((sum, w) => sum + (w.rewardAmount || 0), 0),
        totalRecipients: winners.length,
        payoutsByTier: {
          tier1: winners.filter(w => w.tier === 'tier1').length,
          tier2: winners.filter(w => w.tier === 'tier2').length,
          tier3: winners.filter(w => w.tier === 'tier3').length
        }
      });
    } catch (error) {
      console.error("Error processing disbursements:", error);
      res.status(500).json({ error: "Failed to process disbursements" });
    }
  });

  // Get cycle winners with current allocations
  app.get("/api/admin/winner-cycles/:cycleId/winners", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);

      const winners = await db
        .select({
          id: winnerSelections.id,
          userId: winnerSelections.userId,
          username: users.username,
          email: users.email,
          paypalEmail: users.paypalEmail,
          tier: winnerSelections.tier,
          tierRank: winnerSelections.tierRank,
          rewardPercentage: winnerSelections.rewardPercentage,
          rewardAmount: winnerSelections.rewardAmount,
          disbursed: winnerSelections.disbursed,
          disbursementDate: paypalPayouts.processedAt
        })
        .from(winnerSelections)
        .leftJoin(users, eq(winnerSelections.userId, users.id))
        .leftJoin(paypalPayouts, and(
          eq(paypalPayouts.userId, winnerSelections.userId),
          eq(paypalPayouts.reason, "winner_cycle_reward")
        ))
        .where(eq(winnerSelections.cycleId, cycleId))
        .orderBy(winnerSelections.tier, winnerSelections.tierRank);

      // Group by tier
      const winnersByTier = {
        tier1: winners.filter(w => w.tier === 'tier1'),
        tier2: winners.filter(w => w.tier === 'tier2'),
        tier3: winners.filter(w => w.tier === 'tier3')
      };

      res.json({ success: true, winners: winnersByTier });
    } catch (error) {
      console.error("Error fetching winners:", error);
      res.status(500).json({ error: "Failed to fetch winners" });
    }
  });

  // Update winner percentages
  app.post("/api/admin/winner-cycles/:cycleId/update-percentages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);
      const { updates } = req.body; // Array of { winnerId, rewardPercentage }

      // Validate percentages sum to 100% per tier
      const winnersByTier = await db
        .select()
        .from(winnerSelections)
        .where(eq(winnerSelections.cycleId, cycleId));

      const tierTotals = { tier1: 0, tier2: 0, tier3: 0 };
      
      for (const update of updates) {
        const winner = winnersByTier.find(w => w.id === update.winnerId);
        if (winner) {
          tierTotals[winner.tier as keyof typeof tierTotals] += update.rewardPercentage;
        }
      }

      // Check if any tier exceeds 100%
      for (const [tier, total] of Object.entries(tierTotals)) {
        if (total > 100) {
          return res.status(400).json({ 
            error: `${tier} percentages exceed 100% (current: ${total}%)` 
          });
        }
      }

      // Update percentages in database
      for (const update of updates) {
        await db
          .update(winnerSelections)
          .set({ rewardPercentage: update.rewardPercentage })
          .where(eq(winnerSelections.id, update.winnerId));
      }

      res.json({ success: true, message: "Percentages updated successfully" });
    } catch (error) {
      console.error("Error updating percentages:", error);
      res.status(500).json({ error: "Failed to update percentages" });
    }
  });

  // Export winner allocations to CSV
  app.get("/api/admin/winner-cycles/:cycleId/export", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);

      const winners = await db
        .select({
          userId: winnerSelections.userId,
          username: users.username,
          email: users.email,
          paypalEmail: users.paypalEmail,
          tier: winnerSelections.tier,
          tierRank: winnerSelections.tierRank,
          rewardPercentage: winnerSelections.rewardPercentage
        })
        .from(winnerSelections)
        .leftJoin(users, eq(winnerSelections.userId, users.id))
        .where(eq(winnerSelections.cycleId, cycleId))
        .orderBy(winnerSelections.tier, winnerSelections.tierRank);

      // Create CSV content
      const csvHeader = "UserID,Username,Email,PayPalEmail,Tier,TierRank,Percentage\n";
      const csvRows = winners.map(w => 
        `${w.userId},${w.username},${w.email},${w.paypalEmail || ''},${w.tier},${w.tierRank},${w.rewardPercentage}`
      ).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cycle_${cycleId}_allocations.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // Import winner allocations from CSV
  app.post("/api/admin/winner-cycles/:cycleId/import", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);
      const { csvData } = req.body;

      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const header = lines[0].toLowerCase();
      
      if (!header.includes('userid') || !header.includes('percentage')) {
        return res.status(400).json({ error: "CSV must contain UserID and Percentage columns" });
      }

      const updates = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        const userId = parseInt(columns[0]);
        const percentage = parseInt(columns[6]); // Assuming percentage is in column 6

        if (userId && !isNaN(percentage)) {
          // Find the winner selection record
          const [winner] = await db
            .select()
            .from(winnerSelections)
            .where(and(
              eq(winnerSelections.cycleId, cycleId),
              eq(winnerSelections.userId, userId)
            ));

          if (winner) {
            updates.push({ winnerId: winner.id, rewardPercentage: percentage });
          }
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No valid updates found in CSV" });
      }

      // Update percentages using existing endpoint logic
      const updateResult = await fetch(`/api/admin/winner-cycles/${cycleId}/update-percentages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      res.json({ 
        success: true, 
        message: `Imported ${updates.length} percentage updates from CSV`
      });
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ error: "Failed to import CSV" });
    }
  });

  // Get all winner cycles
  app.get("/api/admin/winner-cycles", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycles = await db
        .select()
        .from(winnerSelectionCycles)
        .orderBy(desc(winnerSelectionCycles.createdAt));

      res.json({ success: true, cycles });
    } catch (error) {
      console.error("Error fetching cycles:", error);
      res.status(500).json({ error: "Failed to fetch cycles" });
    }
  });

  // Recalculate all user tiers based on percentiles
  app.post("/api/admin/recalculate-tiers", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || user.email !== 'lafleur.andrew@gmail.com') {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.recalculateAllUserTiers();
      res.json({ success: true, message: "All user tiers recalculated based on percentiles" });
    } catch (error) {
      console.error("Error recalculating tiers:", error);
      res.status(500).json({ error: "Failed to recalculate tiers" });
    }
  });

  // === NEW CYCLE-BASED API ROUTES (Phase 2) ===
  
  // Cycle Settings Management
  app.post("/api/admin/cycle-settings", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const setting = await storage.createCycleSetting(req.body);
      res.json({ success: true, setting });
    } catch (error) {
      console.error("Error creating cycle setting:", error);
      res.status(500).json({ error: "Failed to create cycle setting" });
    }
  });

  app.get("/api/cycle-settings/active", async (req, res) => {
    try {
      const setting = await storage.getActiveCycleSetting();
      res.json({ success: true, setting });
    } catch (error) {
      console.error("Error getting active cycle setting:", error);
      res.status(500).json({ error: "Failed to get active cycle setting" });
    }
  });

  app.get("/api/admin/cycle-settings", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const settings = await storage.getAllCycleSettings();
      res.json({ success: true, settings });
    } catch (error) {
      console.error("Error getting cycle settings:", error);
      res.status(500).json({ error: "Failed to get cycle settings" });
    }
  });

  app.put("/api/admin/cycle-settings/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const setting = await storage.updateCycleSetting(parseInt(req.params.id), req.body);
      res.json({ success: true, setting });
    } catch (error) {
      console.error("Error updating cycle setting:", error);
      res.status(500).json({ error: "Failed to update cycle setting" });
    }
  });

  // User Cycle Points
  app.get("/api/user/cycle-points/:cycleId", authenticateToken, async (req, res) => {
    try {
      const points = await storage.getUserCyclePoints(req.user.id, parseInt(req.params.cycleId));
      res.json({ success: true, points });
    } catch (error) {
      console.error("Error getting user cycle points:", error);
      res.status(500).json({ error: "Failed to get user cycle points" });
    }
  });

  app.get("/api/cycle/:cycleId/users", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getUsersInCurrentCycle(parseInt(req.params.cycleId));
      res.json({ success: true, users });
    } catch (error) {
      console.error("Error getting cycle users:", error);
      res.status(500).json({ error: "Failed to get cycle users" });
    }
  });

  // Cycle Points System
  app.post("/api/user/cycle-points/award", authenticateToken, async (req, res) => {
    try {
      const { cycleSettingId, actionId, points, description, metadata } = req.body;
      
      // Check limits
      const canAwardDaily = await storage.checkCycleDailyActionLimit(req.user.id, cycleSettingId, actionId);
      const canAwardCycle = await storage.checkCycleActionLimit(req.user.id, cycleSettingId, actionId);
      
      if (!canAwardDaily || !canAwardCycle) {
        return res.status(400).json({ error: "Action limit exceeded" });
      }

      const history = await storage.awardCyclePoints(req.user.id, cycleSettingId, actionId, points, description, metadata);
      res.json({ success: true, history });
    } catch (error) {
      console.error("Error awarding cycle points:", error);
      res.status(500).json({ error: "Failed to award cycle points" });
    }
  });

  app.post("/api/user/cycle-points/award-with-proof", authenticateToken, async (req, res) => {
    try {
      const { cycleSettingId, actionId, points, description, proofUrl, metadata } = req.body;
      
      const history = await storage.awardCyclePointsWithProof(req.user.id, cycleSettingId, actionId, points, description, proofUrl, metadata);
      res.json({ success: true, history });
    } catch (error) {
      console.error("Error awarding cycle points with proof:", error);
      res.status(500).json({ error: "Failed to award cycle points with proof" });
    }
  });

  app.get("/api/user/cycle-points/history/:cycleId", authenticateToken, async (req, res) => {
    try {
      const history = await storage.getCyclePointHistory(req.user.id, parseInt(req.params.cycleId));
      res.json({ success: true, history });
    } catch (error) {
      console.error("Error getting cycle point history:", error);
      res.status(500).json({ error: "Failed to get cycle point history" });
    }
  });

  // Cycle Leaderboard and Analytics
  app.get("/api/cycle/:cycleId/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const leaderboard = await storage.getCycleLeaderboard(parseInt(req.params.cycleId), limit);
      res.json({ success: true, leaderboard });
    } catch (error) {
      console.error("Error getting cycle leaderboard:", error);
      res.status(500).json({ error: "Failed to get cycle leaderboard" });
    }
  });

  app.get("/api/cycle/:cycleId/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getCycleStats(parseInt(req.params.cycleId));
      res.json({ success: true, stats });
    } catch (error) {
      console.error("Error getting cycle stats:", error);
      res.status(500).json({ error: "Failed to get cycle stats" });
    }
  });

  // Cycle Winner Selection
  app.post("/api/admin/cycle/:cycleId/select-winners", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const winners = await storage.performCycleWinnerSelection(parseInt(req.params.cycleId));
      res.json({ success: true, winners });
    } catch (error) {
      console.error("Error selecting cycle winners:", error);
      res.status(500).json({ error: "Failed to select cycle winners" });
    }
  });

  app.get("/api/cycle/:cycleId/winners", authenticateToken, async (req, res) => {
    try {
      const winners = await storage.getCycleWinners(parseInt(req.params.cycleId));
      res.json({ success: true, winners });
    } catch (error) {
      console.error("Error getting cycle winners:", error);
      res.status(500).json({ error: "Failed to get cycle winners" });
    }
  });

  // Mid-cycle Joining Logic
  app.get("/api/cycle/:cycleId/should-join", authenticateToken, async (req, res) => {
    try {
      const shouldJoin = await storage.shouldJoinCurrentCycle(parseInt(req.params.cycleId));
      const nextStart = await storage.getNextCycleStartDate(parseInt(req.params.cycleId));
      res.json({ success: true, shouldJoin, nextStart });
    } catch (error) {
      console.error("Error checking cycle join status:", error);
      res.status(500).json({ error: "Failed to check cycle join status" });
    }
  });

  // Cycle Points Actions Management
  app.get("/api/cycle-points-actions", async (req, res) => {
    try {
      const actions = await storage.getCyclePointActions();
      res.json({ success: true, actions });
    } catch (error) {
      console.error("Error getting cycle point actions:", error);
      res.status(500).json({ error: "Failed to get cycle point actions" });
    }
  });

  app.post("/api/admin/cycle-points-actions", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const action = await storage.createOrUpdateCyclePointAction(req.body, req.user.id);
      res.json({ success: true, action });
    } catch (error) {
      console.error("Error creating/updating cycle point action:", error);
      res.status(500).json({ error: "Failed to create/update cycle point action" });
    }
  });

  app.delete("/api/admin/cycle-points-actions/:actionId", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteCyclePointAction(req.params.actionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cycle point action:", error);
      res.status(500).json({ error: "Failed to delete cycle point action" });
    }
  });

  // Cycle Tier Management
  app.get("/api/cycle/:cycleId/tier-thresholds", async (req, res) => {
    try {
      const thresholds = await storage.getCycleTierThresholds(parseInt(req.params.cycleId));
      res.json({ success: true, thresholds });
    } catch (error) {
      console.error("Error getting cycle tier thresholds:", error);
      res.status(500).json({ error: "Failed to get cycle tier thresholds" });
    }
  });

  app.post("/api/admin/cycle/:cycleId/recalculate-tiers", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.recalculateAllCycleTiers(parseInt(req.params.cycleId));
      res.json({ success: true, message: "All cycle tiers recalculated" });
    } catch (error) {
      console.error("Error recalculating cycle tiers:", error);
      res.status(500).json({ error: "Failed to recalculate cycle tiers" });
    }
  });

  // Public cycle API endpoints (used by dashboard)
  app.get("/api/cycles/current", async (req, res) => {
    try {
      const currentCycle = await storage.getCurrentCycle();
      if (!currentCycle) {
        return res.json(null);
      }
      res.json(currentCycle);
    } catch (error) {
      console.error("Error fetching current cycle:", error);
      res.status(500).json({ error: "Failed to fetch current cycle" });
    }
  });

  app.get("/api/cycles/leaderboard", async (req, res) => {
    try {
      const currentCycle = await storage.getCurrentCycle();
      if (!currentCycle) {
        return res.json([]);
      }
      
      const leaderboard = await storage.getCycleLeaderboard(currentCycle.id, 50);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching cycle leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch cycle leaderboard" });
    }
  });

  app.get("/api/cycles/leaderboard/expanded", async (req, res) => {
    try {
      const currentCycle = await storage.getCurrentCycle();
      if (!currentCycle) {
        return res.json([]);
      }
      
      const leaderboard = await storage.getCycleLeaderboard(currentCycle.id);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching expanded cycle leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch expanded cycle leaderboard" });
    }
  });

  app.get("/api/cycles/rewards/history", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let userId = null;
      
      if (token) {
        try {
          const user = await getUserFromToken(token);
          if (user) {
            userId = user.id;
          }
        } catch (error) {
          // Token invalid or expired, but we can still return empty history
        }
      }
      
      if (!userId) {
        return res.json([]);
      }
      
      const rewardsHistory = await storage.getUserCycleRewards(userId);
      res.json(rewardsHistory);
    } catch (error) {
      console.error("Error fetching cycle rewards history:", error);
      res.status(500).json({ error: "Failed to fetch cycle rewards history" });
    }
  });

  app.get("/api/cycles/pool", async (req, res) => {
    try {
      const currentCycle = await storage.getCurrentCycle();
      if (!currentCycle) {
        return res.json({
          totalPool: 0,
          premiumUsers: 0,
          totalUsers: 0
        });
      }
      
      const poolData = await storage.getCyclePoolData(currentCycle.id);
      res.json(poolData);
    } catch (error) {
      console.error("Error fetching cycle pool data:", error);
      res.status(500).json({ error: "Failed to fetch cycle pool data" });
    }
  });

  app.get("/api/cycles/distribution", async (req, res) => {
    try {
      const currentCycle = await storage.getCurrentCycle();
      if (!currentCycle) {
        return res.json(null);
      }
      
      const now = new Date();
      const endDate = new Date(currentCycle.endDate);
      const timeRemaining = endDate.getTime() - now.getTime();
      
      if (timeRemaining <= 0) {
        return res.json({
          nextDate: endDate.toISOString(),
          timeRemaining: { days: 0, hours: 0, minutes: 0, totalMs: 0 }
        });
      }
      
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      res.json({
        nextDate: endDate.toISOString(),
        timeRemaining: { days, hours, minutes, totalMs: timeRemaining }
      });
    } catch (error) {
      console.error("Error fetching cycle distribution info:", error);
      res.status(500).json({ error: "Failed to fetch cycle distribution info" });
    }
  });

  // Admin subscription-cycle backfill endpoint
  app.post('/api/admin/backfill-cycle-enrollment', requireAdmin, async (req, res) => {
    try {
      const result = await storage.backfillPremiumSubscribersInCycles();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in backfill endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute backfill process'
      });
    }
  });

  // Admin Analytics Dashboard API Endpoints
  // User Engagement Metrics
  app.get('/api/admin/analytics/users/engagement', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '30', cycleId } = req.query;
      
      let startDate: Date;
      let endDate: Date = new Date();
      
      let days = parseInt(timeframe as string);
      
      // Handle cycle-based filtering
      if (cycleId && cycleId !== 'undefined') {
        try {
          const cycles = await storage.getAllCycles();
          const cycle = cycles.find(c => c.id === parseInt(cycleId as string));
          if (cycle) {
            startDate = new Date(cycle.cycleStartDate);
            endDate = new Date(cycle.cycleEndDate);
          } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
          }
        } catch (error) {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
        }
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }

      // Active users (users with recent login activity)
      const activeUsers = await storage.getActiveUsersCount(startDate);
      
      // Total user count
      const totalUsers = await storage.getTotalUsersCount();
      
      // Premium subscriber count
      const premiumUsers = await storage.getPremiumUsersCount();
      
      // Daily login activity for the timeframe
      const dailyActivity = await storage.getDailyLoginActivity(startDate);
      
      // User registration trends
      const registrationTrends = await storage.getRegistrationTrends(startDate);

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          premiumUsers,
          freeUsers: totalUsers - premiumUsers,
          dailyActivity,
          registrationTrends,
          timeframe: cycleId ? `Cycle ${cycleId}` : `${parseInt(timeframe as string)} days`,
          cycleContext: cycleId ? { cycleId, startDate, endDate } : null
        }
      });
    } catch (error) {
      console.error('Error fetching user engagement analytics:', error);
      res.status(500).json({ error: 'Failed to fetch user engagement analytics' });
    }
  });

  // Learning Analytics
  app.get('/api/admin/analytics/learning/performance', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '30' } = req.query;
      const days = parseInt(timeframe as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Module completion rates
      const moduleCompletionRates = await storage.getModuleCompletionRates(startDate, new Date());
      
      // Recent lesson completions
      const recentCompletions = await storage.getRecentLessonCompletions(startDate);
      
      // Popular content categories
      const categoryStats = await storage.getCategoryPerformanceStats();
      
      // Average time spent learning
      const learningTimeStats = await storage.getLearningTimeStats(startDate);

      res.json({
        success: true,
        data: {
          moduleCompletionRates,
          recentCompletions,
          categoryStats,
          learningTimeStats,
          timeframe: days
        }
      });
    } catch (error) {
      console.error('Error fetching learning analytics:', error);
      res.status(500).json({ error: 'Failed to fetch learning analytics' });
    }
  });

  // Cycle Performance Analytics
  app.get('/api/admin/analytics/cycles/performance', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '90' } = req.query;
      const days = parseInt(timeframe as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Current cycle stats
      const currentCycleStats = await storage.getCurrentCycleStats();
      
      // Historical cycle performance
      const historicalCycles = await storage.getHistoricalCyclePerformance(startDate);
      
      // Participation trends
      const participationTrends = await storage.getCycleParticipationTrends(startDate);
      
      // Points distribution analytics
      const pointsDistribution = await storage.getPointsDistributionAnalytics();

      res.json({
        success: true,
        data: {
          currentCycleStats,
          historicalCycles,
          participationTrends,
          pointsDistribution,
          timeframe: days
        }
      });
    } catch (error) {
      console.error('Error fetching cycle analytics:', error);
      res.status(500).json({ error: 'Failed to fetch cycle analytics' });
    }
  });

  // Financial Analytics
  app.get('/api/admin/analytics/financial/overview', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '90' } = req.query;
      const days = parseInt(timeframe as string);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get comprehensive financial metrics
      const revenueMetrics = await storage.getRevenueMetrics(startDate, endDate);
      const payoutMetrics = await storage.getPayoutMetrics(startDate, endDate);
      const subscriptionMetrics = await storage.getSubscriptionMetrics(startDate, endDate);

      res.json({
        success: true,
        data: {
          revenueMetrics,
          payoutMetrics,
          subscriptionMetrics,
          timeframe: days
        }
      });
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      res.status(500).json({ error: 'Failed to fetch financial analytics' });
    }
  });

  // Legacy financial endpoint (keeping for backward compatibility)
  app.get('/api/admin/analytics/financial/legacy', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '90' } = req.query;
      const days = parseInt(timeframe as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Legacy revenue stats
      const revenueStats = await storage.getRevenueStats(startDate);
      
      // Subscription conversion rates
      const conversionStats = await storage.getSubscriptionConversionStats(startDate);
      
      // Payout history
      const payoutHistory = await storage.getPayoutHistory(startDate);
      
      // Financial forecasting data
      const forecastData = await storage.getFinancialForecastData();

      res.json({
        success: true,
        data: {
          revenueStats,
          conversionStats,
          payoutHistory,
          forecastData,
          timeframe: days
        }
      });
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      res.status(500).json({ error: 'Failed to fetch financial analytics' });
    }
  });

  // Real-time Activity Feed
  app.get('/api/admin/analytics/activity/recent', requireAdmin, async (req, res) => {
    try {
      const { limit = '20' } = req.query;
      const maxResults = parseInt(limit as string);

      // Recent user activities
      const recentActivities = await storage.getRecentUserActivities(maxResults);
      
      // Recent registrations
      const recentRegistrations = await storage.getRecentRegistrations(maxResults);
      
      // Recent lesson completions
      const recentLessonCompletions = await storage.getRecentLessonCompletions(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      res.json({
        success: true,
        data: {
          activities: recentActivities,
          registrations: recentRegistrations,
          completions: recentLessonCompletions,
          limit: maxResults
        }
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  });

  // Key Performance Indicators (KPIs) Dashboard
  app.get('/api/admin/analytics/kpis/overview', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '30' } = req.query;
      const days = parseInt(timeframe as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Calculate key metrics
      const totalUsers = await storage.getTotalUsersCount();
      const activeUsers = await storage.getActiveUsersCount(startDate);
      const premiumUsers = await storage.getPremiumUsersCount();
      const totalRevenue = await storage.getTotalRevenue(startDate);
      const avgCompletionRate = await storage.getAverageCompletionRate();
      const cycleParticipation = await storage.getCurrentCycleParticipationRate();

      // Calculate growth rates
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
      const previousPeriodUsers = await storage.getActiveUsersCount(previousPeriodStart);
      const userGrowthRate = previousPeriodUsers > 0 ? ((activeUsers - previousPeriodUsers) / previousPeriodUsers) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          premiumUsers,
          totalRevenue,
          avgCompletionRate,
          cycleParticipation,
          userGrowthRate,
          conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0,
          timeframe: days
        }
      });
    } catch (error) {
      console.error('Error fetching KPI overview:', error);
      res.status(500).json({ error: 'Failed to fetch KPI overview' });
    }
  });

  // User Engagement Metrics API - Phase 1.1 Step 1
  app.get('/api/admin/analytics/user-engagement', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '30' } = req.query;
      const days = parseInt(timeframe as string);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Active users (daily/weekly/cycle)
      const dailyActiveUsers = await storage.getDailyActiveUsers(startDate, endDate);
      const weeklyActiveUsers = await storage.getWeeklyActiveUsers(startDate, endDate);
      const cycleActiveUsers = await storage.getCycleActiveUsers();

      // Login frequency statistics
      const loginFrequencyStats = await storage.getLoginFrequencyStats(startDate, endDate);

      // Session duration averages
      const sessionDurationStats = await storage.getSessionDurationStats(startDate, endDate);

      res.json({
        success: true,
        data: {
          activeUsers: {
            daily: dailyActiveUsers,
            weekly: weeklyActiveUsers,
            cycle: cycleActiveUsers
          },
          loginFrequency: loginFrequencyStats,
          sessionDuration: sessionDurationStats,
          timeframe: days
        }
      });
    } catch (error) {
      console.error('Error fetching user engagement metrics:', error);
      res.status(500).json({ error: 'Failed to fetch user engagement metrics' });
    }
  });

  // Learning Analytics API - Phase 1.1 Step 2
  app.get('/api/admin/analytics/learning', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '30' } = req.query;
      const days = parseInt(timeframe as string);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Lesson completion rates by module
      const moduleCompletionRates = await storage.getModuleCompletionRates(startDate, endDate);

      // Average time spent per module
      const averageTimePerModule = await storage.getAverageTimePerModule(startDate, endDate);

      // Popular content categories ranking
      const popularCategories = await storage.getPopularContentCategories(startDate, endDate);

      res.json({
        success: true,
        data: {
          moduleCompletionRates,
          averageTimePerModule,
          popularCategories,
          timeframe: days
        }
      });
    } catch (error) {
      console.error('Error fetching learning analytics:', error);
      res.status(500).json({ error: 'Failed to fetch learning analytics' });
    }
  });

  // Comparative Analytics API - Phase 1.1 Step 5
  app.get('/api/admin/analytics/comparative', requireAdmin, async (req, res) => {
    try {
      const { timeframe = '30' } = req.query;
      const days = parseInt(timeframe as string);

      // Get comparative analytics data
      const comparativeData = await storage.getComparativeAnalytics(days);

      res.json({
        success: true,
        data: comparativeData
      });
    } catch (error) {
      console.error('Error fetching comparative analytics:', error);
      res.status(500).json({ error: 'Failed to fetch comparative analytics' });
    }
  });

  // NEW OPTIMIZED ENDPOINTS: Batch analytics to eliminate N+1 queries
  
  // Batch user metrics endpoint
  app.get("/api/admin/analytics/users/batch", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const timeframe = parseInt(req.query.timeframe as string) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const batchMetrics = await storage.getBatchUserMetrics(startDate);
      
      res.json({
        success: true,
        data: batchMetrics,
        timeframe,
        cached: true // Indicates this is using optimized caching
      });
    } catch (error: any) {
      console.error('Error getting batch user metrics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Batch learning analytics endpoint
  app.get("/api/admin/analytics/learning/batch", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByToken(token);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const timeframe = parseInt(req.query.timeframe as string) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const batchAnalytics = await storage.getBatchLearningAnalytics(startDate);
      
      res.json({
        success: true,
        data: batchAnalytics,
        timeframe,
        cached: true // Indicates this is using optimized caching  
      });
    } catch (error: any) {
      console.error('Error getting batch learning analytics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Serve admin token setup page
  app.get('/set-admin-token.html', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Set Admin Token</title>
</head>
<body>
    <h1>Setting Admin Token...</h1>
    <script>
        // Set the admin token in localStorage
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1MDA3ODcwMCwiZXhwIjoxNzUwMTY1MTAwfQ.8UU5C_ZI0YAXyIO7t9t14dHkM4EpQdVAepuDF9uNUWc';
        localStorage.setItem('token', adminToken);
        
        // Set user data for admin
        const userData = {
            id: 1,
            username: 'alafleur',
            email: 'lafleur.andrew@gmail.com',
            isAdmin: true
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        document.body.innerHTML = '<h1>Admin token set successfully!</h1><p>You can now navigate to <a href="/analytics">Analytics Dashboard</a></p>';
        
        // Auto-redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '/analytics';
        }, 2000);
    </script>
</body>
</html>`);
  });

  const httpServer = createServer(app);
  
  // WebSocket Server for Real-time Analytics (on HTTP server to avoid port conflicts)
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // Store authenticated WebSocket connections
  const authenticatedClients = new Map<WebSocket, { userId: number; isAdmin: boolean }>();
  
  wss.on('connection', async (ws, req) => {
    console.log('WebSocket connection attempt');
    
    // Extract token from query params or headers
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // Verify token and get user
      const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
      const user = await storage.getUserById(decoded.userId);
      
      if (!user) {
        ws.close(1008, 'Invalid token');
        return;
      }
      
      // Store authenticated connection
      authenticatedClients.set(ws, { userId: user.id, isAdmin: user.isAdmin || user.email === 'lafleur.andrew@gmail.com' });
      
      console.log(`WebSocket authenticated: User ${user.id} (Admin: ${user.isAdmin})`);
      
      // Send initial connection success message
      ws.send(JSON.stringify({
        type: 'connection_established',
        data: { userId: user.id, isAdmin: user.isAdmin }
      }));
      
      // Handle client messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case 'subscribe_analytics':
              if (authenticatedClients.get(ws)?.isAdmin) {
                // Admin subscribed to real-time analytics
                ws.send(JSON.stringify({
                  type: 'analytics_subscription_confirmed',
                  data: { subscribed: true }
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'error',
                  data: { message: 'Admin access required for analytics' }
                }));
              }
              break;
              
            case 'request_live_data':
              if (authenticatedClients.get(ws)?.isAdmin) {
                // Send current analytics data
                const liveData = await getLiveAnalyticsData();
                ws.send(JSON.stringify({
                  type: 'live_analytics_data',
                  data: liveData,
                  timestamp: new Date().toISOString()
                }));
              }
              break;
              
            default:
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Unknown message type' }
              }));
          }
        } catch (error) {
          console.error('WebSocket message handling error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });
      
      // Handle connection close
      ws.on('close', () => {
        authenticatedClients.delete(ws);
        console.log(`WebSocket disconnected: User ${user.id}`);
      });
      
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });
  
  // Function to get live analytics data
  async function getLiveAnalyticsData() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [
        totalUsers,
        activeUsers,
        premiumUsers,
        currentCycleStats,
        recentActivity
      ] = await Promise.all([
        storage.getTotalUsersCount(),
        storage.getActiveUsersCount(thirtyDaysAgo),
        storage.getPremiumUsersCount(),
        storage.getCurrentCycleStats(),
        storage.getRecentUserActivities(10)
      ]);
      
      return {
        kpis: {
          totalUsers,
          activeUsers,
          premiumUsers,
          cycleParticipants: currentCycleStats?.participants || 0,
          timestamp: now.toISOString()
        },
        activity: recentActivity.slice(0, 5), // Latest 5 activities
        cycleStats: currentCycleStats
      };
    } catch (error) {
      console.error('Error generating live analytics data:', error);
      return { error: 'Failed to fetch live data' };
    }
  }
  
  // Function to broadcast analytics updates to admin clients
  function broadcastAnalyticsUpdate(data: any) {
    const message = JSON.stringify({
      type: 'analytics_update',
      data,
      timestamp: new Date().toISOString()
    });
    
    authenticatedClients.forEach((clientInfo, ws) => {
      if (clientInfo.isAdmin && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  // Function to broadcast activity updates
  function broadcastActivityUpdate(activity: any) {
    const message = JSON.stringify({
      type: 'activity_update',
      data: activity,
      timestamp: new Date().toISOString()
    });
    
    authenticatedClients.forEach((clientInfo, ws) => {
      if (clientInfo.isAdmin && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  // Periodic analytics updates (every 30 seconds)
  const analyticsUpdateInterval = setInterval(async () => {
    if (authenticatedClients.size > 0) {
      const hasAdminClients = Array.from(authenticatedClients.values()).some(client => client.isAdmin);
      if (hasAdminClients) {
        const liveData = await getLiveAnalyticsData();
        broadcastAnalyticsUpdate(liveData);
      }
    }
  }, 30000); // 30 seconds
  
  // Cleanup interval on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(analyticsUpdateInterval);
    wss.close();
  });
  
  // Expose broadcast functions for use in other routes
  (httpServer as any).broadcastAnalyticsUpdate = broadcastAnalyticsUpdate;
  (httpServer as any).broadcastActivityUpdate = broadcastActivityUpdate;
  
  return httpServer;
}