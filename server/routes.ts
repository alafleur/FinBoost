import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { findBestContent, fallbackContent } from "./contentDatabase";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, ordersController } from "./paypal";
import { User, users, paypalPayouts, winnerSelectionCycles, winnerSelections, winnerAllocationTemplates, insertCycleSettingSchema, cycleSettings, userCyclePoints, userPointsHistory, userPredictions, predictionQuestions, cycleWinnerSelections, payoutBatches, payoutBatchItems } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, sum, gte, lte, isNull, isNotNull, inArray, asc, or, ne } from "drizzle-orm";
import * as XLSX from "xlsx";
import path from "path";
import { upload, getFileUrl } from "./fileUpload";
import type { PayoutRecipient, TransactionContext } from './paypal-transaction-orchestrator.js';
// ChatGPT's v2 router with cycle_setting_id schema fix
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { adminPayoutBatchesRouter } = require("./routes/adminPayoutBatchesRouter");
const { payoutBatchSummaryRouter } = require("./routes/payoutBatchSummaryRouter");
import { registerAdminPayoutExportRoutes } from "./routes/admin-payout-export";
import { registerAdminCyclesRoutes } from "./routes/admin-cycles";
import devEmailTest from './routes/devEmailTest.js';
import postmarkWebhook from './routes/postmarkWebhook.js';
import authCompatRouter from './routes/authCompat.js';
import adminEmailRouter from './routes/adminEmail.js';
import signupRouter from './routes/signup.js';

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
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

// Helper function to get cycle fee multiplier based on cycle type
function getCycleFeeMultiplier(cycleType: string): number {
  switch (cycleType) {
    case 'weekly':
      return 1/4;  // 1/4 of monthly fee
    case '10-day':
      return 1/3;  // 1/3 of monthly fee  
    case 'bi-weekly':
      return 1/2;  // 1/2 of monthly fee
    case 'monthly':
      return 1;    // full monthly fee
    default:
      console.warn(`Unknown cycle type: ${cycleType}, using bi-weekly multiplier as default`);
      return 1/2;  // default to bi-weekly
  }
}

// Extended Request interface for authentication
interface AuthenticatedRequest extends express.Request {
  user?: User;
  session?: any;
}

// Authentication middleware
const authenticateToken = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('[Auth] No token provided in request');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      console.error(`[Auth] User not found for token userId: ${decoded.userId}`);
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }
    
    console.log(`[Auth] User authenticated: ${user.email} (ID: ${user.id}, Admin: ${user.isAdmin})`);
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token - verification failed' });
  }
};

