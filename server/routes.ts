import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";
import { upload, deleteFile, getFileUrl } from "./fileUpload";
import path from "path";

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

  // Admin: Get pending proof uploads
  apiRouter.get("/admin/points/pending", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const pendingUploads = await storage.getPendingProofUploads();

      res.json({ 
        success: true,
        pending: pendingUploads
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

  // Register API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}