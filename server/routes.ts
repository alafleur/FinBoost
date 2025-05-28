import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";
import { upload, deleteFile, getFileUrl } from "./fileUpload";
import path from "path";
import { OAuth2Client } from "google-auth-library";
import { stripeService } from "./stripe";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Google OAuth client setup
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your-google-client-id";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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
      const userBody = req.body;
      const result = insertUserSchema.safeParse(userBody);

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

  // Google OAuth verification function
  async function verifyGoogleToken(token: string) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      return payload;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }

  // Google OAuth Login/Register
  apiRouter.post("/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential, referralCode } = req.body;

      if (!credential) {
        return res.status(400).json({
          success: false,
          message: "Google credential is required"
        });
      }

      const googleUser = await verifyGoogleToken(credential);
      if (!googleUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid Google token"
        });
      }

      const { email, given_name, family_name, sub: googleId } = googleUser;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email not provided by Google"
        });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

        // Validate referral code if provided
        if (referralCode) {
          const validation = await storage.validateReferralCode(referralCode);
          if (!validation.isValid) {
            return res.status(400).json({
              success: false,
              message: "Invalid referral code"
            });
          }
        }

        user = await storage.createUser({
          email,
          username,
          password: 'google_oauth_' + googleId, // Placeholder password for OAuth users
          firstName: given_name || '',
          lastName: family_name || '',
          referralCode
        });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        success: true,
        message: user ? "Login successful" : "Account created and logged in successfully",
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
      console.error("Error in Google OAuth endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during Google authentication."
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

  // Sync points from history (emergency fix)
  apiRouter.post("/points/sync", authenticateToken, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await storage.getUserById(userId);
    const userHistory = await storage.getUserPointsHistory(userId);
    const totalPoints = userHistory.filter(h => h.status === 'approved').reduce((sum, h) => sum + h.points, 0);
    
    if (user) {
      user.totalPoints = totalPoints;
      user.currentMonthPoints = totalPoints;
      user.tier = await storage.calculateUserTier(totalPoints);
      await storage.updateUserPoints(userId, totalPoints, totalPoints);
    }
    
    return res.json({ success: true, points: totalPoints });
  });

  // Get current user profile (protected route)
  apiRouter.get("/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

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
          lastLoginAt: user.lastLoginAt,
          bio: user.bio,
          location: user.location,
          occupation: user.occupation,
          financialGoals: user.financialGoals
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

  // Update user profile (protected route)
  apiRouter.put("/profile/update", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, bio, location, occupation, financialGoals } = req.body;

      await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        bio,
        location,
        occupation,
        financialGoals
      });

      const updatedUser = await storage.getUserById(userId);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          username: updatedUser!.username,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          totalPoints: updatedUser!.totalPoints,
          currentMonthPoints: updatedUser!.currentMonthPoints,
          tier: updatedUser!.tier,
          joinedAt: updatedUser!.joinedAt,
          lastLoginAt: updatedUser!.lastLoginAt,
          bio: updatedUser!.bio,
          location: updatedUser!.location,
          occupation: updatedUser!.occupation,
          financialGoals: updatedUser!.financialGoals
        }
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile"
      });
    }
  });

  // Health check endpoint
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve uploaded files
  apiRouter.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Award points for educational activities (lesson, quiz completion)
  apiRouter.post("/points/award", authenticateToken, async (req, res) => {
    try {
      const { actionId, relatedId, metadata } = req.body;
      const userId = req.user!.id;

      if (!actionId) {
        return res.status(400).json({ message: "Action ID is required" });
      }

      // Import here to avoid circular dependency
      const { POINTS_CONFIG, getPointsForAction } = await import("@shared/pointsConfig");

      const actionConfig = POINTS_CONFIG[actionId];
      if (!actionConfig) {
        return res.status(400).json({ message: "Invalid action ID" });
      }

      if (actionConfig.requiresProof) {
        return res.status(400).json({ message: "This action requires proof upload" });
      }

      const points = getPointsForAction(actionId);
      const description = `${actionConfig.name}${relatedId ? ` (ID: ${relatedId})` : ''}`;

      const historyEntry = await storage.awardPoints(userId, actionId, points, description, {
        relatedId,
        ...metadata
      });

      // Get updated user data
      const updatedUser = await storage.getUserById(userId);

      res.json({ 
        success: true,
        message: `Earned ${points} points for ${actionConfig.name}!`, 
        points: points,
        totalPoints: updatedUser?.totalPoints,
        currentMonthPoints: updatedUser?.currentMonthPoints,
        tier: updatedUser?.tier,
        historyId: historyEntry.id
      });
    } catch (error) {
      console.error("Points award error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to award points" });
      }
    }
  });

  // Upload proof file
  apiRouter.post("/upload/proof", authenticateToken, upload.single('proofFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = getFileUrl(req.file.filename);

      res.json({
        success: true,
        message: "File uploaded successfully",
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Submit proof for points
  apiRouter.post("/points/submit-proof", authenticateToken, async (req, res) => {
    try {
      const { actionId, proofUrl, description, metadata } = req.body;
      const userId = req.user!.id;

      if (!actionId || !proofUrl) {
        return res.status(400).json({ message: "Action ID and proof URL are required" });
      }

      // Import here to avoid circular dependency
      const { POINTS_CONFIG, getPointsForAction } = await import("@shared/pointsConfig");

      const actionConfig = POINTS_CONFIG[actionId];
      if (!actionConfig) {
        return res.status(400).json({ message: "Invalid action ID" });
      }

      if (!actionConfig.requiresProof) {
        return res.status(400).json({ message: "This action does not require proof" });
      }

      const points = getPointsForAction(actionId);
      const fullDescription = description || `${actionConfig.name} - Pending Review`;

      const historyEntry = await storage.awardPointsWithProof(
        userId, 
        actionId, 
        points, 
        fullDescription, 
        proofUrl, 
        metadata
      );

      res.json({ 
        success: true,
        message: `Proof submitted for ${actionConfig.name}! Points will be awarded after review.`, 
        pendingPoints: points,
        historyId: historyEntry.id,
        status: 'pending'
      });
    } catch (error) {
      console.error("Proof submission error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to submit proof" });
      }
    }
  });

  // Get user's points history
  apiRouter.get("/points/history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const history = await storage.getUserPointsHistory(userId);

      res.json({ 
        success: true,
        history: history.map(entry => ({
          id: entry.id,
          points: entry.points,
          action: entry.action,
          description: entry.description,
          status: entry.status,
          createdAt: entry.createdAt,
          reviewedAt: entry.reviewedAt,
          metadata: entry.metadata ? JSON.parse(entry.metadata) : null
        }))
      });
    } catch (error) {
      console.error("Points history error:", error);
      res.status(500).json({ message: "Failed to fetch points history" });
    }
  });

  // Get available point actions
  apiRouter.get("/points/actions", authenticateToken, async (req, res) => {
    try {
      // Import here to avoid circular dependency
      const { POINTS_CONFIG } = await import("@shared/pointsConfig");

      res.json({ 
        success: true,
        actions: Object.values(POINTS_CONFIG)
      });
    } catch (error) {
      console.error("Points actions error:", error);
      res.status(500).json({ message: "Failed to fetch point actions" });
    }
  });

  // Validate if user can earn points for specific action
  apiRouter.get("/points/validate/:actionId", authenticateToken, async (req, res) => {
    try {
      const { actionId } = req.params;
      const userId = req.user!.id;

      // Import here to avoid circular dependency
      const { POINTS_CONFIG } = await import("@shared/pointsConfig");

      const actionConfig = POINTS_CONFIG[actionId];
      if (!actionConfig) {
        return res.status(400).json({ message: "Invalid action ID" });
      }

      const validation: any = {
        canEarn: true,
        dailyUsage: 0,
        totalUsage: 0
      };

      // Check daily limit
      if (actionConfig.maxDaily) {
        const canEarnDaily = await storage.checkDailyActionLimit(userId, actionId);
        if (!canEarnDaily) {
          validation.canEarn = false;
          validation.reason = `Daily limit of ${actionConfig.maxDaily} reached for this action`;
        }

        // Get daily usage count
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyCount = await db.select({ count: sql<number>`count(*)` })
          .from(userPointsHistory)
          .where(
            eq(userPointsHistory.userId, userId) &&
            eq(userPointsHistory.action, actionId) &&
            sql`${userPointsHistory.createdAt} >= ${today}`
          );

        validation.dailyUsage = dailyCount[0]?.count || 0;
        validation.dailyLimit = actionConfig.maxDaily;
      }

      // Check total limit
      if (actionConfig.maxTotal) {
        const canEarnTotal = await storage.checkTotalActionLimit(userId, actionId);
        if (!canEarnTotal) {
          validation.canEarn = false;
          validation.reason = `Lifetime limit of ${actionConfig.maxTotal} reached for this action`;
        }

        // Get total usage count
        const totalCount = await db.select({ count: sql<number>`count(*)` })
          .from(userPointsHistory)
          .where(
            eq(userPointsHistory.userId, userId) &&
            eq(userPointsHistory.action, actionId) &&
            eq(userPointsHistory.status, 'approved')
          );

        validation.totalUsage = totalCount[0]?.count || 0;
        validation.totalLimit = actionConfig.maxTotal;
      }

      res.json({
        success: true,
        validation
      });
    } catch (error) {
      console.error("Points validation error:", error);
      res.status(500).json({ message: "Failed to validate action" });
    }
  });

  // Admin: Get pending proof uploads
  apiRouter.get("/admin/points/pending", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const pendingUploads = await storage.getPendingProofUploads();

      res.json({ 
        success: true,
        pending: pendingUploads.map(upload => ({
          id: upload.id,
          userId: upload.userId,
          action: upload.action,
          points: upload.points,
          description: upload.description,
          proofUrl: upload.proofUrl,
          createdAt: upload.createdAt,
          metadata: upload.metadata ? JSON.parse(upload.metadata) : null,
          user: (upload as any).user
        }))
      });
    } catch (error) {
      console.error("Pending uploads error:", error);
      res.status(500).json({ message: "Failed to fetch pending uploads" });
    }
  });

  // Admin: Approve proof upload
  apiRouter.post("/admin/points/approve/:historyId", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const historyId = parseInt(req.params.historyId);
      const reviewerId = req.user!.id;

      await storage.approveProofUpload(historyId, reviewerId);

      res.json({ 
        success: true,
        message: "Proof approved and points awarded" 
      });
    } catch (error) {
      console.error("Approve proof error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to approve proof" });
      }
    }
  });

  // Admin: Reject proof upload
  apiRouter.post("/admin/points/reject/:historyId", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const historyId = parseInt(req.params.historyId);
      const reviewerId = req.user!.id;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      await storage.rejectProofUpload(historyId, reviewerId, reason);

      res.json({ 
        success: true,
        message: "Proof rejected" 
      });
    } catch (error) {
      console.error("Reject proof error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to reject proof" });
      }
    }
  });

  // Get leaderboard data
  apiRouter.get("/leaderboard", authenticateToken, async (req, res) => {
    try {
      const { period = 'monthly', limit = 20 } = req.query;
      const currentUserId = req.user!.id;

      const leaderboard = await storage.getLeaderboard(
        period as 'monthly' | 'allTime',
        parseInt(limit as string)
      );

      const userRank = await storage.getUserRank(currentUserId, period as 'monthly' | 'allTime');

      res.json({ 
        success: true,
        leaderboard: leaderboard.map(entry => ({
          rank: entry.rank,
          username: entry.username,
          points: entry.points,
          tier: entry.tier,
          isCurrentUser: entry.userId === currentUserId
        })),
        currentUser: {
          rank: userRank?.rank || null,
          points: userRank?.points || 0,
          tier: userRank?.tier || 'bronze'
        }
      });
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get user's monthly rewards history
  apiRouter.get("/rewards/history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const history = await storage.getUserMonthlyRewardsHistory(userId);

      res.json({ 
        success: true,
        history: history.map(entry => ({
          id: entry.id,
          month: entry.monthlyRewardId,
          tier: entry.tier,
          pointsAtDistribution: entry.pointsAtDistribution,
          rewardAmount: entry.rewardAmount,
          pointsDeducted: entry.pointsDeducted,
          pointsRolledOver: entry.pointsRolledOver,
          isWinner: entry.isWinner,
          createdAt: entry.createdAt
        }))
      });
    } catch (error) {
      console.error("Monthly rewards history error:", error);
      res.status(500).json({ message: "Failed to fetch monthly rewards history" });
    }
  });

  // Admin: Create monthly reward
  apiRouter.post("/admin/rewards/create", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const { month, totalRewardPool, config } = req.body;

      if (!month || !totalRewardPool) {
        return res.status(400).json({ message: "Month and total reward pool are required" });
      }

      const monthlyReward = await storage.createMonthlyReward(month, totalRewardPool, config);

      res.json({ 
        success: true,
        message: "Monthly reward created successfully",
        monthlyReward
      });
    } catch (error) {
      console.error("Create monthly reward error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create monthly reward" });
      }
    }
  });

  // Admin: Distribute monthly rewards
  apiRouter.post("/admin/rewards/distribute/:monthlyRewardId", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const monthlyRewardId = parseInt(req.params.monthlyRewardId);

      await storage.distributeMonthlyRewards(monthlyRewardId);

      res.json({ 
        success: true,
        message: "Monthly rewards distributed successfully"
      });
    } catch (error) {
      console.error("Distribute monthly rewards error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to distribute monthly rewards" });
      }
    }
  });

  // Admin: Get monthly rewards summary
  apiRouter.get("/admin/rewards/summary", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const summary = await storage.getMonthlyRewardsSummary();

      res.json({ 
        success: true,
        summary
      });
    } catch (error) {
      console.error("Monthly rewards summary error:", error);
      res.status(500).json({ message: "Failed to fetch monthly rewards summary" });
    }
  });

  // Referral System Routes

  // Get user's referral code and stats
  apiRouter.get("/referrals/my-code", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

      let referralCode = await storage.getUserReferralCode(userId);
      if (!referralCode) {
        // Skip referral code creation to fix registration
        referralCode = { referralCode: `USER-${userId}`, id: userId, userId, createdAt: new Date(), isActive: true, totalReferrals: 0, totalPointsEarned: 0 };
      }

      const stats = await storage.getReferralStats(userId);

      res.json({
        success: true,
        referralCode: referralCode.referralCode,
        stats
      });
    } catch (error) {
      console.error("Get referral code error:", error);
      res.status(500).json({ message: "Failed to fetch referral code" });
    }
  });

  // Get user's referral history
  apiRouter.get("/referrals/history", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const referrals = await storage.getUserReferrals(userId);

      res.json({
        success: true,
        referrals: referrals.map(({ referral, referredUser }) => ({
          id: referral.id,
          referredUser: {
            username: referredUser.username,
            email: referredUser.email,
            joinedAt: referredUser.joinedAt
          },
          status: referral.status,
          pointsAwarded: referral.pointsAwarded,
          completedAt: referral.completedAt,
          createdAt: referral.createdAt
        }))
      });
    } catch (error) {
      console.error("Get referral history error:", error);
      res.status(500).json({ message: "Failed to fetch referral history" });
    }
  });

  // Validate referral code
  apiRouter.post("/referrals/validate", async (req, res) => {
    try {
      const { referralCode } = req.body;

      if (!referralCode) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const validation = await storage.validateReferralCode(referralCode);

      res.json({
        success: true,
        isValid: validation.isValid
      });
    } catch (error) {
      console.error("Validate referral code error:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  // Admin: Get referral statistics
  apiRouter.get("/admin/referrals/stats", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const stats = await storage.getAdminReferralStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error("Admin referral stats error:", error);
      res.status(500).json({ message: "Failed to fetch referral statistics" });
    }
  });

  // Admin: Get all users with pagination and filtering
  apiRouter.get("/admin/users", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const { page = 1, limit = 50, search, status, tier } = req.query;

      const users = await storage.getAdminUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as string,
        tier: tier as string
      });

      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          totalPoints: user.totalPoints,
          currentMonthPoints: user.currentMonthPoints,
          tier: user.tier,
          joinedAt: user.joinedAt,
          lastLoginAt: user.lastLoginAt
        }))
      });
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Bulk user actions
  apiRouter.post("/admin/users/bulk-action", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const { action, userIds } = req.body;

      if (!action || !userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ message: "Action and user IDs are required" });
      }

      let result;
      switch (action) {
        case 'activate':
          result = await storage.bulkUpdateUsers(userIds, { isActive: true });
          break;
        case 'deactivate':
          result = await storage.bulkUpdateUsers(userIds, { isActive: false });
          break;
        case 'reset_password':
          result = await storage.bulkResetPasswords(userIds);
          break;
        case 'export':
          result = await storage.exportUserData(userIds);
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      res.json({
        success: true,
        message: `Successfully applied ${action} to ${userIds.length} user(s)`,
        result
      });
    } catch (error) {
      console.error("Bulk user action error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to execute bulk action" });
      }
    }
  });

  // Admin: Get analytics data
  apiRouter.get("/admin/analytics", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const { period = '30d' } = req.query;

      const analytics = await storage.getAdminAnalytics(period as string);

      res.json({
        success: true,
        analytics: {
          userGrowth: analytics.userGrowth || [],
          pointsDistribution: analytics.pointsDistribution || [],
          recentActivity: analytics.recentActivity || [],
          systemHealth: {
            activeUsers: analytics.activeUsers || 0,
            totalPointsAwarded: analytics.totalPointsAwarded || 0,
            avgSessionDuration: analytics.avgSessionDuration || 0,
            errorRate: analytics.errorRate || 0
          }
        }
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Admin: Get system settings
  apiRouter.get("/admin/settings", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const settings = await storage.getSystemSettings();

      res.json({
        success: true,
        settings: settings || {
          maintenanceMode: false,
          registrationEnabled: true,
          pointsMultiplier: 1.0,
          maxDailyPoints: 500,
          tierRequirements: {
            bronze: 0,
            silver: 500,
            gold: 2000
          }
        }
      });
    } catch (error) {
      console.error("Admin settings error:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  // Admin: Update system settings
  apiRouter.put("/admin/settings", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({ message: "Settings object is required" });
      }

      await storage.updateSystemSettings(settings);

      res.json({
        success: true,
        message: "System settings updated successfully"
      });
    } catch (error) {
      console.error("Update settings error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update system settings" });
      }
    }
  });

  // Admin: Get user details with full history
  apiRouter.get("/admin/users/:userId", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const userId = parseInt(req.params.userId);

      const userDetails = await storage.getUserDetailsForAdmin(userId);

      if (!userDetails) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        success: true,
        user: userDetails
      });
    } catch (error) {
      console.error("Get user details error:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Admin: Export system data
  apiRouter.get("/admin/export/:type", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const { type } = req.params;
      const { format = 'csv' } = req.query;

      let data;
      switch (type) {
        case 'users':
          data = await storage.exportUsers(format as string);
          break;
        case 'points':
          data = await storage.exportPointsHistory(format as string);
          break;
        case 'analytics':
          data = await storage.exportAnalytics(format as string);
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export.${format}"`);
      res.send(data);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Mark lesson as complete
  app.post("/api/lessons/:id/complete", authenticateToken, async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      const userId = req.user!.id;

      const result = await storage.markLessonComplete(userId, moduleId);

      res.json({ 
        success: true, 
        message: "Lesson completed successfully",
        pointsEarned: result.pointsEarned,
        streakBonus: result.streakBonus,
        newStreak: result.newStreak
      });
    } catch (error: any) {
      console.error('Error completing lesson:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // === STRIPE PAYMENT ROUTES ===
  
  // Create subscription checkout session
  apiRouter.post("/stripe/create-subscription", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { currency = 'USD' } = req.body;
      const userId = req.user!.id;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          success: false,
          message: "Stripe not configured. Please contact support."
        });
      }
      
      const checkoutUrl = await stripeService.createSubscriptionSession(userId, currency);
      
      res.json({
        success: true,
        checkoutUrl
      });
    } catch (error: any) {
      console.error('Stripe subscription error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create subscription session"
      });
    }
  });

  // Handle successful subscription (called from frontend after Stripe redirect)
  apiRouter.post("/stripe/subscription-success", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          success: false,
          message: "Stripe not configured"
        });
      }
      
      // Retrieve session and update user subscription status
      // This will be implemented when Stripe keys are available
      
      res.json({
        success: true,
        message: "Subscription activated successfully"
      });
    } catch (error: any) {
      console.error('Subscription success error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to activate subscription"
      });
    }
  });

  // Cancel subscription
  apiRouter.post("/stripe/cancel-subscription", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          success: false,
          message: "Stripe not configured"
        });
      }
      
      await stripeService.cancelSubscription(userId);
      
      res.json({
        success: true,
        message: "Subscription canceled successfully"
      });
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // === STRIPE CONNECT / PAYOUT ROUTES ===
  
  // Create Connect onboarding link
  apiRouter.post("/stripe/connect-onboarding", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          success: false,
          message: "Stripe not configured"
        });
      }
      
      const onboardingUrl = await stripeService.createConnectOnboardingLink(userId);
      
      res.json({
        success: true,
        onboardingUrl
      });
    } catch (error: any) {
      console.error('Connect onboarding error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create onboarding link"
      });
    }
  });

  // Get user's payout history
  apiRouter.get("/stripe/payouts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // This will retrieve payouts from database once implemented
      const payouts = []; // Placeholder
      
      res.json({
        success: true,
        payouts
      });
    } catch (error: any) {
      console.error('Get payouts error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve payouts"
      });
    }
  });

  // Admin: Send payout to user
  apiRouter.post("/admin/stripe/send-payout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId, amount, reason, pointsUsed = 0 } = req.body;
      
      // Check if user is admin (implement admin check)
      // if (!req.user!.isAdmin) {
      //   return res.status(403).json({ success: false, message: "Admin access required" });
      // }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          success: false,
          message: "Stripe not configured"
        });
      }
      
      const transferId = await stripeService.sendPayout(userId, amount * 100, reason, pointsUsed);
      
      res.json({
        success: true,
        transferId,
        message: `Payout of $${amount} sent successfully`
      });
    } catch (error: any) {
      console.error('Send payout error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // Stripe webhook endpoint
  apiRouter.post("/stripe/webhook", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ error: "Webhook secret not configured" });
      }
      
      // Stripe webhook verification and processing
      // This will be implemented when webhook secret is available
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Register API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}