// Unified Admin Authentication Middleware (Phase 1 Fix)
const requireAdmin = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('[Admin Auth] No token provided in admin request');
    return res.status(401).json({ error: 'Admin access requires authentication token' });
  }

  try {
    const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      console.error(`[Admin Auth] User not found for admin token userId: ${decoded.userId}`);
      return res.status(401).json({ error: 'Invalid admin token - user not found' });
    }

    // Check admin privileges using both methods for maximum reliability
    const isAdminByFlag = user.isAdmin === true;
    const isAdminByEmail = user.email === 'lafleur.andrew@gmail.com';
    
    if (!isAdminByFlag && !isAdminByEmail) {
      console.error(`[Admin Auth] Access denied for user: ${user.email} (Admin flag: ${user.isAdmin})`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`[Admin Auth] Admin authenticated: ${user.email} (ID: ${user.id}, Method: ${isAdminByFlag ? 'flag' : 'email'})`);
    req.user = user;
    next();
  } catch (error) {
    console.error('[Admin Auth] Admin token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized - invalid admin token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Mount ChatGPT's fixed admin payout routes (numeric cycleId parsing)
  app.use('/api/admin/payout-batches', adminPayoutBatchesRouter);
  app.use('/api/admin/payout-batches', payoutBatchSummaryRouter);
  registerAdminPayoutExportRoutes(app);
  registerAdminCyclesRoutes(app);
  
  // Email Authentication Routes (with compatibility aliases)
  app.use('/api/auth', authCompatRouter);
  
  // Admin Email Management Routes (with admin authentication)
  app.use('/api/admin/email', requireAdmin, adminEmailRouter);
  
  // Postmark Webhook for Email Events and Suppressions
  app.use('/api/webhooks/postmark', postmarkWebhook);

  // ChatGPT's consolidated rewards history endpoints
  app.get("/api/rewards/history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      res.set("Cache-Control", "no-store");
      if (!userId) return res.json({ summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] });
      const data = await storage.getRewardsHistoryForUser(Number(userId));
      res.json(data);
    } catch (err) {
      console.error("GET /api/rewards/history error", err);
      res.status(500).json({ error: "Failed to load rewards history" });
    }
  });

  // Backward-compatibility alias
  app.get("/api/cycles/rewards/history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      res.set("Cache-Control", "no-store");
      if (!userId) return res.json({ summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] });
      const data = await storage.getRewardsHistoryForUser(Number(userId));
      res.json(data);
    } catch (err) {
      console.error("GET /api/cycles/rewards/history error", err);
      res.status(500).json({ error: "Failed to load rewards history" });
    }
  });

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

      // Generate JWT token (same as login)
      const token = jwt.sign(
        { userId: user.id },
        'finboost-secret-key-2024',
        { expiresIn: '24h' }
      );
      
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

      // Get actual current cycle points from user_cycle_points table
      const currentCycle = await storage.getActiveCycleSetting();
      let actualCyclePoints = 0;
      let realTimeTier = user.tier;
      if (currentCycle) {
        const userCycleData = await storage.getUserCyclePoints(user.id, currentCycle.id);
        actualCyclePoints = userCycleData?.currentCyclePoints || 0;
        // Calculate real-time tier based on current cycle points
        realTimeTier = await storage.calculateUserTier(actualCyclePoints);
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
          currentCyclePoints: actualCyclePoints,
          tier: realTimeTier,
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

  // Auto-approved points for lessons and quizzes
  app.post("/api/points/award", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const { actionId, relatedId, metadata } = req.body;

      // Auto-approve quiz completions only - lesson completion now handled by /api/lessons/:id/complete
      if (actionId === 'quiz_complete') {
        // Award quiz points directly with auto-approval
        const pointsEarned = 15; // Standard quiz points
        
        // Record in points history as approved
        await db.insert(userPointsHistory).values({
          userId: user.id,
          action: actionId,
          points: pointsEarned,
          description: `Quiz completed: ${relatedId || 'quiz'}`,
          status: 'approved',
          metadata: JSON.stringify(metadata || {})
        });

        // Update user points and cycle points
        await db.update(users)
          .set({
            totalPoints: sql`${users.totalPoints} + ${pointsEarned}`,
            currentMonthPoints: sql`${users.currentMonthPoints} + ${pointsEarned}`,
          })
          .where(eq(users.id, user.id));

        // Update cycle points
        try {
          await db.update(userCyclePoints)
            .set({
              currentCyclePoints: sql`${userCyclePoints.currentCyclePoints} + ${pointsEarned}`,
              lastActivityDate: new Date()
            })
            .where(and(
              eq(userCyclePoints.userId, user.id),
              eq(userCyclePoints.isActive, true)
            ));
        } catch (error) {
          console.error('Error updating cycle points for quiz:', error);
        }

        return res.json({ 
          success: true, 
          message: `Earned ${pointsEarned} tickets for quiz completion!`,
          points: pointsEarned
        });
      } else {
        return res.status(400).json({ success: false, message: "Invalid action for auto-approval" });
      }
    } catch (error: any) {
      console.error('Error in /api/points/award:', error);
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

      // Get all premium users with their payment information (excluding admin users)
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
      .where(and(eq(users.subscriptionStatus, 'active'), eq(users.isAdmin, false)))
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
      const { customPoints } = req.body;
      
      // Validate customPoints if provided
      if (customPoints !== undefined) {
        const pointsNum = parseInt(customPoints);
        if (isNaN(pointsNum) || pointsNum <= 0) {
          return res.status(400).json({ 
            success: false, 
            message: "Custom points must be a positive integer" 
          });
        }
      }
      
      // For admin approval, we'll use a placeholder admin ID (1)
      await storage.approveProofUpload(proofId, 1, customPoints);
      res.json({ success: true, message: "Proof approved and tickets awarded" });
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

  // File upload endpoint for proof documents
  app.post("/api/upload/proof", upload.single('proofFile'), async (req, res) => {
    try {
      // Authentication validation
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required for file upload" 
        });
      }

      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid authentication token" 
        });
      }

      // File validation
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file provided for upload" 
        });
      }

      // Additional file size validation (backend verification)
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
      if (req.file.size > maxSizeBytes) {
        return res.status(400).json({ 
          success: false, 
          message: "File size exceeds 10MB limit" 
        });
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid file type. Only images, PDF, and Word documents are allowed" 
        });
      }

      // Generate file URL
      const fileUrl = getFileUrl(req.file.filename);
      
      // Log successful upload for security auditing
      console.log(`[Upload] User ${user.id} (${user.email}) uploaded file: ${req.file.filename} (${req.file.size} bytes)`);

      // Return upload success response
      res.json({ 
        success: true, 
        message: "File uploaded successfully",
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });

    } catch (error: any) {
      console.error('[Upload Error]', error);
      
      // Handle multer-specific errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: "File size exceeds the 10MB limit" 
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          success: false, 
          message: "Unexpected file field. Please use 'proofFile' field name" 
        });
      }

      // Generic error response
      res.status(500).json({ 
        success: false, 
        message: "File upload failed due to server error" 
      });
    }
  });

  // Secure file serving endpoint for uploaded proof documents
  app.get("/api/uploads/:filename", async (req, res) => {
    try {
      // Authentication validation
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required to access files" 
        });
      }

      const user = await getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid authentication token" 
        });
      }

      // Validate and sanitize filename to prevent directory traversal
      const filename = req.params.filename;
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid filename" 
        });
      }

      // Construct file path
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadsDir, filename);
      
      // Verify file exists and is within uploads directory
      const fs = await import('fs/promises');
      try {
        const stats = await fs.stat(filePath);
        
        // Additional security check - ensure resolved path is within uploads directory
        const resolvedPath = path.resolve(filePath);
        const resolvedUploadsDir = path.resolve(uploadsDir);
        
        if (!resolvedPath.startsWith(resolvedUploadsDir)) {
          console.warn(`[Security] Attempted path traversal by user ${user.id}: ${filename}`);
          return res.status(403).json({ 
            success: false, 
            message: "Access denied" 
          });
        }

        // Determine content type based on file extension
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream'; // Default

        const mimeTypes: { [key: string]: string } = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        if (mimeTypes[ext]) {
          contentType = mimeTypes[ext];
        }

        // Set security headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
        res.setHeader('Content-Length', stats.size);
        
        // Security headers to prevent caching sensitive files
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Log file access for security auditing
        console.log(`[File Access] User ${user.id} (${user.email}) accessed file: ${filename}`);

        // Stream file to response
        const fileStream = (await import('fs')).createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
          console.error('[File Serving Error]', error);
          if (!res.headersSent) {
            res.status(500).json({ 
              success: false, 
              message: "Error reading file" 
            });
          }
        });

      } catch (fileError: any) {
        if (fileError.code === 'ENOENT') {
          return res.status(404).json({ 
            success: false, 
            message: "File not found" 
          });
        }
        
        console.error('[File Access Error]', fileError);
        return res.status(500).json({ 
          success: false, 
          message: "Error accessing file" 
        });
      }

    } catch (error: any) {
      console.error('[File Serving Error]', error);
      res.status(500).json({ 
        success: false, 
        message: "File serving failed due to server error" 
      });
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
      // Handle both string and number actionId for flexibility
      const actionIdNumber = typeof actionId === 'string' ? parseInt(actionId, 10) : actionId;
      const action = actions.find(a => a.id === actionIdNumber);

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
      res.json({ success: true, message: "Tickets awarded successfully" });
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
      res.json({ success: true, message: "Tickets deducted successfully" });
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
        history: history.map(h => ({
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

  // Note: Using unified requireAdmin middleware defined at top of file

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

  // Removed duplicate endpoint - using the complete one at line 2765

  app.put("/api/admin/cycle-settings/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { cycleName, cycleStartDate, cycleEndDate, rewardPoolPercentage, membershipFee, minimumPoolGuarantee, isActive } = req.body;

      const updates: any = {};
      if (cycleName) updates.cycleName = cycleName;
      if (cycleStartDate) updates.cycleStartDate = new Date(cycleStartDate);
      if (cycleEndDate) updates.cycleEndDate = new Date(cycleEndDate);
      if (rewardPoolPercentage !== undefined) updates.rewardPoolPercentage = parseInt(rewardPoolPercentage);
      if (membershipFee !== undefined) updates.membershipFee = parseInt(membershipFee);
      if (minimumPoolGuarantee !== undefined) updates.minimumPoolGuarantee = parseInt(minimumPoolGuarantee);
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
  app.post("/api/admin/disbursements/calculate", requireAdmin, async (req, res) => {
    try {

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

  app.post("/api/admin/disbursements/process", requireAdmin, async (req, res) => {
    try {

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



  app.get("/api/admin/disbursements/history", requireAdmin, async (req, res) => {
    try {

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



  // ============================================================================
  // STEP 5: DRY-RUN PREVIEW ENDPOINT FOR PAYPAL DISBURSEMENTS
  // ============================================================================
  
  // Import Step 4 transaction orchestrator
  const { PaypalTransactionOrchestrator } = await import('./paypal-transaction-orchestrator.js');

  // Preview PayPal disbursements for selected cycle winners (dry-run)
  app.post("/api/admin/winner-cycles/:cycleId/preview-disbursements", requireAdmin, async (req, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const { selectedWinnerIds, processAll } = req.body;

      // Validate payload: either processAll OR selectedWinnerIds, not both or neither
      if (processAll && selectedWinnerIds) {
        return res.status(400).json({ error: "Cannot specify both processAll and selectedWinnerIds" });
      }
      if (!processAll && (!selectedWinnerIds || selectedWinnerIds.length === 0)) {
        return res.status(400).json({ error: "Must specify either processAll: true or provide selectedWinnerIds array" });
      }

      console.log(`[STEP 5 PREVIEW] Generating disbursement preview for cycle ${cycleId}, mode: ${processAll ? 'processAll' : 'selective'}`);

      // Get the cycle setting to verify it exists
      const cycleResult = await db.select().from(cycleSettings).where(eq(cycleSettings.id, cycleId)).limit(1);
      if (cycleResult.length === 0) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      const cycle = cycleResult[0];

      let winnersToProcess: number[];
      let totalEligibleCount = 0;

      if (processAll) {
        // Server-side eligibility computation for bulk mode
        const eligibleWinners = await db
          .select({ id: cycleWinnerSelections.id })
          .from(cycleWinnerSelections)
          .leftJoin(users, eq(cycleWinnerSelections.userId, users.id))
          .where(and(
            eq(cycleWinnerSelections.cycleSettingId, cycleId),
            eq(cycleWinnerSelections.isSealed, true),
            inArray(cycleWinnerSelections.payoutStatus, ['pending']),
            isNotNull(users.paypalEmail)
          ));

        winnersToProcess = eligibleWinners.map(w => w.id);
        totalEligibleCount = winnersToProcess.length;
        console.log(`[STEP 5 PREVIEW] Bulk mode: found ${totalEligibleCount} eligible winners`);

        if (winnersToProcess.length === 0) {
          return res.json({
            success: true,
            preview: {
              previewMode: true,
              eligibleRecipients: 0,
              totalAmount: 0,
              validationResults: {
                errors: [],
                warnings: ["No eligible winners found for bulk processing"]
              },
              recipients: [],
              paypalPayloadPreview: null
            }
          });
        }
      } else {
        // Selective mode: validate selectedWinnerIds belong to this cycle
        const cycleValidation = await db
          .select({ id: cycleWinnerSelections.id })
          .from(cycleWinnerSelections)
          .where(and(
            eq(cycleWinnerSelections.cycleSettingId, cycleId),
            inArray(cycleWinnerSelections.id, selectedWinnerIds)
          ));

        if (cycleValidation.length !== selectedWinnerIds.length) {
          const invalidIds = selectedWinnerIds.filter(id => !cycleValidation.some(v => v.id === id));
          return res.status(400).json({ 
            error: `Invalid winner IDs for cycle ${cycleId}: ${invalidIds.join(', ')}. These IDs do not belong to this cycle.`
          });
        }

        winnersToProcess = selectedWinnerIds;
        console.log(`[STEP 5 PREVIEW] Selective mode: processing ${winnersToProcess.length} selected winners`);
      }

      // Get detailed winner information for preview (unified for both modes)
      const winners = await db
        .select({
          id: cycleWinnerSelections.id,
          userId: cycleWinnerSelections.userId,
          username: users.username,
          email: users.email,
          paypalEmail: users.paypalEmail,
          tier: cycleWinnerSelections.tier,
          tierRank: cycleWinnerSelections.tierRank,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          payoutStatus: cycleWinnerSelections.payoutStatus,
          isSealed: cycleWinnerSelections.isSealed
        })
        .from(cycleWinnerSelections)
        .leftJoin(users, eq(cycleWinnerSelections.userId, users.id))
        .where(and(
          eq(cycleWinnerSelections.cycleSettingId, cycleId),
          inArray(cycleWinnerSelections.id, winnersToProcess)
        ));

      if (winners.length === 0) {
        return res.json({
          success: true,
          preview: {
            previewMode: true,
            eligibleRecipients: 0,
            totalAmount: 0,
            validationResults: {
              errors: [],
              warnings: ["No valid winners found for processing"]
            },
            recipients: [],
            paypalPayloadPreview: null
          }
        });
      }

      // Verify selection is sealed/final
      if (!winners.some(w => w.isSealed)) {
        return res.status(400).json({ error: "Winner selection must be sealed before previewing disbursements" });
      }

      // Step 5: Preview Endpoint Parity - Apply same email validation as main disbursement endpoint
      console.log('[STEP 5 PREVIEW] Applying comprehensive email validation for preview parity');

      // Phase 1: Normalize all emails first for consistent processing (Step 2 Parity)
      const normalizedWinners = winners.map(winner => ({
        ...winner,
        normalizedPaypalEmail: normalizeEmail(winner.paypalEmail)
      }));

      // Phase 2: Split into valid and invalid email recipients (Step 2 Parity)
      const validEmailWinners = normalizedWinners.filter(w => isValidPaypalEmail(w.paypalEmail));
      const invalidEmailWinners = normalizedWinners.filter(w => !isValidPaypalEmail(w.paypalEmail));
      
      // Phase 3: Log invalid email winners with PII-safe masking (Step 3 Parity - Logging Only)
      const invalidEmailDetails = invalidEmailWinners.map(winner => {
        const maskedEmail = winner.paypalEmail ? maskEmailForLogging(winner.paypalEmail) : '(empty)';
        const reasonCode = !winner.paypalEmail ? EMAIL_VALIDATION_REASONS.MISSING_EMAIL 
                         : winner.paypalEmail.trim() === '' ? EMAIL_VALIDATION_REASONS.EMPTY_EMAIL 
                         : EMAIL_VALIDATION_REASONS.INVALID_FORMAT;
        
        let reasonDetails = '';
        if (!winner.paypalEmail) {
          reasonDetails = 'No PayPal email provided';
        } else if (winner.paypalEmail.trim() === '') {
          reasonDetails = 'Empty PayPal email address';  
        } else {
          reasonDetails = 'Invalid PayPal email format';
        }

        console.log(`[STEP 5 PREVIEW] Invalid email: UserId ${winner.userId}, Email: ${maskedEmail}, Reason: ${reasonCode}`);
        
        return {
          id: winner.id,
          username: winner.username || 'Unknown',
          email: winner.email,
          paypalEmail: winner.paypalEmail || '(empty)',
          reason: `Invalid PayPal email: ${reasonDetails}`,
          reasonCode,
          category: 'email_validation'
        };
      });

      // Phase 4: Empty batch protection after email validation (Step 4 Parity)  
      if (validEmailWinners.length === 0) {
        const invalidEmailCount = invalidEmailWinners.length;
        console.log(`[STEP 5 PREVIEW] Empty batch protection: 0 valid emails, ${invalidEmailCount} invalid emails`);
        
        return res.json({
          success: true,
          preview: {
            previewMode: true,
            eligibleRecipients: 0,
            totalAmount: 0,
            breakdown: {
              totalSelected: winners.length,
              validEmails: 0,
              invalidEmails: invalidEmailCount,
              validAmounts: 0,
              invalidAmounts: 0,
              finalValid: 0
            },
            validationResults: {
              errors: [`Email validation failed: 0 valid, ${invalidEmailCount} invalid email(s)`],
              warnings: ["All selected winners have invalid PayPal email addresses"]
            },
            recipients: [],
            paypalPayloadPreview: null,
            invalidRecipients: invalidEmailDetails,
            userMessage: "All selected winners have invalid PayPal email addresses. Please update the winner email addresses before processing disbursements.",
            actionRequired: "fix_paypal_emails",
            nextSteps: [
              "Review the invalid recipients list below",
              "Update PayPal email addresses for invalid recipients", 
              "Verify email addresses are in valid format (user@domain.com)",
              "Retry preview after fixing email addresses"
            ]
          }
        });
      }

      // Phase 5: Currency and amount validation for valid email winners (Step 2 Parity)
      const validationResults = validEmailWinners.map(winner => {
        const amount = winner.payoutFinal || 0;
        const validation = validateCurrencyAmount(amount, 'USD');
        return {
          winner,
          validation,
          validatedAmount: validation.normalizedAmount || 0,
          originalAmount: amount
        };
      });

      const validRecipients = validationResults.filter(r => r.validation.valid);
      const invalidAmountRecipients = validationResults.filter(r => !r.validation.valid);

      // Log amount validation failures for preview
      const invalidAmountDetails = invalidAmountRecipients.map(({ winner, validation }) => {
        console.log(`[STEP 5 PREVIEW] Invalid amount: UserId ${winner.userId}, Amount: ${winner.payoutFinal || 0}, Error: ${validation.error}`);
        return {
          id: winner.id,
          username: winner.username || 'Unknown',
          email: winner.email,
          paypalEmail: winner.paypalEmail,
          amount: winner.payoutFinal || 0,
          reason: `Amount validation: ${validation.error}`,
          category: 'amount_validation'
        };
      });

      // Phase 6: Final empty batch protection after amount validation (Step 4 Parity)
      if (validRecipients.length === 0) {
        const invalidEmailCount = invalidEmailWinners.length;
        const invalidAmountCount = invalidAmountRecipients.length;
        const totalFailures = invalidEmailCount + invalidAmountCount;
        
        const allFailures = [...invalidEmailDetails, ...invalidAmountDetails];
        
        console.log(`[STEP 5 PREVIEW] Final empty batch protection: 0 valid recipients, ${totalFailures} total failures`);
        
        return res.json({
          success: true,
          preview: {
            previewMode: true,
            eligibleRecipients: 0,
            totalAmount: 0,
            breakdown: {
              totalSelected: winners.length,
              validEmails: validEmailWinners.length,
              invalidEmails: invalidEmailCount,
              validAmounts: validRecipients.length,
              invalidAmounts: invalidAmountCount,
              finalValid: 0
            },
            validationResults: {
              errors: [`Final validation failed: 0 valid, ${invalidEmailCount} email failures, ${invalidAmountCount} amount failures`],
              warnings: ["All selected winners failed validation checks"]
            },
            recipients: [],
            paypalPayloadPreview: null,
            invalidRecipients: allFailures,
            userMessage: "All selected winners failed validation checks. Please review and fix the validation issues before processing disbursements.",
            actionRequired: "fix_validation_issues",
            nextSteps: [
              `Fix ${invalidEmailCount} invalid PayPal email addresses`,
              `Resolve ${invalidAmountCount} invalid payout amounts`, 
              "Verify all winners have valid PayPal emails in format (user@domain.com)",
              "Ensure all payout amounts are positive USD values",
              "Retry preview after fixing all validation issues"
            ]
          }
        });
      }

      // Step 5: Create transaction context using validated recipients with normalized emails (Parity)
      const recipients = validRecipients.map(result => ({
        cycleWinnerSelectionId: result.winner.id,
        userId: result.winner.userId,
        paypalEmail: result.winner.normalizedPaypalEmail,  // Use pre-normalized email for consistency
        amount: result.validatedAmount,                     // Use validated amount in cents
        currency: "USD",
        note: `FinBoost Cycle ${cycle.cycleName} Reward - Tier ${result.winner.tier}`
      }));

      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

      const transactionContext = {
        cycleSettingId: cycleId,
        adminId: req.user.id,
        recipients,
        totalAmount,
        requestId: `preview_${cycleId}_${Date.now()}`
      };

      // Execute ONLY Phase 1 from Step 4 orchestrator for dry-run preview
      console.log('[STEP 5 PREVIEW] Executing Phase 1 validation and preparation');
      const orchestrator = new PaypalTransactionOrchestrator();
      const phase1Result = await (orchestrator as any).executePhase1(transactionContext);

      // Clean up any intent records created during preview (they're not real transactions)
      if (phase1Result.batchId) {
        try {
          console.log(`[STEP 5 PREVIEW] Cleaning up preview intent batch: ${phase1Result.batchId}`);
          await storage.deletePayoutBatch(phase1Result.batchId);
        } catch (cleanupError) {
          console.warn('[STEP 5 PREVIEW] Preview cleanup warning:', cleanupError);
          // Don't fail the preview for cleanup issues
        }
      }

      // Step 6: Enhanced Response Format - Comprehensive preview response with structured metadata
      const previewEndTime = new Date();
      const previewStartTime = new Date(previewEndTime.getTime() - 15000); // Approximate 15-second preview processing time
      
      const invalidEmailCount = invalidEmailWinners.length;
      const invalidAmountCount = invalidAmountRecipients.length;
      const allInvalidRecipients = [...invalidEmailDetails, ...invalidAmountDetails];
      const totalInvalidCount = invalidEmailCount + invalidAmountCount;
      
      console.log(`[STEP 5 PREVIEW] Validation summary: ${validRecipients.length} valid, ${invalidEmailCount} email failures, ${invalidAmountCount} amount failures`);
      
      const previewResponse = {
        success: true,
        operation: "preview_disbursements",
        timestamp: previewEndTime.toISOString(),
        
        // Preview context and metadata
        context: {
          cycleId,
          cycleName: cycle.cycleName,
          processMode: processAll ? 'processAll' : 'selective',
          previewedBy: {
            adminId: req.user.id,
            timestamp: previewEndTime.toISOString()
          },
          processingTime: {
            startedAt: previewStartTime.toISOString(),
            completedAt: previewEndTime.toISOString(),
            durationMs: 15000 // Approximate preview processing time
          }
        },
        
        // Preview-specific results
        preview: {
          previewMode: true,
          validationOnly: true, // No actual PayPal processing performed
          eligibleRecipients: validRecipients.length,
          totalRecipients: winners.length,
          totalAmount: totalAmount, // In cents
          totalAmountUSD: (totalAmount / 100).toFixed(2),
          
          // Comprehensive validation and processing breakdown
          breakdown: {
            totalSelected: winners.length,
            validEmails: validEmailWinners.length,
            invalidEmails: invalidEmailCount,
            validAmounts: validRecipients.length,
            invalidAmounts: invalidAmountCount,
            finalValid: validRecipients.length,
            wouldProcessByPayPal: validRecipients.length // What would be sent to PayPal
          },
          
          // Validation results and predictions
          validationResults: {
            success: phase1Result.success && validRecipients.length > 0,
            readyForProcessing: validRecipients.length > 0 && totalInvalidCount === 0,
            errors: [
              ...phase1Result.errors,
              ...(invalidEmailCount > 0 ? [`${invalidEmailCount} invalid email address(es)`] : []),
              ...(invalidAmountCount > 0 ? [`${invalidAmountCount} invalid payout amount(s)`] : [])
            ],
            warnings: [
              ...phase1Result.warnings,
              ...(allInvalidRecipients.length > 0 ? [`${allInvalidRecipients.length} recipient(s) failed validation and will be skipped`] : [])
            ]
          },
          
          // Valid recipients ready for processing
          recipients: validRecipients.map((result, index) => ({
            cycleWinnerSelectionId: result.winner.id,
            userId: result.winner.userId,
            username: result.winner.username,
            email: result.winner.email,
            paypalEmail: result.winner.normalizedPaypalEmail, // Show normalized email
            originalPaypalEmail: result.winner.paypalEmail,   // Show original for comparison
            tier: result.winner.tier,
            tierRank: result.winner.tierRank,
            amount: recipients[index].amount, // In cents
            amountUSD: (recipients[index].amount / 100).toFixed(2),
            payoutStatus: result.winner.payoutStatus,
            validationStatus: 'valid'
          })),
          
          // Invalid recipients and categorization
          invalidRecipients: allInvalidRecipients,
          
          // PayPal preview data
          paypalPayloadPreview: phase1Result.success ? {
            senderBatchId: phase1Result.senderBatchId,
            itemCount: phase1Result.paypalPayload?.items?.length || 0,
            sampleItems: phase1Result.paypalPayload?.items?.slice(0, 3) || []
          } : null,
          
          // Idempotency and processing readiness
          idempotencyData: phase1Result.success ? {
            senderBatchId: phase1Result.senderBatchId,
            requestChecksum: phase1Result.requestChecksum
          } : null
        },
        
        // Status indicators
        status: {
          readyForProcessing: validRecipients.length > 0 && totalInvalidCount === 0,
          hasValidationFailures: totalInvalidCount > 0,
          requiresDataFixes: totalInvalidCount > 0,
          canProceed: validRecipients.length > 0
        },
        
        // Admin guidance and next steps
        guidance: {
          ...(totalInvalidCount === 0 && validRecipients.length > 0 && {
            readyToProcess: [
              `${validRecipients.length} recipients are valid and ready for disbursement`,
              "All validation checks passed - safe to proceed with actual processing"
            ]
          }),
          ...(totalInvalidCount > 0 && {
            validationIssues: [
              ...(invalidEmailCount > 0 ? [`${invalidEmailCount} recipients have invalid PayPal email addresses`] : []),
              ...(invalidAmountCount > 0 ? [`${invalidAmountCount} recipients have invalid payout amounts`] : [])
            ],
            nextSteps: [
              "Review invalid recipients list below",
              "Fix validation issues before processing",
              "Re-run preview after fixes to confirm readiness",
              "Proceed with disbursement only after all validation passes"
            ]
          }),
          actionRequired: totalInvalidCount > 0 ? "fix_validation_issues" : "ready_to_process"
        }
      };

      console.log(`[STEP 5 PREVIEW] Preview generated successfully: ${validRecipients.length} recipients, $${(totalAmount / 100).toFixed(2)} total`);
      res.json(previewResponse);

    } catch (error) {
      console.error("[STEP 5 PREVIEW] Error generating disbursement preview:", error);
      res.status(500).json({ error: "Failed to generate disbursement preview" });
    }
  });

  // ============================================================================
  // STEP 6: MANUAL RETRY AND ADMIN OVERRIDE ENDPOINTS
  // ============================================================================

  /**
   * Manual retry endpoint for failed disbursement batches
   */
  app.post('/api/admin/disbursements/:batchId/retry', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      const { retryPolicy } = req.body;
      const adminId = req.user?.id || 1;

      console.log(`[STEP 6 RETRY] Manual retry requested for batch ${batchId} by admin ${adminId}`);

      // Load orchestrator
      const { PaypalTransactionOrchestrator } = await import('./paypal-transaction-orchestrator.js');
      const orchestrator = new PaypalTransactionOrchestrator();

      // Execute retry
      const result = await orchestrator.retryTransaction(batchId, retryPolicy);

      if (result.success) {
        res.json({
          success: true,
          message: `Batch ${batchId} retry completed successfully`,
          batchId: result.phase1.batchId,
          paypalBatchId: result.phase2?.paypalBatchId,
          processedCount: result.phase2?.processedCount || 0,
          successfulCount: result.phase2?.successfulCount || 0,
          failedCount: result.phase2?.failedCount || 0,
          pendingCount: result.phase2?.pendingCount || 0
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Retry failed',
          details: result.errors,
          rollbackPerformed: result.rollbackPerformed
        });
      }

    } catch (error) {
      console.error('[STEP 6 RETRY] Manual retry error:', error);
      res.status(500).json({
        success: false,
        error: 'Manual retry failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Get batch status and retry information
   */
  app.get('/api/admin/disbursements/:batchId/status', requireAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.batchId);

      const batch = await storage.getPayoutBatch(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          error: 'Batch not found'
        });
      }

      const batchItems = await storage.getPayoutBatchItems(batchId);

      res.json({
        success: true,
        batch: {
          id: batch.id,
          status: batch.status,
          senderBatchId: batch.senderBatchId,
          paypalBatchId: batch.paypalBatchId,
          totalAmount: batch.totalAmount,
          totalRecipients: batch.totalRecipients,
          successfulCount: batch.successfulCount,
          failedCount: batch.failedCount,
          pendingCount: batch.pendingCount,
          retryCount: batch.retryCount || 0,
          lastRetryAt: batch.lastRetryAt,
          lastRetryError: batch.lastRetryError,
          errorDetails: batch.errorDetails,
          createdAt: batch.createdAt,
          updatedAt: batch.updatedAt
        },
        items: batchItems.map(item => ({
          id: item.id,
          userId: item.userId,
          recipientEmail: item.paypalEmail,
          amount: item.amount,
          status: item.status,
          paypalItemId: item.paypalItemId,
          errorDetails: item.errorMessage
        }))
      });

    } catch (error) {
      console.error('[STEP 6 STATUS] Batch status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get batch status',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Override batch status (for manual intervention)
   */
  app.post('/api/admin/disbursements/:batchId/override-status', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      const { newStatus, reason } = req.body;
      const adminId = req.user?.id || 1;

      console.log(`[STEP 6 OVERRIDE] Status override for batch ${batchId} to ${newStatus} by admin ${adminId}`);

      // Validate new status
      const validStatuses = ['intent', 'processing', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Update batch status
      await storage.updatePayoutBatch(batchId, {
        status: newStatus,
        errorDetails: reason ? `Manual override by admin ${adminId}: ${reason}` : undefined,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: `Batch ${batchId} status updated to ${newStatus}`,
        newStatus,
        reason,
        updatedBy: adminId
      });

    } catch (error) {
      console.error('[STEP 6 OVERRIDE] Status override error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to override batch status',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================================================
  // STEP 7: RECONCILIATION ENDPOINT
  // ============================================================================

  /**
   * Reconcile payout batch with PayPal - fetch latest status for PENDING/UNCLAIMED items
   */
  app.post('/api/admin/payout-batches/:batchId/reconcile', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      const adminId = req.user?.id || 1;

      console.log(`[STEP 7 RECONCILE] Reconciliation requested for batch ${batchId} by admin ${adminId}`);

      // Step 1: Get batch from database to verify it exists and get PayPal batch ID
      const batch = await storage.getPayoutBatch(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          error: 'Batch not found'
        });
      }

      if (!batch.paypalBatchId) {
        return res.status(400).json({
          success: false,
          error: 'Batch has no PayPal batch ID - cannot reconcile unprocessed batch'
        });
      }

      console.log(`[STEP 7 RECONCILE] Found batch ${batchId} with PayPal ID ${batch.paypalBatchId}, current status: ${batch.status}`);

      // Step 2: Get current database status for comparison
      const priorItems = await storage.getPayoutBatchItems(batchId);
      const priorCounts = priorItems.reduce((acc, item) => {
        switch (item.status) {
          case 'success': acc.successful++; break;
          case 'failed': acc.failed++; break;
          case 'pending': 
          case 'unclaimed': acc.pending++; break;
        }
        return acc;
      }, { successful: 0, failed: 0, pending: 0 });

      console.log(`[STEP 7 RECONCILE] Prior status - Successful: ${priorCounts.successful}, Failed: ${priorCounts.failed}, Pending: ${priorCounts.pending}`);

      // Step 3: Fetch latest status from PayPal API
      const { getEnhancedPayoutStatus } = await import('./paypal.js');
      const latestPaypalResponse = await getEnhancedPayoutStatus(batch.paypalBatchId);

      console.log(`[STEP 7 RECONCILE] PayPal API response - Batch status: ${latestPaypalResponse.batchStatus}, Items: ${latestPaypalResponse.individualResults.length}`);

      // Step 4: Process PayPal response to update database
      const updateResults = await storage.processPaypalResponseResults(batchId, latestPaypalResponse);

      console.log(`[STEP 7 RECONCILE] Database update results:`, {
        batchUpdated: updateResults.batchUpdated,
        itemsUpdated: updateResults.itemsUpdated,
        successfulPayouts: updateResults.successfulPayouts,
        failedPayouts: updateResults.failedPayouts,
        pendingPayouts: updateResults.pendingPayouts,
        cycleCompleted: updateResults.cycleCompleted
      });

      // Step 5: Get updated status for comparison
      const updatedItems = await storage.getPayoutBatchItems(batchId);
      const updatedCounts = updatedItems.reduce((acc, item) => {
        switch (item.status) {
          case 'success': acc.successful++; break;
          case 'failed': acc.failed++; break;
          case 'pending': 
          case 'unclaimed': acc.pending++; break;
        }
        return acc;
      }, { successful: 0, failed: 0, pending: 0 });

      // Step 6: Calculate what changed during reconciliation
      const statusChanges = {
        successfulDelta: updatedCounts.successful - priorCounts.successful,
        failedDelta: updatedCounts.failed - priorCounts.failed,
        pendingDelta: updatedCounts.pending - priorCounts.pending
      };

      console.log(`[STEP 7 RECONCILE] Status changes - Successful: +${statusChanges.successfulDelta}, Failed: +${statusChanges.failedDelta}, Pending: ${statusChanges.pendingDelta}`);

      // Step 7: Return comprehensive reconciliation results
      res.json({
        success: true,
        message: `Batch ${batchId} reconciled successfully with PayPal`,
        reconciliationResults: {
          batchId: batchId,
          paypalBatchId: batch.paypalBatchId,
          batchStatus: latestPaypalResponse.batchStatus,
          itemsProcessed: updateResults.itemsUpdated,
          cycleCompleted: updateResults.cycleCompleted,
          priorStatus: {
            successful: priorCounts.successful,
            failed: priorCounts.failed,
            pending: priorCounts.pending
          },
          updatedStatus: {
            successful: updatedCounts.successful,
            failed: updatedCounts.failed,
            pending: updatedCounts.pending
          },
          statusChanges: {
            newSuccessful: statusChanges.successfulDelta,
            newFailed: statusChanges.failedDelta,
            resolvedPending: Math.abs(statusChanges.pendingDelta)
          },
          paypalSyncTimestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[STEP 7 RECONCILE] Reconciliation error:', error);
      
      // Enhanced error handling for common scenarios
      if (error instanceof Error) {
        if (error.message.includes('PayPal Payout Status API error')) {
          return res.status(502).json({
            success: false,
            error: 'PayPal API error during reconciliation',
            details: 'Unable to fetch latest status from PayPal. Please try again later.',
            technical: error.message
          });
        }
        
        if (error.message.includes('Failed to parse PayPal response')) {
          return res.status(502).json({
            success: false,
            error: 'PayPal response parsing error',
            details: 'Received invalid data from PayPal API',
            technical: error.message
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Reconciliation failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Phase 3: Rate Limiting Storage (In-memory for simplicity, could use Redis in production)
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  
  function checkRateLimit(adminId: number, cycleId: number): { allowed: boolean; resetTime?: number; currentCount?: number } {
    const key = `admin_${adminId}_cycle_${cycleId}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    
    const current = rateLimitStore.get(key);
    
    if (!current || now >= current.resetTime) {
      // Reset or initialize
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }
    
    if (current.count >= 1) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        resetTime: current.resetTime,
        currentCount: current.count
      };
    }
    
    // Increment count
    current.count++;
    return { allowed: true, currentCount: current.count };
  }

  // Phase 3: Enhanced structured logging with IP tracking and comprehensive audit trails
  function createBatchLogger(batchId: string, cycleId: number, adminId: number, adminEmail?: string, requestIP?: string) {
    const prefix = `[PHASE 3 BATCH-${batchId}]`;
    return {
      start: (mode: string, eligibleCount: number) => {
        console.log(`${prefix} BATCH START - CycleId: ${cycleId}, AdminId: ${adminId}, AdminEmail: ${adminEmail || 'N/A'}, RequestIP: ${requestIP || 'N/A'}, Mode: ${mode}, EligibleCount: ${eligibleCount}, Timestamp: ${new Date().toISOString()}`);
      },
      end: (processedCount: number, failedCount: number, paypalBatchId?: string) => {
        console.log(`${prefix} BATCH END - ProcessedCount: ${processedCount}, FailedCount: ${failedCount}, PayPalBatchId: ${paypalBatchId || 'N/A'}, Duration: ${Date.now()}, Timestamp: ${new Date().toISOString()}`);
      },
      item: (userId: number, amount: number, status: 'success' | 'failed', reason?: string) => {
        console.log(`${prefix} ITEM RESULT - UserId: ${userId}, Amount: ${amount}, Status: ${status}, Reason: ${reason || 'N/A'}, Timestamp: ${new Date().toISOString()}`);
      },
      validation: (type: string, message: string) => {
        console.log(`${prefix} VALIDATION - Type: ${type}, Message: ${message}, Timestamp: ${new Date().toISOString()}`);
      },
      concurrency: (message: string) => {
        console.log(`${prefix} CONCURRENCY - ${message}, Timestamp: ${new Date().toISOString()}`);
      },
      rateLimit: (message: string, details: any) => {
        console.log(`${prefix} RATE_LIMIT - ${message}, Details: ${JSON.stringify(details)}, Timestamp: ${new Date().toISOString()}`);
      },
      audit: (action: string, details: any) => {
        console.log(`${prefix} AUDIT - Action: ${action}, Details: ${JSON.stringify(details)}, AdminId: ${adminId}, AdminEmail: ${adminEmail || 'N/A'}, RequestIP: ${requestIP || 'N/A'}, Timestamp: ${new Date().toISOString()}`);
      }
    };
  }

  // Step 8: Currency and amount validation utilities
  function validateCurrencyAmount(amount: any, currency: any): { valid: boolean; error?: string; normalizedAmount?: number } {
    // Currency validation
    if (!currency || typeof currency !== 'string') {
      return { valid: false, error: 'Currency must be a non-empty string' };
    }
    
    if (currency.toUpperCase() !== 'USD') {
      return { valid: false, error: 'Only USD currency is supported' };
    }

    // Amount validation
    if (amount === null || amount === undefined) {
      return { valid: false, error: 'Amount is required' };
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    if (isNaN(numAmount)) {
      return { valid: false, error: 'Amount must be a valid number' };
    }

    if (numAmount < 0) {
      return { valid: false, error: 'Amount must be non-negative' };
    }

    if (numAmount === 0) {
      return { valid: false, error: 'Amount must be greater than zero' };
    }

    // Check for more than 2 decimal places (cents precision)
    const rounded = Math.round(numAmount * 100) / 100;
    if (Math.abs(numAmount - rounded) > 0.001) {
      return { valid: false, error: 'Amount must have at most 2 decimal places' };
    }

    // Amount is already in cents from the database - DO NOT multiply by 100 again!
    // payoutFinal is stored as cents (1666 = $16.66)
    const normalizedAmount = Math.round(numAmount);

    return { valid: true, normalizedAmount };
  }

  // Step 8: Concurrency protection - check for existing open batches
  async function checkConcurrentBatches(cycleId: number, currentBatchId: string): Promise<{ hasConflict: boolean; conflictDetails?: any }> {
    try {
      // Check for existing open payout batches for this cycle
      const openBatches = await storage.getPayoutBatchesByCycle(cycleId);
      const activeBatches = openBatches.filter(batch => 
        batch.status === 'processing' && 
        batch.id !== currentBatchId &&
        batch.createdAt && 
        (new Date().getTime() - new Date(batch.createdAt).getTime()) < 3600000 // Within last hour
      );

      if (activeBatches.length > 0) {
        return {
          hasConflict: true,
          conflictDetails: {
            count: activeBatches.length,
            batchIds: activeBatches.map(b => b.id),
            oldestBatch: activeBatches[0]?.createdAt
          }
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('[STEP 8 CONCURRENCY] Error checking concurrent batches:', error);
      // On error, assume potential conflict to be safe
      return { hasConflict: true, conflictDetails: { error: 'Unable to verify concurrent batches' } };
    }
  }

  // Email Validation Infrastructure (Step 1)
  
  // Reason codes for failed email validation
  const EMAIL_VALIDATION_REASONS = {
    EMPTY_EMAIL: 'invalid_paypal_email',
    INVALID_FORMAT: 'invalid_paypal_email', 
    MISSING_EMAIL: 'invalid_paypal_email'
  } as const;

  // Normalize email: trim whitespace and convert to lowercase for consistent processing
  function normalizeEmail(rawEmail?: string | null): string {
    if (!rawEmail) return '';
    return rawEmail.trim().toLowerCase();
  }

  // Validate PayPal email format with conservative regex (PayPal doesn't require RFC 5322 compliance)
  function isValidPaypalEmail(raw?: string | null): raw is string {
    if (!raw) return false;
    const email = normalizeEmail(raw);
    if (!email) return false;
    
    // Conservative email validation - basic format check for PayPal compatibility
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return basicEmailRegex.test(email);
  }

  // Mask email for PII-safe logging (a***@d***.com format)
  function maskEmailForLogging(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***.***';
    }
    
    const [localPart, domain] = email.split('@');
    const domainParts = domain.split('.');
    
    const maskedLocal = localPart.length > 1 
      ? localPart[0] + '*'.repeat(Math.min(localPart.length - 1, 3))
      : '*';
      
    const maskedDomain = domainParts.length > 1 
      ? domainParts[0][0] + '*'.repeat(Math.min(domainParts[0].length - 1, 2)) + '.' + domainParts.slice(1).join('.')
      : '***.***';
      
    return `${maskedLocal}@${maskedDomain}`;
  }

  // Process PayPal disbursements for selected cycle winners (Phases 1-3: Complete Integration)
  app.post("/api/admin/winner-cycles/:cycleId/process-disbursements", requireAdmin, async (req: AuthenticatedRequest, res) => {
    const cycleId = parseInt(req.params.cycleId);
    const { selectedWinnerIds, processAll } = req.body;
    const adminId = req.user?.id || 1;
    const adminEmail = req.user?.email || 'unknown@admin.com';
    const requestIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Generate deterministic batch ID for logging (will be replaced by orchestrator's batch ID)
    const tempBatchId = `temp_${cycleId}_${Date.now()}`;
    const logger = createBatchLogger(tempBatchId, cycleId, adminId, adminEmail, requestIP);

    try {
      // Phase 3: Rate limiting check (1 request per cycle per minute per admin)
      const rateLimitCheck = checkRateLimit(adminId, cycleId);
      if (!rateLimitCheck.allowed) {
        const resetInSeconds = Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000);
        logger.rateLimit('RATE_LIMIT_EXCEEDED', {
          adminId,
          cycleId,
          currentCount: rateLimitCheck.currentCount,
          resetInSeconds,
          adminEmail,
          requestIP
        });
        return res.status(429).json({
          error: "Rate limit exceeded",
          details: `Maximum 1 disbursement request per cycle per minute. Try again in ${resetInSeconds} seconds.`,
          userMessage: `Please wait ${resetInSeconds} seconds before trying again. This prevents accidental duplicate disbursements.`,
          rateLimitInfo: {
            resetInSeconds,
            maxRequests: 1,
            windowMinutes: 1
          },
          actionRequired: "wait_and_retry"
        });
      }
      
      logger.rateLimit('RATE_LIMIT_PASSED', { adminId, cycleId, requestCount: rateLimitCheck.currentCount || 1 });

      // Phase 3: Enhanced audit trail - log operation initiation with comprehensive details
      logger.audit('DISBURSEMENT_INITIATED', {
        cycleId,
        processAll: !!processAll,
        selectedWinnerIds: selectedWinnerIds?.length || 0,
        adminId,
        adminEmail,
        requestIP,
        userAgent: req.headers['user-agent'],
        requestTimestamp: new Date().toISOString()
      });

      // Input validation with structured logging
      if (processAll && selectedWinnerIds) {
        logger.validation('PAYLOAD_VALIDATION', 'Cannot specify both processAll and selectedWinnerIds');
        return res.status(400).json({ error: "Cannot specify both processAll and selectedWinnerIds" });
      }
      if (!processAll && (!selectedWinnerIds || selectedWinnerIds.length === 0)) {
        logger.validation('PAYLOAD_VALIDATION', 'Must specify either processAll: true or provide selectedWinnerIds array');
        return res.status(400).json({ error: "Must specify either processAll: true or provide selectedWinnerIds array" });
      }

      // Get the cycle setting to verify it exists
      const cycleResult = await db.select().from(cycleSettings).where(eq(cycleSettings.id, cycleId)).limit(1);
      if (cycleResult.length === 0) {
        logger.validation('CYCLE_VALIDATION', `Cycle ${cycleId} not found`);
        logger.end(0, 0);
        return res.status(404).json({ error: "Cycle not found" });
      }
      const cycle = cycleResult[0];
      logger.audit('CYCLE_VERIFIED', { cycleId, cycleName: cycle.cycleName });

      // Phase 1: Determine eligible winners for processing
      let winnersToProcess: number[];
      let totalEligibleCount = 0;

      if (processAll) {
        // Server-side eligibility computation for bulk mode  
        const eligibleWinners = await db
          .select({ id: cycleWinnerSelections.id })
          .from(cycleWinnerSelections)
          .leftJoin(users, eq(cycleWinnerSelections.userId, users.id))
          .where(and(
            eq(cycleWinnerSelections.cycleSettingId, cycleId),
            eq(cycleWinnerSelections.isSealed, true),
            inArray(cycleWinnerSelections.payoutStatus, ['pending']),
            isNotNull(users.paypalEmail)
          ));

        winnersToProcess = eligibleWinners.map(w => w.id);
        totalEligibleCount = winnersToProcess.length;
        
        logger.audit('ELIGIBILITY_CHECK_BULK', {
          mode: 'processAll',
          totalEligible: totalEligibleCount,
          winnersToProcess: winnersToProcess.slice(0, 10) // Log first 10 for audit
        });

      } else {
        // Selective mode: validate selectedWinnerIds belong to this cycle
        const cycleValidation = await db
          .select({ id: cycleWinnerSelections.id })
          .from(cycleWinnerSelections)
          .where(and(
            eq(cycleWinnerSelections.cycleSettingId, cycleId),
            inArray(cycleWinnerSelections.id, selectedWinnerIds)
          ));

        if (cycleValidation.length !== selectedWinnerIds.length) {
          const invalidIds = selectedWinnerIds.filter((id: any) => !cycleValidation.some(v => v.id === id));
          logger.validation('WINNER_ID_VALIDATION', `Invalid winner IDs: ${invalidIds.join(', ')}`);
          logger.end(0, selectedWinnerIds.length);
          return res.status(400).json({ 
            error: `Invalid winner IDs for cycle ${cycleId}: ${invalidIds.join(', ')}. These IDs do not belong to this cycle.`
          });
        }

        winnersToProcess = selectedWinnerIds;
        totalEligibleCount = winnersToProcess.length;
        
        logger.audit('ELIGIBILITY_CHECK_SELECTIVE', {
          mode: 'selective',
          selectedWinnerIds,
          validatedCount: cycleValidation.length
        });
      }

      // Phase 1 Enhancement: Zero-eligible guard (ChatGPT feedback)
      if (winnersToProcess.length === 0) {
        logger.audit('ZERO_ELIGIBLE_WINNERS', { cycleId, mode: processAll ? 'processAll' : 'selective' });
        logger.end(0, 0);
        return res.status(400).json({
          error: "No eligible winners found for processing", 
          details: "Either all winners have already been processed, lack PayPal emails, or the selection is not sealed.",
          totalEligible: 0
        });
      }

      // Phase 1: Get detailed winner information for processing
      const winners = await db
        .select({
          id: cycleWinnerSelections.id,
          userId: cycleWinnerSelections.userId,
          username: users.username,
          email: users.email,
          paypalEmail: users.paypalEmail,
          tier: cycleWinnerSelections.tier,
          tierRank: cycleWinnerSelections.tierRank,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          payoutCalculated: cycleWinnerSelections.payoutCalculated,
          payoutStatus: cycleWinnerSelections.payoutStatus,
          isSealed: cycleWinnerSelections.isSealed
        })
        .from(cycleWinnerSelections)
        .leftJoin(users, eq(cycleWinnerSelections.userId, users.id))
        .where(and(
          eq(cycleWinnerSelections.cycleSettingId, cycleId),
          inArray(cycleWinnerSelections.id, winnersToProcess)
        ));

      if (winners.length === 0) {
        logger.audit('NO_DETAILED_WINNERS_FOUND', { winnersToProcess, cycleId });
        logger.end(0, 0);
        return res.status(404).json({
          error: "No detailed winner information found",
          details: "Winner IDs were found but detailed information could not be retrieved.",
          totalEligible: totalEligibleCount
        });
      }

      // Phase 1: Verify selection is sealed
      if (!winners.some(w => w.isSealed)) {
        logger.validation('SEAL_STATUS_VALIDATION', 'Winner selection must be sealed before processing disbursements');
        logger.end(0, winners.length);
        return res.status(400).json({ error: "Winner selection must be sealed before processing disbursements" });
      }

      // Step 2: Enhanced Email Validation and Recipient Processing
      // Phase 1: Normalize all emails first for consistent processing
      const normalizedWinners = winners.map(winner => {
        console.log(`[EMAIL DEBUG] Winner ${winner.id}: paypalEmail = "${winner.paypalEmail}", type = ${typeof winner.paypalEmail}`);
        const normalized = normalizeEmail(winner.paypalEmail);
        console.log(`[EMAIL DEBUG] Winner ${winner.id}: normalized = "${normalized}"`);
        return {
          ...winner,
          normalizedPaypalEmail: normalized
        };
      });

      // Phase 2: Split into valid and invalid email recipients  
      const validEmailWinners = normalizedWinners.filter(w => isValidPaypalEmail(w.paypalEmail));
      const invalidEmailWinners = normalizedWinners.filter(w => !isValidPaypalEmail(w.paypalEmail));
      
      // Phase 3: Log invalid email winners with PII-safe masking
      invalidEmailWinners.forEach(winner => {
        const maskedEmail = winner.paypalEmail ? maskEmailForLogging(winner.paypalEmail) : '(empty)';
        const reasonCode = !winner.paypalEmail ? EMAIL_VALIDATION_REASONS.MISSING_EMAIL 
                         : winner.paypalEmail.trim() === '' ? EMAIL_VALIDATION_REASONS.EMPTY_EMAIL 
                         : EMAIL_VALIDATION_REASONS.INVALID_FORMAT;
        
        logger.item(winner.userId, 0, 'failed', `Invalid PayPal email: ${maskedEmail}`);
        logger.validation('EMAIL_VALIDATION_FAILED', `UserId: ${winner.userId}, Email: ${maskedEmail}, Reason: ${reasonCode}`);
      });

      // Step 3: Invalid Recipient Handling - Mark invalid emails as failed in database immediately
      if (invalidEmailWinners.length > 0) {
        try {
          logger.audit('MARKING_INVALID_EMAILS_AS_FAILED', {
            count: invalidEmailWinners.length,
            winnerIds: invalidEmailWinners.map(w => w.id).slice(0, 10) // Log first 10 for audit
          });

          // Prepare detailed reason messages for each invalid email type
          const invalidEmailUpdates = invalidEmailWinners.map(winner => {
            let reasonMessage = 'Invalid PayPal email address';
            let reasonDetails = '';
            
            if (!winner.paypalEmail) {
              reasonDetails = 'No PayPal email provided';
            } else if (winner.paypalEmail.trim() === '') {
              reasonDetails = 'Empty PayPal email address';  
            } else {
              reasonDetails = 'Invalid PayPal email format';
            }

            return {
              winnerId: winner.id,
              reasonMessage: `${reasonMessage}: ${reasonDetails}`,
              reasonCode: EMAIL_VALIDATION_REASONS.INVALID_FORMAT
            };
          });

          // Update cycle_winner_selections for invalid email recipients
          const invalidEmailWinnerIds = invalidEmailWinners.map(w => w.id);
          await db.update(cycleWinnerSelections)
            .set({
              payoutStatus: 'failed',
              payoutError: 'Invalid PayPal email address - unable to process disbursement',
              lastModified: new Date(),
              notificationDisplayed: false // Allow admin to see failure status
            })
            .where(inArray(cycleWinnerSelections.id, invalidEmailWinnerIds));

          logger.audit('INVALID_EMAILS_MARKED_FAILED', {
            updatedCount: invalidEmailWinnerIds.length,
            reasonCode: EMAIL_VALIDATION_REASONS.INVALID_FORMAT,
            timestamp: new Date().toISOString()
          });

          // Log each individual update for audit trail
          invalidEmailUpdates.forEach(update => {
            logger.validation('DATABASE_UPDATE_INVALID_EMAIL', 
              `WinnerId: ${update.winnerId}, Reason: ${update.reasonMessage}, Code: ${update.reasonCode}`
            );
          });

        } catch (dbError) {
          logger.audit('DATABASE_UPDATE_FAILED_INVALID_EMAILS', {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            affectedWinners: invalidEmailWinners.length
          });
          // Continue processing - don't fail entire batch due to database update issues
          console.error('[STEP 3] Failed to mark invalid emails as failed in database:', dbError);
        }
      }
      
      // Step 4: Empty Batch Protection - Enhanced email validation checkpoint
      if (validEmailWinners.length === 0) {
        const invalidEmailCount = invalidEmailWinners.length;
        logger.audit('EMPTY_BATCH_PROTECTION_EMAIL_VALIDATION', {
          totalWinners: winners.length,
          validEmailWinners: 0,
          invalidEmailCount,
          invalidReasons: ['missing_email', 'empty_email', 'invalid_format'],
          protectionTriggered: 'EMAIL_VALIDATION_STAGE'
        });
        logger.end(0, invalidEmailCount);
        
        return res.status(400).json({
          success: false,
          error: "No valid PayPal recipients to process",
          details: `Email validation failed: 0 valid, ${invalidEmailCount} invalid email(s)`,
          userMessage: "All selected winners have invalid PayPal email addresses. Please update the winner email addresses before retrying disbursements.",
          breakdown: {
            totalSelected: winners.length,
            validEmails: 0,
            invalidEmails: invalidEmailCount,
            validAmounts: 0, // Not yet validated
            invalidAmounts: 0 // Not yet validated
          },
          failed: invalidEmailWinners.map(w => ({ 
            id: w.id, 
            username: w.username || 'Unknown',
            email: w.email, 
            paypalEmail: w.paypalEmail || '(empty)',
            reason: EMAIL_VALIDATION_REASONS.INVALID_FORMAT
          })),
          actionRequired: "fix_paypal_emails",
          nextSteps: [
            "Review the failed recipients list above",
            "Update PayPal email addresses for invalid recipients", 
            "Verify email addresses are in valid format (user@domain.com)",
            "Retry disbursement after fixing email addresses"
          ],
          canRetry: true,
          skippedInvalidEmail: invalidEmailCount,
          totalEligible: totalEligibleCount
        });
      }

      // Phase 5: Currency and amount validation for valid email winners
      const validationResults = validEmailWinners.map(winner => {
        const amount = winner.payoutFinal || winner.payoutCalculated || 0;
        const validation = validateCurrencyAmount(amount, 'USD');
        return {
          winner,
          validation,
          validatedAmount: validation.normalizedAmount || 0,
          originalAmount: amount
        };
      });

      const validRecipients = validationResults.filter(r => r.validation.valid);
      const invalidAmountRecipients = validationResults.filter(r => !r.validation.valid);

      // Log amount validation failures
      invalidAmountRecipients.forEach(({ winner, validation }) => {
        logger.item(winner.userId, winner.payoutFinal || 0, 'failed', `Amount validation: ${validation.error}`);
      });

      // Step 3: Invalid Recipient Handling - Mark invalid amounts as failed in database immediately
      if (invalidAmountRecipients.length > 0) {
        try {
          logger.audit('MARKING_INVALID_AMOUNTS_AS_FAILED', {
            count: invalidAmountRecipients.length,
            winnerIds: invalidAmountRecipients.map(r => r.winner.id).slice(0, 10) // Log first 10 for audit
          });

          // Update cycle_winner_selections for invalid amount recipients
          const invalidAmountWinnerIds = invalidAmountRecipients.map(r => r.winner.id);
          await db.update(cycleWinnerSelections)
            .set({
              payoutStatus: 'failed',
              payoutError: 'Invalid payout amount - unable to process disbursement',
              lastModified: new Date(),
              notificationDisplayed: false // Allow admin to see failure status
            })
            .where(inArray(cycleWinnerSelections.id, invalidAmountWinnerIds));

          logger.audit('INVALID_AMOUNTS_MARKED_FAILED', {
            updatedCount: invalidAmountWinnerIds.length,
            reasonCode: 'invalid_payout_amount',
            timestamp: new Date().toISOString()
          });

          // Log each individual amount validation failure for audit trail  
          invalidAmountRecipients.forEach(({ winner, validation }) => {
            logger.validation('DATABASE_UPDATE_INVALID_AMOUNT',
              `WinnerId: ${winner.id}, Amount: ${winner.payoutFinal || winner.payoutCalculated || 0}, Error: ${validation.error}`
            );
          });

        } catch (dbError) {
          logger.audit('DATABASE_UPDATE_FAILED_INVALID_AMOUNTS', {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            affectedWinners: invalidAmountRecipients.length
          });
          // Continue processing - don't fail entire batch due to database update issues
          console.error('[STEP 3] Failed to mark invalid amounts as failed in database:', dbError);
        }
      }

      // Step 4: Empty Batch Protection - Enhanced final validation checkpoint
      if (validRecipients.length === 0) {
        const invalidEmailCount = invalidEmailWinners.length;
        const invalidAmountCount = invalidAmountRecipients.length;
        const totalFailures = invalidEmailCount + invalidAmountCount;
        
        const allFailures = [
          ...invalidEmailWinners.map(w => ({ 
            id: w.id, 
            username: w.username || 'Unknown',
            email: w.email, 
            paypalEmail: w.paypalEmail || '(empty)',
            reason: EMAIL_VALIDATION_REASONS.INVALID_FORMAT,
            category: 'email_validation'
          })),
          ...invalidAmountRecipients.map(r => ({ 
            id: r.winner.id, 
            username: r.winner.username || 'Unknown',
            email: r.winner.email, 
            paypalEmail: r.winner.paypalEmail,
            amount: r.originalAmount,
            reason: `Amount validation: ${r.validation.error}`,
            category: 'amount_validation'
          }))
        ];
        
        logger.audit('EMPTY_BATCH_PROTECTION_FINAL_VALIDATION', {
          totalWinners: winners.length,
          validEmailWinners: validEmailWinners.length,
          validRecipients: 0,
          invalidEmailCount,
          invalidAmountCount,
          totalFailures,
          protectionTriggered: 'FINAL_VALIDATION_STAGE',
          validationErrors: invalidAmountRecipients.map(r => r.validation.error)
        });
        logger.end(0, totalFailures);
        
        return res.status(400).json({
          success: false,
          error: "No valid PayPal recipients to process after full validation",
          details: `Final validation failed: 0 valid, ${invalidEmailCount} email failures, ${invalidAmountCount} amount failures`,
          userMessage: "All selected winners failed validation checks. Please review and fix the validation issues before retrying disbursements.",
          breakdown: {
            totalSelected: winners.length,
            validEmails: validEmailWinners.length,
            invalidEmails: invalidEmailCount,
            validAmounts: validRecipients.length,
            invalidAmounts: invalidAmountCount,
            finalValid: 0
          },
          failed: allFailures,
          categories: {
            emailValidation: invalidEmailCount,
            amountValidation: invalidAmountCount
          },
          actionRequired: "fix_validation_issues", 
          nextSteps: [
            `Fix ${invalidEmailCount} invalid PayPal email addresses`,
            `Resolve ${invalidAmountCount} invalid payout amounts`, 
            "Verify all winners have valid PayPal emails in format (user@domain.com)",
            "Ensure all payout amounts are positive USD values",
            "Retry disbursement after fixing all validation issues"
          ],
          canRetry: true,
          skippedInvalidEmail: invalidEmailCount,
          skippedInvalidAmount: invalidAmountCount,
          totalEligible: totalEligibleCount
        });
      }

      // Phase 7: Build PayPal recipients using normalized emails (Step 2: Deterministic idempotency)
      const recipients: PayoutRecipient[] = validRecipients.map(result => {
        console.log(`[CRITICAL DEBUG] Building recipient - normalizedPaypalEmail: "${result.winner.normalizedPaypalEmail}", type: ${typeof result.winner.normalizedPaypalEmail}`);
        const recipient = {
          cycleWinnerSelectionId: result.winner.id,    // Required for orchestrator
          userId: result.winner.userId,                 // Required for orchestrator  
          paypalEmail: result.winner.normalizedPaypalEmail,  // Use pre-normalized email for consistency
          amount: result.validatedAmount,               // In cents, validated
          currency: "USD",
          note: `FinBoost Cycle ${cycleId} Reward - Tier ${result.winner.tier}`
        };
        console.log(`[CRITICAL DEBUG] Final recipient object - paypalEmail: "${recipient.paypalEmail}"`);
        return recipient;
      });

      // Phase 8: Generate deterministic request checksum using ONLY valid recipients (Critical for idempotency)
      const winnerData = recipients.map(r => ({
        id: r.cycleWinnerSelectionId,
        amount: r.amount,
        email: r.paypalEmail  // Normalized email ensures deterministic checksum
      }));
      const requestChecksum = storage.generateIdempotencyKey(cycleId, winnerData);
      
      logger.audit('IDEMPOTENCY_KEY_GENERATED', { 
        requestChecksum: requestChecksum.substring(0, 8) + '...', 
        recipientCount: recipients.length 
      });

      // Phase 1: Check for existing batch (idempotency protection)
      const existingBatch = await storage.checkExistingBatch(requestChecksum);
      if (existingBatch && existingBatch.status !== 'failed') {
        logger.audit('IDEMPOTENCY_HIT', {
          existingBatchId: existingBatch.id,
          existingStatus: existingBatch.status,
          senderBatchId: existingBatch.senderBatchId
        });
        logger.end(0, 0, `existing_batch_${existingBatch.id}`);
        
        // Return existing batch summary instead of processing again
        return res.json({
          success: true,
          message: "Batch already processed (idempotency protection)",
          processedCount: recipients.length,
          failed: [],
          batchId: existingBatch.senderBatchId,
          paypalBatchId: existingBatch.paypalBatchId,
          totalEligible: totalEligibleCount,
          existingBatch: true
        });
      }

      // Phase 3: Enhanced concurrency protection with advisory lock per cycle
      const cycleProcessingKey = `cycle_processing_${cycleId}`;
      const deterministic_batch_id = `cycle-${cycleId}-${requestChecksum.slice(0, 16)}`;
      
      // Check for processing lock first
      const lockInfo = await storage.getProcessingLockInfo(cycleProcessingKey);
      if (lockInfo && lockInfo.expiry > new Date()) {
        logger.concurrency(`Processing lock active for cycle ${cycleId}, expires at ${lockInfo.expiry}`);
        logger.end(0, recipients.length);
        return res.status(423).json({
          error: "Cycle processing locked",
          details: `Cycle ${cycleId} is currently locked for processing. This prevents concurrent disbursement operations.`,
          userMessage: `Another disbursement is currently processing for this cycle. Please wait ${Math.ceil((lockInfo.expiry.getTime() - Date.now()) / 60000)} minutes and try again.`,
          lockInfo: {
            lockedSince: lockInfo.acquired,
            expiresAt: lockInfo.expiry,
            remainingMinutes: Math.ceil((lockInfo.expiry.getTime() - Date.now()) / 60000)
          },
          actionRequired: "wait_for_lock_expiry"
        });
      }
      
      // Traditional concurrent batch check 
      const concurrencyCheck = await checkConcurrentBatches(cycleId, deterministic_batch_id);
      if (concurrencyCheck.hasConflict) {
        logger.concurrency(`Concurrent batch detected: ${JSON.stringify(concurrencyCheck.conflictDetails)}`);
        logger.end(0, 0);
        return res.status(409).json({
          error: "Concurrent disbursement in progress",
          details: "Another disbursement batch is currently being processed for this cycle. Please wait for it to complete.",
          userMessage: "A disbursement is already running for this cycle. Please check the status dashboard and wait for completion before trying again.",
          conflictInfo: concurrencyCheck.conflictDetails,
          actionRequired: "check_status_dashboard"
        });
      }

      // Acquire processing lock for the duration of the operation
      const lockExpiry = new Date(Date.now() + 900000); // 15 minutes
      const lockAcquired = await storage.acquireProcessingLock(cycleProcessingKey, lockExpiry);
      if (!lockAcquired) {
        logger.concurrency(`Failed to acquire processing lock for cycle ${cycleId}`);
        logger.end(0, 0);
        return res.status(423).json({
          error: "Unable to acquire processing lock",
          details: "Could not secure exclusive processing rights for this cycle. Please try again."
        });
      }

      logger.concurrency(`Processing lock acquired for cycle ${cycleId}, expires at ${lockExpiry}`);
      
      // Phase 1: Calculate total amount for orchestrator
      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

      // Phase 1: Import and initialize orchestrator
      const { PaypalTransactionOrchestrator } = await import('./paypal-transaction-orchestrator');
      const orchestrator = new PaypalTransactionOrchestrator();

      // Phase 1: Create transaction context for orchestrator
      const transactionContext: TransactionContext = {
        cycleSettingId: cycleId,
        adminId,
        recipients,
        totalAmount,
        requestId: requestChecksum,  // Use checksum as requestId for idempotency
        senderBatchId: deterministic_batch_id  // Pass deterministic sender batch ID to orchestrator
      };

      // Phase 1: Log orchestrator initiation with Step 8 structured logging
      logger.start(processAll ? 'processAll' : 'selective', recipients.length);
      logger.audit('ORCHESTRATOR_INITIATED', {
        recipientCount: recipients.length,
        totalAmount,
        requestChecksum: requestChecksum.substring(0, 8) + '...',
        senderBatchId: deterministic_batch_id
      });

      // Phase 1 & 2: Execute two-phase transaction through orchestrator with comprehensive error handling
      let orchestratorResult;
      try {
        console.log('[PHASE 2 ERROR HANDLING] Starting orchestrator execution with defensive error handling');
        orchestratorResult = await orchestrator.executeTransaction(transactionContext);
        
        // PHASE 2: Defensive validation of orchestrator result
        if (!orchestratorResult || typeof orchestratorResult !== 'object') {
          throw new Error('Orchestrator returned invalid result object');
        }
        
        console.log('[PHASE 2 ERROR HANDLING] Orchestrator execution completed successfully');
        
      } catch (orchestratorError) {
        // PHASE 2: Comprehensive orchestrator error handling - prevent blank pages
        console.error('[PHASE 2 ERROR HANDLING] Orchestrator execution failed:', orchestratorError);
        
        // Always release processing lock on orchestrator failure
        try {
          await storage.releaseProcessingLock(cycleProcessingKey);
          logger.concurrency(`Processing lock released after orchestrator error for cycle ${cycleId}`);
        } catch (lockError) {
          logger.concurrency(`Warning: Failed to release lock after orchestrator error: ${lockError instanceof Error ? lockError.message : String(lockError)}`);
        }
        
        // Determine error type and appropriate response
        const errorMessage = orchestratorError instanceof Error ? orchestratorError.message : String(orchestratorError);
        const isValidationError = errorMessage.includes('validation') || 
                                errorMessage.includes('invalid') ||
                                errorMessage.includes('Input validation failed') ||
                                errorMessage.includes('recipient') ||
                                errorMessage.includes('email') ||
                                errorMessage.includes('amount');
                                
        // Log structured error for debugging
        logger.audit('ORCHESTRATOR_EXECUTION_FAILED', {
          errorType: isValidationError ? 'validation_error' : 'internal_error',
          errorMessage: errorMessage,
          recipientCount: recipients.length,
          totalAmount,
          stackTrace: orchestratorError instanceof Error ? orchestratorError.stack : undefined
        });
        
        logger.end(0, recipients.length, `orchestrator_error`);
        
        if (isValidationError) {
          // PHASE 2: Return 422 for validation errors with structured response
          return res.status(422).json({
            ok: false,
            stage: 'validation',
            error: 'Validation failed',
            details: errorMessage,
            userMessage: 'The disbursement data failed validation checks. Please review the recipient information and try again.',
            errors: [errorMessage],
            recipientCount: recipients.length,
            totalAmount: totalAmount,
            actionRequired: 'review_recipient_data',
            canRetry: true
          });
        } else {
          // PHASE 2: Return 500 for internal errors with structured response
          return res.status(500).json({
            ok: false,
            stage: 'internal_error',
            error: 'Internal disbursement system error',
            details: 'An unexpected error occurred during disbursement processing',
            userMessage: 'A system error occurred while processing disbursements. Please try again in a few minutes or contact support if the issue persists.',
            errorCode: 'ORCHESTRATOR_EXECUTION_FAILED',
            recipientCount: recipients.length,
            totalAmount: totalAmount,
            actionRequired: 'retry_later_or_contact_support',
            canRetry: true,
            retryDelay: '5_minutes'
          });
        }
      }
      
      // Phase 3: Always release processing lock after orchestrator execution
      try {
        await storage.releaseProcessingLock(cycleProcessingKey);
        logger.concurrency(`Processing lock released for cycle ${cycleId}`);
      } catch (lockError) {
        logger.concurrency(`Warning: Failed to release processing lock for cycle ${cycleId}: ${lockError instanceof Error ? lockError.message : String(lockError)}`);
        // Don't fail the entire operation for lock release issues
      }

      // Phase 2: Process orchestrator result with Step 8 logging
      if (orchestratorResult.success && orchestratorResult.phase2) {
        // Success case - log individual items and completion
        recipients.forEach(recipient => {
          logger.item(recipient.userId, recipient.amount, 'success');
        });

        const allFailures = [
          ...invalidEmailWinners.map(w => ({ id: w.id, email: w.email, reason: EMAIL_VALIDATION_REASONS.INVALID_FORMAT })),
          ...invalidAmountRecipients.map(r => ({ 
            id: r.winner.id, 
            email: r.winner.email, 
            reason: `Amount validation: ${r.validation.error}` 
          }))
        ];

        // STEP 4: DATABASE STATE SYNCHRONIZATION
        // The orchestrator successfully processed PayPal payouts, but we need to sync the application state
        // by updating cycle_winner_selections and cycle_settings tables based on PayPal results
        try {
          logger.audit('DATABASE_STATE_SYNC_START', {
            batchId: orchestratorResult.phase1.batchId,
            cycleId
          });

          // Get individual payout results from the batch
          const batchItems = await storage.getPayoutBatchItems(orchestratorResult.phase1.batchId!);
          
          // Separate successful and failed payouts
          const successfulItems = batchItems.filter(item => item.status === 'success');
          const failedItems = batchItems.filter(item => item.status === 'failed');
          
          logger.audit('PAYOUT_RESULTS_RETRIEVED', {
            totalItems: batchItems.length,
            successful: successfulItems.length,
            failed: failedItems.length,
            pending: batchItems.filter(item => ['pending', 'unclaimed'].includes(item.status)).length
          });

          // Update cycle_winner_selections for successful payouts
          if (successfulItems.length > 0) {
            const successfulWinnerIds = successfulItems.map(item => item.cycleWinnerSelectionId);
            
            await db.update(cycleWinnerSelections)
              .set({
                payoutStatus: 'completed',
                notificationDisplayed: false,  // Enable winner celebration banners
                lastModified: new Date()
              })
              .where(inArray(cycleWinnerSelections.id, successfulWinnerIds));
            
            logger.audit('SUCCESSFUL_WINNERS_UPDATED', {
              count: successfulItems.length,
              winnerIds: successfulWinnerIds.slice(0, 5) // Log first 5 for audit
            });
          }

          // Update cycle_winner_selections for failed payouts
          if (failedItems.length > 0) {
            const failedWinnerIds = failedItems.map(item => item.cycleWinnerSelectionId);
            
            await db.update(cycleWinnerSelections)
              .set({
                payoutStatus: 'failed',
                payoutError: 'PayPal disbursement failed',
                lastModified: new Date()
              })
              .where(inArray(cycleWinnerSelections.id, failedWinnerIds));
            
            logger.audit('FAILED_WINNERS_UPDATED', {
              count: failedItems.length,
              winnerIds: failedWinnerIds.slice(0, 5)
            });
          }

          // Update cycle status based on overall results
          const totalProcessed = successfulItems.length + failedItems.length;
          const allSuccessful = failedItems.length === 0 && successfulItems.length > 0;
          const cycleCompleted = orchestratorResult.phase2.cycleCompleted || allSuccessful;
          
          if (cycleCompleted) {
            // All winners processed successfully - mark cycle as completed
            await db.update(cycleSettings)
              .set({
                status: 'completed',
                completedAt: new Date(),
                completedBy: adminId
              })
              .where(eq(cycleSettings.id, cycleId));
            
            logger.audit('CYCLE_COMPLETED', {
              cycleId,
              completedBy: adminId,
              totalProcessed
            });
          } else if (successfulItems.length > 0) {
            // Some successful, some failed - mark as partially completed
            await db.update(cycleSettings)
              .set({
                status: 'partially_completed',
                lastModified: new Date()
              })
              .where(eq(cycleSettings.id, cycleId));
            
            logger.audit('CYCLE_PARTIALLY_COMPLETED', {
              cycleId,
              successful: successfulItems.length,
              failed: failedItems.length
            });
          }
          
          logger.audit('DATABASE_STATE_SYNC_COMPLETE', {
            cycleId,
            winnersUpdated: totalProcessed,
            cycleStatus: cycleCompleted ? 'completed' : (successfulItems.length > 0 ? 'partially_completed' : 'active')
          });

        } catch (syncError) {
          // Log sync error but don't fail the entire operation - PayPal processing was successful
          logger.audit('DATABASE_STATE_SYNC_ERROR', {
            error: syncError instanceof Error ? syncError.message : String(syncError),
            phase: 'post_paypal_sync'
          });
          console.error('[STEP 4 SYNC ERROR] Failed to sync database state after successful PayPal processing:', syncError);
        }

        logger.end(
          orchestratorResult.phase2.successfulCount, 
          allFailures.length,
          orchestratorResult.phase2.paypalBatchId
        );

        logger.audit('DISBURSEMENT_COMPLETED_SUCCESS', {
          processedCount: orchestratorResult.phase2.processedCount,
          successfulCount: orchestratorResult.phase2.successfulCount,
          failedCount: orchestratorResult.phase2.failedCount,
          pendingCount: orchestratorResult.phase2.pendingCount,
          paypalBatchId: orchestratorResult.phase2.paypalBatchId,
          cycleCompleted: orchestratorResult.phase2.cycleCompleted,
          totalAmount: totalAmount
        });

        // Step 6: Enhanced Response Format - Comprehensive success response
        const processingEndTime = new Date();
        const processingStartTime = new Date(processingEndTime.getTime() - 120000); // Approximate 2-minute processing time
        
        const invalidEmailCount = invalidEmailWinners.length;
        const invalidAmountCount = invalidAmountRecipients.length;
        const totalInvalidCount = invalidEmailCount + invalidAmountCount;
        
        return res.json({
          success: true,
          operation: "process_disbursements",
          timestamp: processingEndTime.toISOString(),
          
          // Processing context and metadata
          context: {
            cycleId,
            processMode: processAll ? 'processAll' : 'selective',
            processedBy: {
              adminId,
              timestamp: processingEndTime.toISOString()
            },
            processingTime: {
              startedAt: processingStartTime.toISOString(),
              completedAt: processingEndTime.toISOString(),
              durationMs: 120000 // Approximate processing time
            }
          },
          
          // Comprehensive validation and processing breakdown
          breakdown: {
            totalSelected: winners.length,
            validEmails: validEmailWinners.length,
            invalidEmails: invalidEmailCount,
            validAmounts: validRecipients.length,
            invalidAmounts: invalidAmountCount,
            finalValid: recipients.length,
            processedByPayPal: orchestratorResult.phase2.processedCount,
            successful: orchestratorResult.phase2.successfulCount,
            failed: orchestratorResult.phase2.failedCount,
            pending: orchestratorResult.phase2.pendingCount
          },
          
          // PayPal processing results
          paypalResults: {
            batchId: orchestratorResult.phase1.senderBatchId,
            paypalBatchId: orchestratorResult.phase2.paypalBatchId,
            processedCount: orchestratorResult.phase2.processedCount,
            successfulCount: orchestratorResult.phase2.successfulCount,
            failedCount: orchestratorResult.phase2.failedCount,
            pendingCount: orchestratorResult.phase2.pendingCount,
            totalAmount: totalAmount,
            totalAmountUSD: (totalAmount / 100).toFixed(2)
          },
          
          // Status indicators
          status: {
            cycleCompleted: orchestratorResult.phase2.cycleCompleted,
            userRewardsCreated: orchestratorResult.phase2.userRewardsCreated,
            hasValidationFailures: totalInvalidCount > 0,
            hasPayPalFailures: orchestratorResult.phase2.failedCount > 0,
            requiresFollowUp: orchestratorResult.phase2.pendingCount > 0 || orchestratorResult.phase2.failedCount > 0
          },
          
          // Failure details and categorization
          validationFailures: {
            total: totalInvalidCount,
            categories: {
              emailValidation: invalidEmailCount,
              amountValidation: invalidAmountCount
            },
            details: allFailures
          },
          
          // Admin guidance and next steps
          guidance: {
            ...(totalInvalidCount > 0 && {
              validationIssues: [
                ...(invalidEmailCount > 0 ? [`${invalidEmailCount} recipients have invalid PayPal email addresses`] : []),
                ...(invalidAmountCount > 0 ? [`${invalidAmountCount} recipients have invalid payout amounts`] : [])
              ]
            }),
            ...(orchestratorResult.phase2.pendingCount > 0 && {
              pendingActions: [`${orchestratorResult.phase2.pendingCount} disbursements are pending - check status dashboard for updates`]
            }),
            ...(orchestratorResult.phase2.failedCount > 0 && {
              failedActions: [`${orchestratorResult.phase2.failedCount} disbursements failed - review individual failures and retry if needed`]
            })
          },
          
          // Legacy compatibility fields
          processedCount: orchestratorResult.phase2.processedCount,
          successfulCount: orchestratorResult.phase2.successfulCount,
          failedCount: orchestratorResult.phase2.failedCount,
          pendingCount: orchestratorResult.phase2.pendingCount,
          failed: allFailures,
          batchId: orchestratorResult.phase1.senderBatchId,
          paypalBatchId: orchestratorResult.phase2.paypalBatchId,
          totalEligible: totalEligibleCount,
          cycleCompleted: orchestratorResult.phase2.cycleCompleted,
          userRewardsCreated: orchestratorResult.phase2.userRewardsCreated
        });

      } else {
        // Failure case - handle orchestrator errors
        const errorMessages = [
          ...orchestratorResult.errors,
          ...(orchestratorResult.phase1?.errors || []),
          ...(orchestratorResult.phase2?.errors || [])
        ];

        logger.audit('DISBURSEMENT_FAILED', {
          phase1Success: orchestratorResult.phase1?.success || false,
          phase2Success: orchestratorResult.phase2?.success || false,
          rollbackPerformed: orchestratorResult.rollbackPerformed,
          errors: errorMessages.slice(0, 3), // Log first 3 errors
          senderBatchId: orchestratorResult.phase1?.senderBatchId
        });

        logger.end(0, recipients.length + invalidEmailWinners.length + invalidAmountRecipients.length);

        // Step 6: Enhanced Response Format - Comprehensive error response
        const processingEndTime = new Date();
        const processingStartTime = new Date(processingEndTime.getTime() - 60000); // Approximate 1-minute processing time before failure
        
        const invalidEmailCount = invalidEmailWinners.length;
        const invalidAmountCount = invalidAmountRecipients.length;
        const totalInvalidCount = invalidEmailCount + invalidAmountCount;
        
        return res.status(500).json({
          success: false,
          operation: "process_disbursements",
          timestamp: processingEndTime.toISOString(),
          
          // Error context and metadata
          context: {
            cycleId,
            processMode: processAll ? 'processAll' : 'selective',
            processedBy: {
              adminId,
              timestamp: processingEndTime.toISOString()
            },
            processingTime: {
              startedAt: processingStartTime.toISOString(),
              failedAt: processingEndTime.toISOString(),
              durationMs: 60000 // Approximate processing time before failure
            }
          },
          
          // Error details
          error: {
            primary: "Disbursement processing failed",
            details: errorMessages.join('; '),
            userMessage: "The disbursement failed due to a processing error. The system automatically rolled back any partial changes. Please check the error details and try again.",
            category: "orchestrator_failure",
            code: "DISBURSEMENT_PROCESSING_FAILED"
          },
          
          // Processing state breakdown
          breakdown: {
            totalSelected: winners.length,
            validEmails: validEmailWinners.length,
            invalidEmails: invalidEmailCount,
            validAmounts: validRecipients.length,
            invalidAmounts: invalidAmountCount,
            finalValid: recipients.length,
            processedByPayPal: 0, // No PayPal processing occurred due to failure
            successful: 0,
            failed: recipients.length + totalInvalidCount,
            pending: 0
          },
          
          // Processing results (failed state)
          processingResults: {
            phase1Success: orchestratorResult.phase1?.success || false,
            phase2Success: orchestratorResult.phase2?.success || false,
            rollbackPerformed: orchestratorResult.rollbackPerformed,
            batchId: orchestratorResult.phase1?.senderBatchId,
            errors: errorMessages
          },
          
          // Status indicators
          status: {
            cycleCompleted: false,
            userRewardsCreated: false,
            hasValidationFailures: totalInvalidCount > 0,
            hasProcessingFailures: true,
            requiresFollowUp: true
          },
          
          // Admin guidance and recovery options
          guidance: {
            actionRequired: "review_errors_and_retry",
            canRetry: true,
            immediateSteps: [
              "Review error details below",
              "Check PayPal account status and connectivity",
              "Verify recipient data integrity",
              "Wait 5-10 minutes before retry attempt"
            ],
            troubleshooting: {
              commonCauses: [
                "PayPal API connectivity issues",
                "Invalid recipient email addresses", 
                "Insufficient PayPal account balance",
                "Temporary service outage"
              ],
              diagnosticSteps: [
                "Verify PayPal account status",
                "Check recipient email validity",
                "Review processing logs for detailed error information",
                "Contact support if issue persists after retry attempts"
              ]
            }
          },
          
          // Legacy compatibility fields
          details: errorMessages.join('; '),
          userMessage: "The disbursement failed due to a processing error. The system automatically rolled back any partial changes. Please check the error details and try again.",
          phase1Success: orchestratorResult.phase1?.success || false,
          phase2Success: orchestratorResult.phase2?.success || false,
          rollbackPerformed: orchestratorResult.rollbackPerformed,
          batchId: orchestratorResult.phase1?.senderBatchId,
          totalEligible: totalEligibleCount,
          actionRequired: "review_errors_and_retry",
          canRetry: true
        });
      }

    } catch (error) {
      // PHASE 2: Comprehensive route-level error handling - prevent all blank pages
      console.error('[PHASE 2 ROUTE ERROR HANDLING] Critical route-level error caught:', error);
      
      // Always ensure processing lock is released on any route-level error
      try {
        const cycleProcessingKey = `cycle_processing_${cycleId}`;
        await storage.releaseProcessingLock(cycleProcessingKey);
        console.log(`[PHASE 2 ROUTE ERROR HANDLING] Processing lock released after route error for cycle ${cycleId}`);
      } catch (lockError) {
        console.error('[PHASE 2 ROUTE ERROR HANDLING] Failed to release lock after route error:', lockError);
        // Don't fail the error response due to lock issues
      }
      
      // Enhanced error handling with structured logging
      logger.audit('DISBURSEMENT_CRITICAL_ERROR', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        phase: 'route_execution',
        errorPhase: 'route_level_exception'
      });
      
      logger.end(0, 0, 'route_level_critical_error');
      
      // Determine error type for appropriate response
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isValidationError = errorMessage.includes('validation') || 
                              errorMessage.includes('invalid') ||
                              errorMessage.includes('required') ||
                              errorMessage.includes('missing');
      const isAuthError = errorMessage.includes('auth') || 
                         errorMessage.includes('permission') ||
                         errorMessage.includes('unauthorized');
      const isDatabaseError = errorMessage.includes('database') ||
                             errorMessage.includes('connection') ||
                             errorMessage.includes('sql') ||
                             errorMessage.includes('query');
      
      console.error('[PHASE 2 ROUTE ERROR HANDLING] Route execution failed:', {
        errorType: isValidationError ? 'validation' : isAuthError ? 'authorization' : isDatabaseError ? 'database' : 'internal',
        message: errorMessage
      });
      
      // PHASE 2: Return appropriate structured JSON response based on error type
      if (isValidationError) {
        return res.status(422).json({
          ok: false,
          stage: 'route_validation',
          error: 'Route validation error',
          details: errorMessage,
          userMessage: 'There was a validation error with the request data. Please check your input and try again.',
          errorCode: 'ROUTE_VALIDATION_ERROR',
          actionRequired: 'check_input_data',
          canRetry: true,
          timestamp: new Date().toISOString()
        });
      } else if (isAuthError) {
        return res.status(403).json({
          ok: false,
          stage: 'authorization',
          error: 'Authorization error',
          details: errorMessage,
          userMessage: 'You do not have permission to perform this operation.',
          errorCode: 'ROUTE_AUTHORIZATION_ERROR',
          actionRequired: 'check_permissions',
          canRetry: false,
          timestamp: new Date().toISOString()
        });
      } else if (isDatabaseError) {
        return res.status(503).json({
          ok: false,
          stage: 'database_connection',
          error: 'Database connectivity error',
          details: 'A database connection error occurred',
          userMessage: 'The system is experiencing database connectivity issues. Please try again in a few minutes.',
          errorCode: 'ROUTE_DATABASE_ERROR',
          actionRequired: 'retry_later',
          canRetry: true,
          retryDelay: '5_minutes',
          timestamp: new Date().toISOString()
        });
      } else {
        // PHASE 2: Internal server error with comprehensive details
        return res.status(500).json({
          ok: false,
          stage: 'internal_error',
          error: 'Critical system error',
          details: 'An unexpected error occurred during disbursement processing',
          userMessage: 'A critical system error occurred. The development team has been notified. Please try again later or contact support if the issue persists.',
          errorCode: 'ROUTE_CRITICAL_ERROR',
          actionRequired: 'contact_support_if_persists',
          canRetry: true,
          retryDelay: '10_minutes',
          timestamp: new Date().toISOString(),
          context: {
            phase: 'route_execution',
            operation: 'process_disbursements',
            cycleId: cycleId || 'unknown',
            errorType: error instanceof Error ? error.constructor.name : typeof error
          }
        });
      }
    }
  });

  // Phase 4: Enhanced status monitoring dashboard endpoint  
  app.get("/api/admin/disbursements/status-dashboard", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const adminId = req.user?.id || 1;
      
      // Get recent batches with comprehensive status info
      const recentBatches = await db
        .select({
          id: payoutBatches.id,
          cycleSettingId: payoutBatches.cycleSettingId,
          senderBatchId: payoutBatches.senderBatchId,
          paypalBatchId: payoutBatches.paypalBatchId,
          status: payoutBatches.status,
          totalAmount: payoutBatches.totalAmount,
          totalRecipients: payoutBatches.totalRecipients,
          successfulCount: payoutBatches.successfulCount,
          failedCount: payoutBatches.failedCount,
          pendingCount: payoutBatches.pendingCount,
          retryCount: payoutBatches.retryCount,
          lastRetryAt: payoutBatches.lastRetryAt,
          lastRetryError: payoutBatches.lastRetryError,
          errorDetails: payoutBatches.errorDetails,
          createdAt: payoutBatches.createdAt,
          updatedAt: payoutBatches.updatedAt,
          cycleName: cycleSettings.cycleName
        })
        .from(payoutBatches)
        .leftJoin(cycleSettings, eq(payoutBatches.cycleSettingId, cycleSettings.id))
        .orderBy(desc(payoutBatches.createdAt))
        .limit(20);

      // Get current processing locks
      const activeLocks = Array.from(rateLimitStore.keys()).map(key => {
        const lockInfo = rateLimitStore.get(key);
        if (lockInfo && lockInfo.resetTime > Date.now()) {
          return {
            key,
            resetTime: lockInfo.resetTime,
            remainingSeconds: Math.ceil((lockInfo.resetTime - Date.now()) / 1000)
          };
        }
        return null;
      }).filter(Boolean);

      // Calculate summary statistics
      const summary = {
        totalBatches: recentBatches.length,
        activeBatches: recentBatches.filter(b => b.status === 'processing').length,
        completedBatches: recentBatches.filter(b => b.status === 'completed').length,
        failedBatches: recentBatches.filter(b => b.status === 'failed').length,
        totalPayouts: recentBatches.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        totalRecipients: recentBatches.reduce((sum, b) => sum + (b.totalRecipients || 0), 0),
        retryableBatches: recentBatches.filter(b => b.status === 'failed' && (b.retryCount || 0) < 3).length
      };

      res.json({
        success: true,
        dashboard: {
          summary,
          recentBatches: recentBatches.map(batch => ({
            ...batch,
            statusLabel: getStatusLabel(batch.status),
            progressPercentage: calculateProgressPercentage(batch),
            canRetry: batch.status === 'failed' && (batch.retryCount || 0) < 3,
            isStale: batch.status === 'processing' && 
                     batch.createdAt && 
                     (Date.now() - new Date(batch.createdAt).getTime()) > 900000, // 15 minutes
            amountFormatted: `$${((batch.totalAmount || 0) / 100).toFixed(2)}`
          })),
          activeLocks,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[PHASE 4 DASHBOARD] Error loading status dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load disbursement status dashboard',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Phase 4: User-friendly status labels and progress calculation helpers
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'intent': return 'Preparing';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'partially_completed': return 'Partially Complete';
      default: return 'Unknown';
    }
  }

  function calculateProgressPercentage(batch: any): number {
    const total = batch.totalRecipients || 0;
    if (total === 0) return 0;
    
    const completed = (batch.successfulCount || 0) + (batch.failedCount || 0);
    return Math.round((completed / total) * 100);
  }

  // Get eligible winners count for a cycle (ChatGPT Step 2: Helper endpoint)
  app.get("/api/admin/cycle-winner-details/:cycleId/eligible-count", async (req, res) => {
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
      
      // Server-side eligibility count using same criteria as disbursement endpoint
      const eligibleCountResult = await db
        .select({ count: sql`count(*)`.as('count') })
        .from(cycleWinnerSelections)
        .leftJoin(users, eq(cycleWinnerSelections.userId, users.id))
        .where(and(
          eq(cycleWinnerSelections.cycleSettingId, cycleId),
          inArray(cycleWinnerSelections.payoutStatus, ['pending', 'ready']),
          isNotNull(users.paypalEmail)
        ));

      const eligibleCount = parseInt(eligibleCountResult[0]?.count?.toString() || '0');
      console.log(`[ELIGIBLE-COUNT] Cycle ${cycleId}: ${eligibleCount} eligible winners`);

      res.json({ eligibleCount });
    } catch (error) {
      console.error("Error getting eligible count:", error);
      res.status(500).json({ error: "Failed to get eligible count" });
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
  app.get("/api/admin/winner-cycles", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
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

      // Validate the request body against the schema
      console.log("Request body:", req.body);
      
      // Convert date strings to Date objects before validation
      const processedBody = {
        ...req.body,
        cycleStartDate: new Date(req.body.cycleStartDate),
        cycleEndDate: new Date(req.body.cycleEndDate)
      };
      
      const validatedData = insertCycleSettingSchema.parse(processedBody);
      console.log("Validated data:", validatedData);
      const setting = await storage.createCycleSetting({
        ...validatedData,
        createdBy: req.user.id
      });
      res.json({ success: true, setting });
    } catch (error) {
      console.error("Error creating cycle setting:", error);
      res.status(500).json({ message: "Error creating cycle setting" });
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

  app.delete("/api/admin/cycle-settings/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteCycleSetting(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cycle setting:", error);
      res.status(500).json({ error: "Failed to delete cycle setting" });
    }
  });

  // Cycle Completion Endpoints
  app.post("/api/admin/cycles/:cycleId/complete", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);
      await storage.completeCycle(cycleId, req.user.id);
      
      res.json({ 
        success: true, 
        message: "Cycle completed successfully. All user tickets have been reset for the new cycle." 
      });
    } catch (error) {
      console.error("Error completing cycle:", error);
      res.status(500).json({ error: "Failed to complete cycle" });
    }
  });

  app.post("/api/admin/cycles/:cycleId/archive", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const cycleId = parseInt(req.params.cycleId);
      await storage.archiveCycleData(cycleId);
      
      res.json({ 
        success: true, 
        message: "Cycle archived successfully" 
      });
    } catch (error) {
      console.error("Error archiving cycle:", error);
      res.status(500).json({ error: "Failed to archive cycle" });
    }
  });

  app.post("/api/admin/cycles/:cycleId/enroll-premium-users", authenticateToken, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const result = await storage.backfillPremiumSubscribersInCycles();
      res.json(result);
    } catch (error) {
      console.error("Error enrolling premium users:", error);
      res.status(500).json({ error: "Failed to enroll premium users" });
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

  // ========================================
  // STEP 2: USER WINNER STATUS ENDPOINTS
  // Winner celebration banner notification system
  // ========================================

  // Get user winner status for celebration banners  
  app.get("/api/user/winner-status", authenticateToken, async (req, res) => {
    try {
      const winnerStatus = await storage.getUserWinnerStatus(req.user.id);
      res.json({ 
        success: true, 
        winner: winnerStatus || { isWinner: false, notificationDisplayed: false }
      });
    } catch (error) {
      console.error("Error getting user winner status:", error);
      res.status(500).json({ error: "Failed to get winner status" });
    }
  });

  // Mark winner notification as displayed (dismiss celebration banner)
  app.post("/api/user/winner-notification/dismiss", authenticateToken, async (req, res) => {
    try {
      const { cycleId } = req.body;
      
      if (!cycleId) {
        return res.status(400).json({ error: "Cycle ID is required" });
      }

      await storage.markWinnerNotificationDisplayed(req.user.id, cycleId);
      res.json({ success: true, message: "Winner notification marked as displayed" });
    } catch (error) {
      console.error("Error marking winner notification as displayed:", error);
      res.status(500).json({ error: "Failed to mark winner notification as displayed" });
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

  // Current cycle tier thresholds endpoint for Dashboard
  app.get("/api/cycles/current/tier-thresholds", authenticateToken, async (req, res) => {
    try {
      const currentCycle = await storage.getCurrentCycle();
      if (!currentCycle) {
        return res.status(404).json({ error: "No active cycle found" });
      }
      
      const thresholds = await storage.getCycleTierThresholds(currentCycle.id);
      res.json(thresholds);
    } catch (error) {
      console.error("Error getting current cycle tier thresholds:", error);
      res.status(500).json({ error: "Failed to get current cycle tier thresholds" });
    }
  });

  // Admin endpoint to get dynamic tier thresholds with percentile info
  app.get("/api/admin/cycle/:cycleId/dynamic-thresholds", authenticateToken, async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
      const user = await storage.getUserById(decoded.userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const dynamicThresholds = await storage.calculateDynamicTierThresholds(parseInt(req.params.cycleId));
      res.json(dynamicThresholds);
    } catch (error) {
      console.error("Error getting dynamic tier thresholds:", error);
      res.status(500).json({ error: "Failed to get dynamic tier thresholds" });
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
        return res.json({
          leaderboard: [],
          pagination: { page: 1, pageSize: 20, totalUsers: 0, totalPages: 0 }
        });
      }
      
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;
      
      console.log(`Fetching leaderboard: page=${page}, pageSize=${pageSize}, offset=${offset}`);
      
      // Get paginated leaderboard data
      const { leaderboard, totalUsers } = await storage.getCycleLeaderboardPaginated(
        currentCycle.id, 
        pageSize, 
        offset
      );
      
      const totalPages = Math.ceil(totalUsers / pageSize);
      
      // Return paginated response
      res.json({
        leaderboard,
        pagination: {
          page,
          pageSize,
          totalUsers,
          totalPages
        }
      });
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
        return res.status(400).json({ error: "No active cycle found" });
      }
      
      const poolData = await storage.getCyclePoolData(currentCycle.id);
      
      // Use the current cycle's actual reward pool percentage - no fallbacks
      const rewardPoolPercentage = currentCycle.rewardPoolPercentage;
      const minimumPoolGuarantee = currentCycle.minimumPoolGuarantee;
      
      // Calculate tier-specific pool breakdown
      const tierBreakdown = {
        tier1: Math.floor(poolData.totalPool * 0.50), // 50% to Tier 1
        tier2: Math.floor(poolData.totalPool * 0.30), // 30% to Tier 2  
        tier3: Math.floor(poolData.totalPool * 0.20)  // 20% to Tier 3
      };
      
      res.json({
        ...poolData,
        rewardPoolPercentage,
        minimumPoolGuarantee, // Keep in cents for consistency
        tierBreakdown
      });
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
      const endDate = currentCycle.cycleEndDate instanceof Date 
        ? currentCycle.cycleEndDate 
        : new Date(currentCycle.cycleEndDate);
      
      // Validate the date
      if (isNaN(endDate.getTime())) {
        console.error("Invalid cycle end date:", currentCycle.cycleEndDate);
        return res.json({
          nextDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeRemaining: { days: 1, hours: 0, minutes: 0, totalMs: 24 * 60 * 60 * 1000 }
        });
      }
      
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
      
      // Format cycle end date as "December 31, 2025"
      const formattedEndDate = endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      res.json({
        nextDate: endDate.toISOString(),
        formattedEndDate,
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

  // Simple admin stats endpoint for dashboard overview
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
      const user = await storage.getUserById(decoded.userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get basic stats
      const totalUsers = await storage.getTotalUsersCount();
      const activeUsers = await storage.getActiveUsersCount(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const premiumUsers = await storage.getPremiumUsersCount();
      const avgPoints = await storage.getAveragePointsPerUser();

      res.json({
        success: true,
        totalUsers,
        activeUsers,
        members: premiumUsers,
        avgPoints: Math.round(avgPoints || 0)
      });
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ success: false, message: error.message });
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

  // Individual Cycle Analytics
  app.get('/api/admin/cycles/:id/analytics', requireAdmin, async (req, res) => {
    try {
      const cycleId = parseInt(req.params.id);
      
      // Get cycle-specific stats
      const [cycle] = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleId))
        .limit(1);
        
      if (!cycle) {
        return res.status(404).json({ error: 'Cycle not found' });
      }
      
      // Get participants count (excluding admin users)
      const participantsResult = await db
        .select({ count: sql<number>`count(DISTINCT ${userCyclePoints.userId})::int` })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(and(eq(userCyclePoints.cycleSettingId, cycleId), eq(users.isAdmin, false)));

      const participants = Number(participantsResult[0]?.count) || 0;

      // Get total pool amount using the corrected storage method
      const poolData = await storage.getCyclePoolData(cycleId);
      const totalPoolAmount = poolData.finalRewardPool / 100; // Convert from cents to dollars

      // Get average points (excluding admin users)
      const avgPointsResult = await db
        .select({ avg: sql<number>`avg(${userCyclePoints.currentCyclePoints})` })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(and(eq(userCyclePoints.cycleSettingId, cycleId), eq(users.isAdmin, false)));

      const averagePoints = Math.round(avgPointsResult[0]?.avg || 0);

      // Get top performer (excluding admin users)
      const topPerformerResult = await db
        .select({
          username: users.username,
          points: userCyclePoints.currentCyclePoints
        })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(and(eq(userCyclePoints.cycleSettingId, cycleId), eq(users.isAdmin, false)))
        .orderBy(desc(userCyclePoints.currentCyclePoints))
        .limit(1);

      const topPerformer = topPerformerResult.length > 0 
        ? { username: topPerformerResult[0].username, points: topPerformerResult[0].points }
        : null;

      // Get tier breakdown counts
      const tierBreakdownResult = await db
        .select({
          tier: users.tier,
          count: sql<number>`count(*)::int`
        })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(and(eq(userCyclePoints.cycleSettingId, cycleId), eq(users.isAdmin, false)))
        .groupBy(users.tier);

      const tierBreakdown = {
        tier1: 0,
        tier2: 0,
        tier3: 0
      };

      tierBreakdownResult.forEach(item => {
        if (item.tier === 'tier1') tierBreakdown.tier1 = Number(item.count);
        if (item.tier === 'tier2') tierBreakdown.tier2 = Number(item.count);
        if (item.tier === 'tier3') tierBreakdown.tier3 = Number(item.count);
      });

      // Get current tier thresholds
      const tierThresholds = await storage.getCycleTierThresholds(cycleId);

      res.json({
        participantCount: participants,
        totalRewardPool: totalPoolAmount * 100, // Convert back to cents for consistency
        averagePoints,
        topPerformer,
        tier1Count: tierBreakdown.tier1,
        tier2Count: tierBreakdown.tier2,
        tier3Count: tierBreakdown.tier3,
        tierThresholds
      });
    } catch (error) {
      console.error('Error fetching cycle analytics:', error);
      res.status(500).json({ error: 'Failed to fetch cycle analytics' });
    }
  });

  // Get User Cycle Points for Admin Dashboard
  app.get('/api/admin/user-cycle-points', requireAdmin, async (req, res) => {
    try {
      // Get active cycle
      const activeCycle = await storage.getActiveCycleSetting();
      if (!activeCycle) {
        return res.json({ userCyclePoints: [] });
      }

      // Get all enrolled users in the active cycle (excluding admins)
      const enrolledUsers = await db
        .select({
          userId: userCyclePoints.userId,
          username: users.username,
          email: users.email,
          currentCyclePoints: userCyclePoints.currentCyclePoints,
          pointsRolledOver: userCyclePoints.pointsRolledOver,
          tier: users.tier,
          isActive: users.isActive,
          joinedCycleAt: userCyclePoints.joinedCycleAt,
          lastActivityDate: userCyclePoints.lastActivityDate
        })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(and(
          eq(userCyclePoints.cycleSettingId, activeCycle.id),
          eq(users.isAdmin, false)
        ))
        .orderBy(desc(userCyclePoints.currentCyclePoints));

      // Get prediction data for each user with proper error handling
      const userIds = enrolledUsers.map(user => user.userId);
      let predictionData = [];
      
      if (userIds.length > 0) {
        try {
          predictionData = await db
            .select({
              userId: userPredictions.userId,
              questionText: predictionQuestions.questionText,
              selectedOptionIndex: userPredictions.selectedOptionIndex,
              options: predictionQuestions.options,
              submittedAt: userPredictions.submittedAt
            })
            .from(userPredictions)
            .innerJoin(predictionQuestions, eq(userPredictions.predictionQuestionId, predictionQuestions.id))
            .where(and(
              inArray(userPredictions.userId, userIds),
              eq(predictionQuestions.cycleSettingId, activeCycle.id)
            ))
            .orderBy(desc(userPredictions.submittedAt));
        } catch (predictionError) {
          console.warn('Error fetching prediction data:', predictionError);
          // Continue without prediction data if there's an issue
        }
      }

      // Group predictions by user
      const predictionsByUser = predictionData.reduce((acc, pred) => {
        if (!acc[pred.userId]) acc[pred.userId] = [];
        try {
          const options = JSON.parse(pred.options);
          acc[pred.userId].push({
            question: pred.questionText,
            selectedOption: options[pred.selectedOptionIndex] || `Option ${pred.selectedOptionIndex + 1}`,
            selectedOptionIndex: pred.selectedOptionIndex,
            submittedAt: pred.submittedAt
          });
        } catch (parseError) {
          console.warn('Error parsing prediction options:', parseError);
        }
        return acc;
      }, {} as Record<number, Array<{question: string; selectedOption: string; selectedOptionIndex: number; submittedAt: Date}>>);

      // Add prediction data to enrolled users
      const usersWithPredictions = enrolledUsers.map(user => ({
        ...user,
        predictions: predictionsByUser[user.userId] || []
      }));

      res.json({ 
        success: true,
        userCyclePoints: usersWithPredictions,
        activeAdapterCycleId: activeCycle.id,
        activeCycleName: activeCycle.cycleName
      });
    } catch (error) {
      console.error('Error fetching user cycle points:', error);
      res.status(500).json({ error: 'Failed to fetch user cycle points' });
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
  
  // Execute flexible winner selection with point-weighted random as baseline
  app.post('/api/admin/cycle-winner-selection/execute', requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const { 
        cycleSettingId, 
        selectionMode, 
        tierSettings,
        customWinnerIds,
        pointDeductionPercentage,
        rolloverPercentage
      } = req.body;

      console.log('Winner selection request received:', {
        cycleSettingId,
        selectionMode,
        tierSettings,
        requestBody: req.body
      });

      const results = await storage.executeCycleWinnerSelection({
        cycleSettingId,
        selectionMode: selectionMode || 'weighted_random',
        tierSettings: tierSettings || {
          tier1: { winnerCount: 0, poolPercentage: 50 },
          tier2: { winnerCount: 0, poolPercentage: 30 },
          tier3: { winnerCount: 0, poolPercentage: 20 }
        },
        customWinnerIds,
        pointDeductionPercentage: pointDeductionPercentage || 50,
        rolloverPercentage: rolloverPercentage || 50,
        adminUserId: req.user?.id // Phase 2A: Track admin who executed selection
      });

      res.json(results);
    } catch (error) {
      console.error('Error executing cycle winner selection:', error);
      res.status(500).json({ error: 'Failed to execute winner selection' });
    }
  });

  // Get eligible users for manual selection
  app.get('/api/admin/eligible-users/:cycleSettingId', requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const users = await storage.getEligibleUsersForSelection(cycleSettingId);
      res.json({ users });
    } catch (error) {
      console.error('Error getting eligible users:', error);
      res.status(500).json({ error: 'Failed to get eligible users' });
    }
  });

  // Get winner details for adjustment (original - returns all results)
  app.get('/api/admin/cycle-winner-details/:cycleSettingId', requireAdmin, async (req, res) => {
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const details = await storage.getCycleWinnerDetails(cycleSettingId);
      res.json(details);
    } catch (error) {
      console.error('Error getting winner details:', error);
      res.status(500).json({ error: 'Failed to get winner details' });
    }
  });

  // Get paginated winner details (new - for performance)
  app.get('/api/admin/cycle-winner-details/:cycleSettingId/paginated', requireAdmin, async (req, res) => {
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.' });
      }
      
      const details = await storage.getCycleWinnerDetailsPaginated(cycleSettingId, page, limit);
      res.json({
        ...details,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(details.totalCount / limit)
      });
    } catch (error) {
      console.error('Error getting paginated winner details:', error);
      res.status(500).json({ error: 'Failed to get paginated winner details' });
    }
  });

  // Export winner selection to XLSX
  app.get('/api/admin/cycle-winner-details/:cycleSettingId/export', requireAdmin, async (req, res) => {
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      
      // Get winner details using existing method
      const details = await storage.getCycleWinnerDetails(cycleSettingId);
      
      if (!details || !details.winners || details.winners.length === 0) {
        return res.status(404).json({ error: 'No winner data found for this cycle' });
      }

      // Get cycle information for filename
      const cycleSettings = await storage.getAllCycleSettings();
      const currentCycle = cycleSettings.find(c => c.id === cycleSettingId);
      const cycleName = currentCycle ? currentCycle.cycleName : `Cycle-${cycleSettingId}`;

      // Prepare data for Excel export
      const excelData = details.winners.map(winner => ({
        'Overall Rank': winner.overallRank,
        'Tier Rank': winner.tierRank,
        'Username': winner.username,
        'User ID': winner.userId,
        'Email': winner.email,
        'Tier': winner.tier,
        'Points at Selection': winner.pointsAtSelection,
        'Reward Amount': `$${(winner.rewardAmount / 100).toFixed(2)}`,
        'Payout Status': winner.payoutStatus,
        'Selection Date': new Date(winner.selectionDate).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Overall Rank
        { wch: 10 }, // Tier Rank  
        { wch: 15 }, // Username
        { wch: 8 },  // User ID
        { wch: 25 }, // Email
        { wch: 8 },  // Tier
        { wch: 18 }, // Points at Selection
        { wch: 12 }, // Reward Amount
        { wch: 12 }, // Payout Status
        { wch: 20 }  // Selection Date
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Winner Selection');

      // Generate filename with cycle name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const filename = `${cycleName.replace(/[^a-zA-Z0-9]/g, '-')}-Winners-${timestamp}.xlsx`;

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send the Excel file
      res.send(excelBuffer);

    } catch (error) {
      console.error('Error exporting winner details to XLSX:', error);
      res.status(500).json({ error: 'Failed to export winner details to XLSX' });
    }
  });

  // Import winner selection from XLSX
  app.post('/api/admin/cycle-winner-details/:cycleSettingId/import', requireAdmin, async (req, res) => {
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const { fileData } = req.body;

      if (!fileData) {
        return res.status(400).json({ error: 'No file data provided' });
      }

      // NEW: Validate cycle execution/seal state before allowing import
      const [cycleSetting] = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId));

      if (!cycleSetting) {
        return res.status(404).json({ error: 'Cycle setting not found' });
      }

      if (!cycleSetting.selectionExecuted) {
        return res.status(400).json({ 
          error: 'Cannot import - cycle selection has not been executed yet. Please run selection first.' 
        });
      }

      if (cycleSetting.selectionSealed) {
        return res.status(400).json({ 
          error: 'Cannot import - cycle selection is already sealed. No further modifications allowed.' 
        });
      }

      // Parse base64 encoded Excel file
      const buffer = Buffer.from(fileData.split(',')[1], 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Get first worksheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ error: 'No worksheet found in Excel file' });
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        return res.status(400).json({ error: 'No data found in Excel file' });
      }

      // Validate required columns
      const requiredColumns = ['Email', 'Reward Amount', 'Payout Status'];
      const firstRow = jsonData[0] as any;
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        return res.status(400).json({ 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        });
      }

      // Process import data
      const importResults = {
        processed: 0,
        updated: 0,
        errors: [] as string[],
        skipped: 0
      };

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        importResults.processed++;

        try {
          const email = row.Email?.trim();
          if (!email) {
            importResults.errors.push(`Row ${i + 2}: Missing email address`);
            continue;
          }

          // Parse reward amount (remove $ and convert to cents)
          let rewardAmount = 0;
          const rewardStr = String(row['Reward Amount'] || '0');
          const rewardMatch = rewardStr.match(/[\d.,]+/);
          if (rewardMatch) {
            rewardAmount = Math.round(parseFloat(rewardMatch[0].replace(',', '')) * 100);
          }

          const payoutStatus = row['Payout Status']?.trim() || 'pending';

          // Find existing winner by email and cycle
          const existingWinner = await db
            .select()
            .from(winnerSelections)
            .innerJoin(users, eq(winnerSelections.userId, users.id))
            .where(
              and(
                eq(winnerSelections.cycleSettingId, cycleSettingId),
                eq(users.email, email)
              )
            )
            .limit(1);

          if (existingWinner.length === 0) {
            importResults.errors.push(`Row ${i + 2}: No winner found with email ${email} in this cycle`);
            continue;
          }

          // Update winner selection
          await db
            .update(winnerSelections)
            .set({
              rewardAmount,
              payoutStatus,
              updatedAt: new Date()
            })
            .where(eq(winnerSelections.id, existingWinner[0].winner_selections.id));

          importResults.updated++;

        } catch (rowError) {
          console.error(`Error processing row ${i + 2}:`, rowError);
          importResults.errors.push(`Row ${i + 2}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
        }
      }

      res.json({
        success: true,
        results: importResults
      });

    } catch (error) {
      console.error('Error importing winner details from XLSX:', error);
      res.status(500).json({ error: 'Failed to import winner details from XLSX' });
    }
  });

  // Update winner payout percentage or status
  app.patch('/api/admin/winner-payout/:winnerId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const winnerId = parseInt(req.params.winnerId);
      const updates = req.body;
      await storage.updateWinnerPayout(winnerId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating winner payout:', error);
      res.status(500).json({ error: 'Failed to update winner payout' });
    }
  });

  // NEW: Save winner selection (draft state) - supports export/import workflow
  app.post('/api/admin/cycle-winner-selection/:cycleSettingId/save', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const { selectionMode, totalPool } = req.body;
      
      // Winners are already saved as draft by executeCycleWinnerSelection
      // This endpoint now just confirms the draft is ready
      const existingWinners = await storage.getCycleWinnerDetails(cycleSettingId);
      
      if (!existingWinners || !existingWinners.winners || existingWinners.winners.length === 0) {
        return res.status(400).json({ error: 'No winner selection found. Please run winner selection first.' });
      }

      // Winners already saved - just return success
      const result = { 
        success: true, 
        message: 'Winner selection already saved as draft',
        winnerCount: existingWinners.winners.length 
      };

      res.json({ 
        success: true, 
        message: 'Winner selection saved as draft. You can now export, modify, and import before sealing.',
        result 
      });
    } catch (error) {
      console.error('Error saving winner selection:', error);
      res.status(500).json({ error: 'Failed to save winner selection' });
    }
  });

  // NEW: Seal winner selection (final lock state) - prevents further modifications
  app.post('/api/admin/cycle-winner-selection/:cycleSettingId/seal', requireAdmin, async (req, res) => {
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const result = await storage.sealCycleWinnerSelection(cycleSettingId, req.user?.id);
      
      res.json({ 
        success: true, 
        message: result.message,
        sealed: result.sealed
      });
    } catch (error) {
      console.error('Error sealing winner selection:', error);
      res.status(500).json({ error: 'Failed to seal winner selection' });
    }
  });

  // NEW: Unseal winner selection (reversible for testing) - Enhanced Step 2 Implementation  
  app.post('/api/admin/cycle-winner-selection/:cycleSettingId/unseal', requireAdmin, async (req, res) => {
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      
      // Validate cycle setting ID
      if (isNaN(cycleSettingId) || cycleSettingId <= 0) {
        return res.status(400).json({ 
          error: 'Invalid cycle setting ID provided',
          success: false 
        });
      }

      // Ensure admin user ID is available
      if (!req.user?.id) {
        return res.status(401).json({ 
          error: 'Admin user identification required for unseal operation',
          success: false 
        });
      }

      console.log(`[UNSEAL API] Admin ${req.user.email} (ID: ${req.user.id}) requesting unseal for cycle ${cycleSettingId}`);
      
      // Call storage method with comprehensive validation
      const result = await storage.unsealCycleWinnerSelection(cycleSettingId, req.user.id);
      
      // Log successful unseal for audit trail
      if (result.unsealed) {
        console.log(`[UNSEAL API] Success: ${result.message}`);
      } else {
        console.log(`[UNSEAL API] No action: ${result.message}`);
      }
      
      res.json({ 
        success: result.unsealed, 
        message: result.message,
        unsealed: result.unsealed,
        cycleSettingId: cycleSettingId,
        adminId: req.user.id
      });
    } catch (error) {
      console.error('[UNSEAL API] Error unsealing winner selection:', error);
      
      // Enhanced error handling with descriptive messages
      const errorMessage = error.message || 'Unknown error occurred';
      
      if (errorMessage.includes('payouts have been processed')) {
        return res.status(409).json({ 
          error: 'Cannot unseal cycle - payouts have been processed. This operation is not reversible.',
          success: false,
          code: 'PAYOUTS_PROCESSED' 
        });
      }
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ 
          error: 'Cycle setting not found',
          success: false,
          code: 'CYCLE_NOT_FOUND' 
        });
      }
      
      res.status(500).json({ 
        error: `Failed to unseal winner selection: ${errorMessage}`,
        success: false,
        code: 'UNSEAL_FAILED' 
      });
    }
  });

  // Clear winner selection for re-running
  app.delete('/api/admin/cycle-winner-selection/:cycleSettingId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      await storage.clearCycleWinnerSelection(cycleSettingId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing winner selection:', error);
      res.status(500).json({ error: 'Failed to clear winner selection' });
    }
  });

  // ========================================
  // SELECTED WINNERS EXPORT/IMPORT ENDPOINTS (Phase 2)
  // ========================================

  // Export Selected Winners to Excel (.xlsx)
  app.get('/api/admin/winners/export/:cycleId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const cycleId = parseInt(req.params.cycleId);
      console.log(`[Export] Exporting winners for cycle ${cycleId}`);
      
      // Get winners data from storage
      const winnersData = await storage.getCycleWinnersForExport(cycleId);
      
      if (winnersData.length === 0) {
        return res.status(404).json({ error: 'No winners found for this cycle' });
      }

      // Prepare data for Excel export with proper formatting
      const exportData = winnersData.map(winner => ({
        'Overall Rank #': winner.overallRank,
        'Tier Rank #': winner.tierRank,
        'Username': winner.username,
        'User Email': winner.email,
        'Cycle Points': winner.cyclePoints, // Phase 3: Added cycle points column
        'Tier Size $': winner.tierSizeAmount / 100, // Convert cents to dollars (numeric)
        '% Payout of Tier': winner.payoutPercentage / 100, // Convert basis points to percentage (numeric)
        'Payout Calc $': winner.payoutCalculated / 100, // Convert cents to dollars (numeric)
        'Payout Override $': winner.payoutOverride ? (winner.payoutOverride / 100) : null, // Convert cents to dollars (numeric) or null
        'Payout Final': winner.payoutFinal / 100, // Convert cents to dollars (numeric)
        'PayPal Email': winner.paypalEmail || '',
        'Status': winner.payoutStatus,
        'Last Modified': winner.lastModified.toISOString().split('T')[0], // Format as YYYY-MM-DD
      }));

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 }, // Overall Rank #
        { wch: 10 }, // Tier Rank #
        { wch: 15 }, // Username
        { wch: 25 }, // User Email
        { wch: 12 }, // Cycle Points (Phase 3: Added)
        { wch: 12 }, // Tier Size $
        { wch: 15 }, // % Payout of Tier
        { wch: 12 }, // Payout Calc $
        { wch: 15 }, // Payout Override $
        { wch: 12 }, // Payout Final
        { wch: 25 }, // PayPal Email
        { wch: 10 }, // Status
        { wch: 15 }, // Last Modified
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Winners');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="cycle-${cycleId}-winners-export.xlsx"`);
      res.setHeader('Content-Length', excelBuffer.length);

      console.log(`[Export] Successfully generated Excel file for ${winnersData.length} winners`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error exporting winners:', error);
      res.status(500).json({ error: 'Failed to export winners data' });
    }
  });

  // Import Selected Winners from Excel (.xlsx)
  app.post('/api/admin/winners/import/:cycleId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const cycleId = parseInt(req.params.cycleId);
      const { importData, confirmOverwrite } = req.body;
      
      console.log(`[Import] Importing winners for cycle ${cycleId}, confirmOverwrite: ${confirmOverwrite}`);
      
      if (!confirmOverwrite) {
        return res.status(400).json({ 
          error: 'Import confirmation required', 
          requiresConfirmation: true,
          message: 'This will overwrite existing payout data. Please confirm to proceed.'
        });
      }

      if (!importData || !Array.isArray(importData) || importData.length === 0) {
        return res.status(400).json({ error: 'Import data is required and cannot be empty' });
      }

      // Process import data and convert to the format expected by storage
      const updates = importData.map(row => ({
        email: row['User Email'],
        payoutPercentage: row['% Payout of Tier'] ? Math.round(parseFloat(row['% Payout of Tier']) * 100) : undefined, // Convert percentage to basis points
        payoutOverride: row['Payout Override $'] && row['Payout Override $'] !== '' ? Math.round(parseFloat(row['Payout Override $']) * 100) : null, // Convert dollars to cents
      })).filter(update => update.email); // Only include rows with valid email

      console.log(`[Import] Processing ${updates.length} winner updates`);

      // Update winner payout data using storage method
      await storage.updateWinnerPayoutData(cycleId, updates);

      console.log(`[Import] Successfully updated ${updates.length} winner records`);
      res.json({ 
        success: true, 
        message: `Successfully updated ${updates.length} winner records`,
        updatedCount: updates.length
      });
    } catch (error) {
      console.error('Error importing winners:', error);
      res.status(500).json({ error: 'Failed to import winners data' });
    }
  });

  // Get Selected Winners JSON data for frontend table display
  app.get('/api/admin/winners/data/:cycleId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      console.log(`[AUTH ERROR] Non-admin user attempted winners data access: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const cycleId = parseInt(req.params.cycleId);
      console.log(`[FETCH] Fetching winners JSON data for cycle ${cycleId} - timestamp: ${new Date().toISOString()}`);
      
      // Force no-cache headers to prevent stale data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Use consistent pagination method with high limit to get all data
      const winnersData = await storage.getCycleWinnerDetailsPaginated(cycleId, 1, 10000);
      
      console.log(`[FETCH] Successfully returning ${winnersData.winners.length} winner records from cycleWinnerSelections table`);
      
      // Add metadata for debugging
      const responseData = {
        winners: winnersData.winners,
        metadata: {
          totalCount: winnersData.winners.length,
          cycleId: cycleId,
          fetchedAt: new Date().toISOString(),
          source: 'cycleWinnerSelections'
        }
      };
      
      res.json(winnersData.winners);
    } catch (error) {
      console.error('[FETCH ERROR] Error getting winners JSON data:', error);
      res.status(500).json({ error: 'Failed to get winners data' });
    }
  });

  // ========================================
  // PREDICTION SYSTEM API ENDPOINTS (Phase 2)
  // ========================================

  // === ADMIN PREDICTION QUESTION MANAGEMENT ===

  // Create new prediction question
  app.post('/api/admin/prediction-questions', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const {
        cycleSettingId,
        questionText,
        options,
        submissionDeadline,
        resultDeterminationTime
      } = req.body;

      const question = await storage.createPredictionQuestion({
        cycleSettingId,
        questionText,
        options: JSON.stringify(options), // Store as JSON string
        submissionDeadline: new Date(submissionDeadline),
        resultDeterminationTime: new Date(resultDeterminationTime),
        pointAwards: null, // Point allocation happens during result determination
        status: 'draft',
        createdBy: req.user.id
      });

      res.json({ success: true, question });
    } catch (error) {
      console.error('Error creating prediction question:', error);
      res.status(500).json({ error: 'Failed to create prediction question' });
    }
  });

  // Get a single prediction question by ID
  app.get('/api/admin/prediction-questions/question/:questionId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      const question = await storage.getPredictionQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ error: 'Prediction question not found' });
      }

      // Parse JSON strings back to objects for frontend
      const parsedQuestion = {
        ...question,
        options: JSON.parse(question.options),
        pointAwards: question.pointAwards ? JSON.parse(question.pointAwards) : null
      };

      res.json({ question: parsedQuestion });
    } catch (error) {
      console.error('Error getting prediction question:', error);
      res.status(500).json({ error: 'Failed to get prediction question' });
    }
  });

  // Get prediction questions for a cycle
  app.get('/api/admin/prediction-questions/cycle/:cycleSettingId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const questions = await storage.getPredictionQuestionsByCycle(cycleSettingId);
      
      // Parse JSON strings back to objects and map database fields to frontend interface
      const parsedQuestions = questions.map(q => ({
        ...q,
        options: JSON.parse(q.options),
        pointAwards: q.pointAwards ? JSON.parse(q.pointAwards) : null,
        // Map database status to frontend boolean fields
        isPublished: q.status === 'active',
        isResultDetermined: q.resultsPublished || false,
        pointsDistributed: q.pointsDistributed || false
      }));

      // Add cache-busting headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({ questions: parsedQuestions });
    } catch (error) {
      console.error('Error getting prediction questions:', error);
      res.status(500).json({ error: 'Failed to get prediction questions' });
    }
  });

  // Update prediction question
  app.put('/api/admin/prediction-questions/:questionId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      const updates = { ...req.body };
      
      // Convert arrays to JSON strings for storage
      if (updates.options) {
        updates.options = JSON.stringify(updates.options);
      }
      if (updates.pointAwards) {
        updates.pointAwards = JSON.stringify(updates.pointAwards);
      }
      if (updates.submissionDeadline) {
        updates.submissionDeadline = new Date(updates.submissionDeadline);
      }
      if (updates.resultDeterminationTime) {
        updates.resultDeterminationTime = new Date(updates.resultDeterminationTime);
      }

      const question = await storage.updatePredictionQuestion(questionId, updates);
      
      // Parse JSON strings back for response
      const parsedQuestion = {
        ...question,
        options: JSON.parse(question.options),
        pointAwards: question.pointAwards ? JSON.parse(question.pointAwards) : null
      };

      res.json({ success: true, question: parsedQuestion });
    } catch (error) {
      console.error('Error updating prediction question:', error);
      res.status(500).json({ error: 'Failed to update prediction question' });
    }
  });

  // Publish prediction question (make it live)
  app.post('/api/admin/prediction-questions/:questionId/publish', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      await storage.publishPredictionQuestion(questionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error publishing prediction question:', error);
      res.status(500).json({ error: 'Failed to publish prediction question' });
    }
  });

  // Close prediction question (stop accepting submissions)
  app.post('/api/admin/prediction-questions/:questionId/close', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      await storage.closePredictionQuestion(questionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error closing prediction question:', error);
      res.status(500).json({ error: 'Failed to close prediction question' });
    }
  });

  // Get prediction question statistics
  app.get('/api/admin/prediction-questions/:questionId/stats', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      const stats = await storage.getPredictionQuestionStats(questionId);
      res.json({ stats });
    } catch (error) {
      console.error('Error getting prediction question stats:', error);
      res.status(500).json({ error: 'Failed to get prediction question stats' });
    }
  });

  // === ADMIN PREDICTION RESULTS MANAGEMENT ===

  // Set prediction question result and award points
  app.post('/api/admin/prediction-questions/:questionId/results', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      const { correctAnswerIndex, pointsPerOption, notes } = req.body;

      // Get question statistics for result creation
      const stats = await storage.getPredictionQuestionStats(questionId);
      const question = await storage.getPredictionQuestion(questionId);

      if (!question) {
        return res.status(404).json({ error: 'Prediction question not found' });
      }

      // Validate pointsPerOption array matches the number of options
      const options = JSON.parse(question.options);
      if (!pointsPerOption || pointsPerOption.length !== options.length) {
        return res.status(400).json({ 
          error: `pointsPerOption must be an array with ${options.length} values (one for each answer option)` 
        });
      }

      // Update the prediction question with the correct answer index and custom point awards
      await storage.setPredictionQuestionResult(questionId, correctAnswerIndex, pointsPerOption);

      // Create prediction result
      const result = await storage.createPredictionResult({
        predictionQuestionId: questionId,
        correctAnswerIndex,
        totalParticipants: stats.totalSubmissions,
        optionStats: JSON.stringify(stats.optionCounts),
        totalPointsAwarded: 0, // Will be updated after distribution
        pointsPerOption: JSON.stringify(pointsPerOption),
        notes: notes || null,
        determinedBy: req.user.id
      });

      // Distribute points to users based on admin's custom point allocation
      const distributionResult = await storage.distributePredictionPoints(questionId);

      // Mark question as completed
      await storage.completePredictionQuestion(questionId, req.user.id);

      res.json({ 
        success: true, 
        result,
        distributionResult
      });
    } catch (error) {
      console.error('Error setting prediction results:', error);
      res.status(500).json({ error: 'Failed to set prediction results' });
    }
  });

  // Distribute points separately (if not done during result determination)
  app.post('/api/admin/prediction-questions/:questionId/distribute-points', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      
      // Check if question has result determined but points not distributed
      const question = await storage.getPredictionQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Prediction question not found' });
      }
      
      if (question.correctAnswerIndex === null || question.correctAnswerIndex === undefined) {
        return res.status(400).json({ error: 'Cannot distribute points before result is determined' });
      }
      
      if (question.pointsDistributed) {
        return res.status(400).json({ error: 'Points have already been distributed for this question' });
      }

      // Distribute points
      const distributionResult = await storage.distributePredictionPoints(questionId);

      res.json({ 
        success: true, 
        distributionResult
      });
    } catch (error) {
      console.error('Error distributing prediction points:', error);
      res.status(500).json({ error: 'Failed to distribute prediction points' });
    }
  });

  // === USER PREDICTION ENDPOINTS ===

  // Get active prediction questions for current cycle
  app.get('/api/predictions/active', authenticateToken, async (req, res) => {
    try {
      // Get current active cycle
      const activeCycle = await storage.getActiveCycleSetting();
      if (!activeCycle) {
        return res.json({ questions: [] });
      }

      const questions = await storage.getActivePredictionQuestions(activeCycle.id);
      
      // Parse JSON strings and hide admin-only data
      const userQuestions = await Promise.all(questions.map(async (q) => {
        // Get user's prediction for this question if exists
        const userPrediction = await storage.getUserPrediction(q.id, req.user.id);
        
        return {
          id: q.id,
          questionText: q.questionText,
          options: JSON.parse(q.options),
          pointAwards: JSON.parse(q.pointAwards || '[]'),
          submissionDeadline: q.submissionDeadline,
          resultDeterminationTime: q.resultDeterminationTime,
          isPublished: q.isPublished,
          isResultDetermined: q.resultsPublished || false,
          correctOptionIndex: q.resultsPublished ? q.correctAnswerIndex : undefined,
          status: q.status,
          totalSubmissions: q.totalSubmissions,
          userPrediction: userPrediction ? {
            id: userPrediction.id,
            selectedOptionIndex: userPrediction.selectedOptionIndex,
            submittedAt: userPrediction.submittedAt,
            pointsAwarded: userPrediction.pointsAwarded
          } : undefined
        };
      }));

      res.json({ questions: userQuestions });
    } catch (error) {
      console.error('Error getting active prediction questions:', error);
      res.status(500).json({ error: 'Failed to get prediction questions' });
    }
  });

  // Submit or update user prediction
  app.post('/api/predictions/:questionId/submit', authenticateToken, async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const { selectedOptionIndex } = req.body;

      // Check if question is still accepting submissions
      const question = await storage.getPredictionQuestion(questionId);
      if (!question || question.status !== 'active') {
        return res.status(400).json({ error: 'This prediction question is not accepting submissions' });
      }

      if (new Date() > question.submissionDeadline) {
        return res.status(400).json({ error: 'Submission deadline has passed' });
      }

      // Check if user already submitted for this question
      const existingPrediction = await storage.getUserPrediction(questionId, req.user.id);
      
      let prediction;
      if (existingPrediction) {
        // Update existing prediction
        prediction = await storage.updateUserPrediction(existingPrediction.id, selectedOptionIndex);
      } else {
        // Create new prediction
        prediction = await storage.submitUserPrediction({
          predictionQuestionId: questionId,
          userId: req.user.id,
          selectedOptionIndex,
          pointsAwarded: 0 // Will be set when results are determined
        });
      }

      res.json({ 
        success: true, 
        prediction,
        isUpdate: !!existingPrediction 
      });
    } catch (error) {
      console.error('Error submitting prediction:', error);
      res.status(500).json({ error: 'Failed to submit prediction' });
    }
  });

  // Update user prediction (if allowed)
  app.put('/api/predictions/:predictionId', authenticateToken, async (req, res) => {
    try {
      const predictionId = parseInt(req.params.predictionId);
      const { selectedOptionIndex } = req.body;

      // Get existing prediction to verify ownership
      const existingPrediction = await storage.getUserPrediction(predictionId, req.user.id);
      if (!existingPrediction) {
        return res.status(404).json({ error: 'Prediction not found' });
      }

      // Check if question is still accepting changes
      const question = await storage.getPredictionQuestion(existingPrediction.predictionQuestionId);
      if (!question || question.status !== 'active') {
        return res.status(400).json({ error: 'Cannot modify prediction for this question' });
      }

      if (new Date() > question.submissionDeadline) {
        return res.status(400).json({ error: 'Submission deadline has passed' });
      }

      const updatedPrediction = await storage.updateUserPrediction(predictionId, selectedOptionIndex);

      res.json({ success: true, prediction: updatedPrediction });
    } catch (error) {
      console.error('Error updating prediction:', error);
      res.status(500).json({ error: 'Failed to update prediction' });
    }
  });

  // Get user's prediction history
  app.get('/api/predictions/my-predictions', authenticateToken, async (req, res) => {
    try {
      const predictions = await storage.getUserPredictions(req.user.id);
      
      // Enrich with question data
      const enrichedPredictions = await Promise.all(
        predictions.map(async (prediction) => {
          const question = await storage.getPredictionQuestion(prediction.predictionQuestionId);
          const result = await storage.getPredictionResult(prediction.predictionQuestionId);
          
          return {
            ...prediction,
            question: question ? {
              questionText: question.questionText,
              options: JSON.parse(question.options),
              submissionDeadline: question.submissionDeadline,
              status: question.status,
              isResultDetermined: question.resultsPublished || false,
              correctOptionIndex: result?.correctAnswerIndex
            } : null,
            isCorrect: result ? result.correctAnswerIndex === prediction.selectedOptionIndex : null
          };
        })
      );

      res.json({ predictions: enrichedPredictions });
    } catch (error) {
      console.error('Error getting user predictions:', error);
      res.status(500).json({ error: 'Failed to get prediction history' });
    }
  });

  // Get user prediction statistics
  app.get('/api/predictions/my-stats', authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getUserPredictionStats(req.user.id);
      res.json({ stats });
    } catch (error) {
      console.error('Error getting user prediction stats:', error);
      res.status(500).json({ error: 'Failed to get prediction statistics' });
    }
  });

  // === PREDICTION ANALYTICS ENDPOINTS ===

  // Get prediction analytics for current cycle (admin)
  app.get('/api/admin/predictions/analytics/:cycleSettingId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const cycleSettingId = parseInt(req.params.cycleSettingId);
      const analytics = await storage.getPredictionAnalyticsByCycle(cycleSettingId);
      res.json({ analytics });
    } catch (error) {
      console.error('Error getting prediction analytics:', error);
      res.status(500).json({ error: 'Failed to get prediction analytics' });
    }
  });

  // Delete prediction question (admin only)
  app.delete('/api/admin/prediction-questions/:questionId', authenticateToken, async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const questionId = parseInt(req.params.questionId);
      
      // Only allow deletion of draft questions
      const question = await storage.getPredictionQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Prediction question not found' });
      }
      
      if (question.status !== 'draft') {
        return res.status(400).json({ error: 'Can only delete draft questions' });
      }

      await storage.deletePredictionQuestion(questionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting prediction question:', error);
      res.status(500).json({ error: 'Failed to delete prediction question' });
    }
  });

  // Mount email service routes
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api/dev/email', devEmailTest);
  }
  // Note: Webhook route already mounted at line 154 above - removing duplicate
  
  // Mount auth routes
  app.use('/api/auth', signupRouter);
  app.use('/api/auth', authCompatRouter);
  app.use('/api/admin/email', adminEmailRouter);

  // Expose broadcast functions for use in other routes
  (httpServer as any).broadcastAnalyticsUpdate = broadcastAnalyticsUpdate;
  (httpServer as any).broadcastActivityUpdate = broadcastActivityUpdate;
  
  return httpServer;
}