import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema, insertUserSchema, loginUserSchema, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import jwt from "jsonwebtoken";
import type { User } from "@shared/schema";
import { upload, deleteFile, getFileUrl } from "./fileUpload";
import path from "path";
import { OAuth2Client } from "google-auth-library";
import { stripeService } from "./stripe";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, userPointsHistory, learningModules } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper function to calculate next distribution date
function calculateNextDistributionDate(settings: {[key: string]: string}): Date {
  const now = new Date();
  const delayDays = parseInt(settings.distributionDelayDays || "7");

  let accumulationEndDate: Date;

  switch (settings.accumulationPeriodEnd) {
    case "last_day_of_month":
      // Last day of current month
      accumulationEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "last_thursday":
      // Last Thursday of current month
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const lastThursday = new Date(lastDay);
      lastThursday.setDate(lastDay.getDate() - ((lastDay.getDay() + 3) % 7));
      accumulationEndDate = lastThursday;
      break;
    case "15th":
      // 15th of current month
      accumulationEndDate = new Date(now.getFullYear(), now.getMonth(), 15);
      if (accumulationEndDate < now) {
        accumulationEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      }
      break;
    default:
      // Default to last day of month
      accumulationEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // If accumulation period has passed, move to next period
  if (accumulationEndDate < now) {
    switch (settings.accumulationPeriodEnd) {
      case "last_day_of_month":
        accumulationEndDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        break;
      case "15th":
        accumulationEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
        break;
      // Add more cases as needed
    }
  }

  // Add distribution delay
  const distributionDate = new Date(accumulationEndDate);
  distributionDate.setDate(distributionDate.getDate() + delayDays);

  return distributionDate;
}

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

      // Award daily login points (check daily limit first)
      try {
        const canEarnDaily = await storage.checkDailyActionLimit(user.id, 'daily-login');
        if (canEarnDaily) {
          await storage.awardPoints(user.id, 'daily-login', 5, 'Daily login bonus - Welcome!');
        }
      } catch (error) {
        console.log('Daily login points already awarded or error:', error);
      }

      // Get updated user data after points award
      const updatedUser = await storage.getUserById(user.id);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({ 
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          username: updatedUser!.username,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          totalPoints: updatedUser!.totalPoints,
          currentMonthPoints: updatedUser!.currentMonthPoints,
          tier: updatedUser!.tier
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
          lastName: family_name || ''
        });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Award daily login points (check daily limit first)
      try {
        const canEarnDaily = await storage.checkDailyActionLimit(user.id, 'daily-login');
        if (canEarnDaily) {
          await storage.awardPoints(user.id, 'daily-login', 5, 'Daily login bonus');
        }
      } catch (error) {
        console.log('Daily login points already awarded or error:', error);
      }

      // Get updated user data after points award
      const updatedUser = await storage.getUserById(user.id);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        success: true,
        message: user ? "Login successful" : "Account created and logged in successfully",
        token,
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          username: updatedUser!.username,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          totalPoints: updatedUser!.totalPoints,
          currentMonthPoints: updatedUser!.currentMonthPoints,
          tier: updatedUser!.tier
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

      // Award daily login points (check daily limit first)
      try {
        const canEarnDaily = await storage.checkDailyActionLimit(user.id, 'daily-login');
        if (canEarnDaily) {
          await storage.awardPoints(user.id, 'daily-login', 5, 'Daily login bonus');
        }
      } catch (error) {
        console.log('Daily login points already awarded or error:', error);
      }

      // Get updated user data after points award
      const updatedUser = await storage.getUserById(user.id);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({ 
        success: true,
        message: "Login successful",
        token,
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          username: updatedUser!.username,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          totalPoints: updatedUser!.totalPoints,
          currentMonthPoints: updatedUser!.currentMonthPoints,
          tier: updatedUser!.tier
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

  // Forgot Password - Request Reset
  apiRouter.post("/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const result = forgotPasswordSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          success: false,
          message: validationError.message 
        });
      }

      const { email } = result.data;

      // Check if user exists
      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      // but only send email if user exists
      if (user) {
        try {
          const resetToken = await storage.createPasswordResetToken(user.id);

          // In a real app, you'd send an email here
          // For now, we'll log the reset URL (in development only)
          if (process.env.NODE_ENV === 'development') {
            console.log(`Password reset link for ${email}: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`);
          }

          // TODO: Implement email sending service
          // await emailService.sendPasswordResetEmail(email, resetToken);
        } catch (error) {
          console.error("Error creating password reset token:", error);
        }
      }

      return res.status(200).json({ 
        success: true,
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (error) {
      console.error("Error in forgot password endpoint:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while processing your request." 
      });
    }
  });

  // Reset Password - Submit New Password
  apiRouter.post("/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const result = resetPasswordSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          success: false,
          message: validationError.message 
        });
      }

      const { token, newPassword } = result.data;

      const success = await storage.resetUserPassword(token, newPassword);

      if (!success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid or expired reset token." 
        });
      }

      // Clean up expired tokens
      await storage.cleanupExpiredTokens();

      return res.status(200).json({ 
        success: true,
        message: "Password has been reset successfully. You can now login with your new password." 
      });
    } catch (error) {
      console.error("Error in reset password endpoint:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while resetting your password." 
      });
    }
  });

  // Validate Reset Token
  apiRouter.post("/auth/validate-reset-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ 
          success: false,
          message: "Reset token is required." 
        });
      }

      const validation = await storage.validatePasswordResetToken(token);

      return res.status(200).json({ 
        success: true,
        isValid: validation.isValid
      });
    } catch (error) {
      console.error("Error validating reset token:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while validating the token." 
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

  // Get current tier thresholds
  apiRouter.get("/tiers/thresholds", async (req: Request, res: Response) => {
    try {
      const thresholds = await storage.getTierThresholds();

      return res.status(200).json({ 
        success: true,
        thresholds
      });
    } catch (error) {
      console.error("Error fetching tier thresholds:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while fetching tier thresholds." 
      });
    }
  });

  // Get monthly pool calculation
  apiRouter.get("/pool/monthly", async (req: Request, res: Response) => {
    try {
      // Get total active users count
      const totalUsers = await storage.getUserCount();

      // Monthly membership fee
      const monthlyFee = 20;

      // Calculate total monthly revenue
      const totalRevenue = totalUsers * monthlyFee;

      // 55% goes to reward pool, 45% to education costs
      const totalPool = totalRevenue * 0.55;

      // Pool distribution: Tier 3 (50%), Tier 2 (30%), Tier 1 (20%)
      const tier3Pool = totalPool * 0.50;
      const tier2Pool = totalPool * 0.30;
      const tier1Pool = totalPool * 0.20;

      return res.status(200).json({
        success: true,
        pool: {
          totalUsers,
          totalRevenue,
          totalPool: Math.round(totalPool),
          tier3Pool: Math.round(tier3Pool),
          tier2Pool: Math.round(tier2Pool),
          tier1Pool: Math.round(tier1Pool),
          monthlyFee
        }
      });
    } catch (error) {
      console.error("Error calculating monthly pool:", error);
      return res.status(500).json({
        success: false,
        message: "Error calculating monthly pool"
      });
    }
  });

  // Get next reward distribution date with countdown
  apiRouter.get("/pool/next-distribution", async (req: Request, res: Response) => {
    try {
      // Get admin settings for distribution
      const settings = await storage.getDistributionSettings();

      // Calculate next distribution date based on settings
      const nextDistribution = calculateNextDistributionDate(settings);
      const now = new Date();
      const timeRemaining = nextDistribution.getTime() - now.getTime();

      // Calculate days, hours, minutes remaining
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

      return res.status(200).json({
        success: true,
        distribution: {
          nextDate: nextDistribution.toISOString(),
          timeRemaining: {
            days: Math.max(0, days),
            hours: Math.max(0, hours),
            minutes: Math.max(0, minutes),
            totalMs: Math.max(0, timeRemaining)
          },
          settings
        }
      });
    } catch (error) {
      console.error("Error calculating next distribution:", error);
      return res.status(500).json({
        success: false,
        message: "Error calculating next distribution"
      });
    }
  });

  // Get user's learning progress
  apiRouter.get("/user/progress", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const progress = await storage.getUserProgress(userId);

      // Count completed lessons
      const completedCount = progress.filter(p => p.completed).length;

      console.log(`User ${userId} has ${completedCount} completed lessons from progress data`);

      return res.status(200).json({ 
        success: true,
        progress,
        completedCount
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while fetching progress." 
      });
    }
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
      // Get real completion data from database
      const totalCompletionsResult = await db.execute(sql`
        SELECT COUNT(*) as total_completions 
        FROM user_progress 
        WHERE completed = true
      `);

      const totalUsersResult = await db.execute(sql`
        SELECT COUNT(*) as total_users 
        FROM users 
        WHERE is_active = true
      `);

      const totalPointsResult = await db.execute(sql`
        SELECT SUM(total_points) as total_points 
        FROM users
      `);

      const totalCompletions = parseInt(totalCompletionsResult[0]?.total_completions || 0);
      const totalUsers = parseInt(totalUsersResult[0]?.total_users || 0);
      const totalPoints = parseInt(totalPointsResult[0]?.total_points || 0);

      res.json({
        success: true,
        analytics: {
          userGrowth: [],
          pointsDistribution: [],
          recentActivity: [],
          totalCompletions,
          systemHealth: {
            activeUsers: totalUsers,
            totalPointsAwarded: totalPoints,
            avgSessionDuration: 0,
            errorRate: 0
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

  // Admin: Get rewards configuration
  apiRouter.get("/admin/rewards/config", authenticateToken, async (req, res) => {
    try {
      // Get rewards configuration from database or return defaults
      const defaultConfig = {
        poolPercentage: 55,
        tierAllocations: {
          tier1: 50,
          tier2: 30,
          tier3: 20
        },
        winnerPercentages: {
          tier1: 50,
          tier2: 50,
          tier3: 50
        },
        tierPercentiles: {
          tier1: 33,
          tier2: 33,
          tier3: 34
        }
      };

      // Try to get from database, fallback to defaults
      try {
        const configResult = await db.execute(sql`
          SELECT config_data FROM rewards_config WHERE id = 1
        `);

        let config = defaultConfig;
        if (configResult[0]?.config_data) {
          config = JSON.parse(configResult[0].config_data);
        }

        res.json({
          success: true,
          config
        });
      } catch (dbError) {
        // Table might not exist yet, return defaults
        res.json({
          success: true,
          config: defaultConfig
        });
      }
    } catch (error) {
      console.error("Admin rewards config error:", error);
      res.status(500).json({ message: "Failed to fetch rewards configuration" });
    }
  });

  // Admin: Update rewards configuration
  apiRouter.put("/admin/rewards/config", authenticateToken, async (req, res) => {
    try {
      const { config } = req.body;

      // Validate configuration
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ message: "Invalid configuration data" });
      }

      // Ensure rewards_config table exists
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS rewards_config (
          id INTEGER PRIMARY KEY,
          config_data TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `);

      // Save to database
      await db.execute(sql`
        INSERT INTO rewards_config (id, config_data, updated_at)
        VALUES (1, ${JSON.stringify(config)}, ${new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET
          config_data = ${JSON.stringify(config)},
          updated_at = ${new Date().toISOString()}
      `);

      res.json({
        success: true,
        message: "Rewards configuration updated successfully",
        config
      });
    } catch (error) {
      console.error("Admin rewards config update error:", error);
      res.status(500).json({ message: "Failed to update rewards configuration" });
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

  // === CUSTOMER SUPPORT ROUTES ===

  // Submit support request
  apiRouter.post("/support", async (req: Request, res: Response) => {
    try {
      const { name, email, category, message, hasAttachment, fileName } = req.body;

      // Validate required fields
      if (!name || !email || !category || !message) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided"
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address"
        });
      }

      // Validate message length
      if (message.trim().length < 20) {
        return res.status(400).json({
          success: false,
          message: "Message must be at least 20 characters long"
        });
      }

      // Validate category
      const validCategories = ['general', 'billing', 'technical', 'feedback'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category selected"
        });
      }

      // Get user ID if authenticated
      let userId = null;
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
          userId = decoded.userId;
        } catch (error) {
          // User not authenticated, but that's okay for support requests
        }
      }

      const supportRequest = await storage.createSupportRequest({
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        category,
        message: message.trim(),
        hasAttachment: hasAttachment || false,
        fileName: fileName || null
      });

      console.log('New support request:', {
        id: supportRequest.id,
        name,
        email,
        category,
        userId
      });

      res.status(201).json({
        success: true,
        message: "Support request submitted successfully",
        requestId: supportRequest.id
      });
    } catch (error) {
      console.error("Support request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit support request"
      });
    }
  });

  // Admin: Get all support requests
  apiRouter.get("/admin/support", authenticateToken, async (req: Request, res: Response) => {
    try {
      // TODO: Add admin role check here
      const { page = 1, limit = 50, status, category } = req.query;

      const supportRequests = await storage.getSupportRequests({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        category: category as string
      });

      res.json({
        success: true,
        requests: supportRequests.map(request => ({
          id: request.id,
          name: request.name,
          email: request.email,
          category: request.category,
          message: request.message,
          status: request.status,
          priority: request.priority,
          hasAttachment: request.hasAttachment,
          fileName: request.fileName,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          resolvedAt: request.resolvedAt,
          userId: request.userId,
          user: (request as any).user // If joined with user data
        }))
      });
    } catch (error) {
      console.error("Get support requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch support requests"
      });
    }
  });

  // Admin: Update support request status
  apiRouter.put("/admin/support/:requestId", authenticateToken, async (req: Request, res: Response) => {
    try {
      // TODO: Add admin role check here
      const requestId = parseInt(req.params.requestId);
      const { status, priority, response } = req.body;
      const adminId = req.user!.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required"
        });
      }

      const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status"
        });
      }

      await storage.updateSupportRequest(requestId, {
        status,
        priority,
        response,
        resolvedAt: status === 'resolved' ? new Date() : null
      });

      res.json({
        success: true,
        message: "Support request updated successfully"
      });
    } catch (error) {
      console.error("Update support request error:", error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to update support request"
        });
      }
    }
  });

  // Admin: Get support request by ID
  apiRouter.get("/admin/support/:requestId", authenticateToken, async (req: Request, res: Response) => {
    try {
      // TODO: Add admin role check here
      const requestId = parseInt(req.params.requestId);

      const supportRequest = await storage.getSupportRequestById(requestId);

      if (!supportRequest) {
        return res.status(404).json({
          success: false,
          message: "Support request not found"
        });
      }

      res.json({
        success: true,
        request: {
          id: supportRequest.id,
          name: supportRequest.name,
          email: supportRequest.email,
          category: supportRequest.category,
          message: supportRequest.message,
          status: supportRequest.status,
          priority: supportRequest.priority,
          hasAttachment: supportRequest.hasAttachment,
          fileName: supportRequest.fileName,
          response: supportRequest.response,
          createdAt: supportRequest.createdAt,
          updatedAt: supportRequest.updatedAt,
          resolvedAt: supportRequest.resolvedAt,
          userId: supportRequest.userId,
          user: (supportRequest as any).user
        }
      });
    } catch (error) {
      console.error("Get support request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch support request"
      });
    }
  });

  // Mark lesson as complete
  apiRouter.post("/lessons/:id/complete", authenticateToken, async (req: Request, res: Response) => {
    try {
      const lessonId = req.params.id;
      const userId = req.user!.id;

      console.log(`Completing lesson: ${lessonId} for user ${userId}`);

      const result = await storage.markLessonComplete(userId, lessonId);

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

  // Temporary fix for investment-basics completion issue
  apiRouter.post("/debug/fix-investment-basics", async (req: Request, res: Response) => {
    try {
      const userId = 26; // f5l5's user ID
      const moduleId = 3; // investment-basics

      // Check current state
      const existingProgress = await db.execute(sql`
        SELECT * FROM user_progress 
        WHERE user_id = ${userId} AND module_id = ${moduleId}
        LIMIT 1
      `);

      const existingRows = existingProgress.rows || existingProgress || [];

      if (existingRows.length > 0 && existingRows[0].completed) {
        return res.json({
          success: true,
          message: "Investment basics already marked as completed",
          existing: existingRows[0]
        });
      }

      // Insert the completion record
      if (existingRows.length > 0) {
        await db.execute(sql`
          UPDATE user_progress 
          SET completed = true, points_earned = 20, completed_at = NOW()
          WHERE user_id = ${userId} AND module_id = ${moduleId}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
          VALUES (${userId}, ${moduleId}, true, 20, NOW(), NOW())
        `);
      }

      res.json({
        success: true,
        message: "Fixed investment-basics completion for user 26"
      });
    } catch (error: any) {
      console.error('Fix investment-basics error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fix investment-basics completion",
        error: error.message
      });
    }
  });

  // Debug endpoint to check user's lesson completion status
  apiRouter.get("/debug/user/:userId/lessons", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      // Get user progress from database
      const progress = await storage.getUserProgress(userId);

      // Get points history for lessons
      const pointsHistory = await storage.getUserPointsHistory(userId);
      const lessonCompletions = pointsHistory.filter(h => h.action === 'lesson_complete');
      // Create lesson mapping for debugging
      const lessonIdMap: { [key: number]: string } = {
        1: 'budgeting-basics',
        2: 'emergency-fund',
        3: 'investment-basics',
        4: 'credit-management',
        5: 'retirement-planning',
        6: 'tax-optimization',
        7: 'credit-basics',
        8: 'understanding-credit-scores',
        9: 'debt-snowball-vs-avalanche',
        10: 'smart-expense-cutting',
        11: 'zero-based-budgeting',
        12: 'envelope-budgeting',
        13: 'high-yield-savings',
        14: 'cd-laddering',
        15: 'sinking-funds',
        16: 'roth-vs-traditional-ira',
        17: 'index-fund-investing',
        18: 'asset-allocation',
        19: 'dollar-cost-averaging',
        20: 'options-trading-basics',
        21: 'smart-goal-setting',
        22: 'estate-planning-basics',
        23: 'insurance-essentials',
        24: 'managing-student-loans',
        25: 'charitable-giving-strategies',
        26: 'home-buying-process',
        27: 'retirement-income-planning',
        28: 'emergency-fund-detailed',
        29: 'budgeting-basics-detailed',
        30: 'investment-basics-detailed',
        31: 'credit-management-detailed',
        32: 'retirement-planning-detailed',
        33: 'tax-optimization-detailed',
        34: 'building-emergency-fund',
        35: 'debt-consolidation'
      };

      const mappedCompletions = progress
        .filter(p => p.completed)
        .map(p => ({
          moduleId: p.moduleId,
          lessonKey: lessonIdMap[p.moduleId] || `unknown-${p.moduleId}`,
          completedAt: p.completedAt,
          pointsEarned: p.pointsEarned
        }));

      res.json({
        success: true,
        userId,
        progressEntries: progress,
        lessonCompletions,
        mappedCompletions,
        totalLessonsCompleted: progress.filter(p => p.completed).length,
        lessonMapping: lessonIdMap,
        pointsHistoryCount: lessonCompletions.length
      });
    } catch (error: any) {
      console.error('Debug lesson check error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Fix specific lesson completion for user
  apiRouter.post("/admin/fix-lesson-completion", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId, lessonId } = req.body;

      if (!userId || !lessonId) {
        return res.status(400).json({
          success: false,
          message: "User ID and lesson ID are required"
        });
      }

      // Lesson ID mapping
      const lessonIdMap: { [key: string]: number } = {
        'budgeting-basics': 1,
        'emergency-fund': 2,
        'investment-basics': 3,
        'credit-management': 4,
        'retirement-planning': 5,
        'tax-optimization': 6,
        // ... (keeping the existing mapping)
      };

      const moduleId = lessonIdMap[lessonId];
      if (!moduleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson ID"
        });
      }

      // Check if completion already exists
      const existingProgress = await db.execute(sql`
        SELECT * FROM user_progress 
        WHERE user_id = ${userId} AND module_id = ${moduleId}
        LIMIT 1
      `);

      const existingRows = existingProgress.rows || existingProgress || [];

      if (existingRows.length > 0 && existingRows[0].completed) {
        return res.json({
          success: true,
          message: "Lesson already marked as completed"
        });
      }

      // Insert or update the completion record
      if (existingRows.length > 0) {
        await db.execute(sql`
          UPDATE user_progress 
          SET completed = true, points_earned = 20, completed_at = NOW()
          WHERE user_id = ${userId} AND module_id = ${moduleId}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
          VALUES (${userId}, ${moduleId}, true, 20, NOW(), NOW())
        `);
      }

      res.json({
        success: true,
        message: `Fixed lesson completion for ${lessonId}`
      });
    } catch (error: any) {
      console.error('Fix lesson completion error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fix lesson completion"
      });
    }
  });

  // Backfill lesson completions from points history
  apiRouter.post("/admin/backfill-lesson-progress", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      // Get all lesson completion points from user's history
      const pointsHistory = await storage.getUserPointsHistory(userId);
      const lessonCompletions = pointsHistory.filter(h => 
        h.action === 'lesson_complete' && 
        h.status === 'approved' &&
        h.metadata
      );

      console.log(`Found ${lessonCompletions.length} lesson completions in points history for user ${userId}`);

      // Lesson ID mapping for backfill
      const lessonIdMap: { [key: string]: number } = {
        'budgeting-basics': 1,
        'emergency-fund': 2,
        'investment-basics': 3,
        'credit-management': 4,
        'retirement-planning': 5,
        'tax-optimization': 6,
        'credit-basics': 7,
        'understanding-credit-scores': 8,
        'debt-snowball-vs-avalanche': 9,
        'smart-expense-cutting': 10,
        'zero-based-budgeting': 11,
        'envelope-budgeting': 12,
        'high-yield-savings': 13,
        'cd-laddering': 14,
        'sinking-funds': 15,
        'roth-vs-traditional-ira': 16,
        'index-fund-investing': 17,
        'asset-allocation': 18,
        'dollar-cost-averaging': 19,
        'options-trading-basics': 20,
        'smart-goal-setting': 21,
        'estate-planning-basics': 22,
        'insurance-essentials': 23,
        'managing-student-loans': 24,
        'charitable-giving-strategies': 25,
        'home-buying-process': 26,
        'retirement-income-planning': 27,
        'emergency-fund-detailed': 28,
        'budgeting-basics-detailed': 29,
        'investment-basics-detailed': 30,
        'credit-management-detailed': 31,
        'retirement-planning-detailed': 32,
        'tax-optimization-detailed': 33,
        'building-emergency-fund': 34,
        'debt-consolidation': 35,
        'credit-repair': 36,
        'mortgage-basics': 37,
        'side-hustle-income': 38,
        'financial-apps-tools': 39,
        'compound-interest': 40,
        'risk-management': 41,
        'tax-deductions': 42,
        'retirement-withdrawal': 43,
        'healthcare-costs': 44,
        'education-funding': 45,
        'financial-planning': 46,
        'investment-psychology': 47,
        'wealth-building': 48
      };

      let backfilledCount = 0;

      for (const completion of lessonCompletions) {
        try {
          const metadata = JSON.parse(completion.metadata || '{}');
          let moduleId = metadata.moduleId;
          let lessonId = metadata.lessonId;

          // If we have lessonId in metadata, use it to get moduleId
          if (lessonId && lessonIdMap[lessonId]) {
            moduleId = lessonIdMap[lessonId];
          }

          if (moduleId) {
            // Check if progress record already exists
            const existingProgress = await db.execute(sql`
              SELECT * FROM user_progress 
              WHERE user_id = ${userId} AND module_id = ${moduleId}
              LIMIT 1
            `);

            const existingRows = existingProgress.rows || existingProgress || [];

            if (existingRows.length === 0) {
              // Insert new progress record
              await db.execute(sql`
                INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
                VALUES (${userId}, ${moduleId}, true, ${completion.points}, ${completion.createdAt}, ${completion.createdAt})
                ON CONFLICT (user_id, module_id) DO UPDATE SET
                  completed = true,
                  points_earned = ${completion.points},
                  completed_at = ${completion.createdAt}
              `);
              backfilledCount++;
              console.log(`Backfilled lesson completion: user ${userId}, module ${moduleId}`);
            }
          }
        } catch (error) {
          console.error('Error backfilling lesson completion:', error);
        }
      }

      res.json({
        success: true,
        message: `Backfilled ${backfilledCount} lesson completions for user ${userId}`,
        backfilledCount
      });
    } catch (error: any) {
      console.error('Backfill error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to backfill lesson progress"
      });
    }
  });

  // Get all learning modules for admin
  apiRouter.get("/admin/modules", authenticateToken, async (req: Request, res: Response) => {
    try {
      const modules = await db.select().from(learningModules);

      // Get completion counts for each module
      const modulesWithStats = await Promise.all(modules.map(async (module) => {
        const completionCount = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM user_progress 
          WHERE module_id = ${module.id} AND completed = true
        `);

        return {
          ...module,
          completions: parseInt(completionCount.rows?.[0]?.count || 0),
          avgRating: 4.5 // Placeholder for now, would need ratings table
        };
      }));

      return res.status(200).json({
        success: true,
        modules: modulesWithStats
      });
    } catch (error) {
      console.error("Error fetching modules:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching modules"
      });
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

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Middleware to check admin role
  const requireAdmin = (req: Request, res: Response, next: any) => {
    // Assuming req.user is populated by authenticateToken middleware
    if (!req.user || req.user.email !== 'admin@example.com') { // replace admin email
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };

  // Admin analytics endpoint
  app.get("/api/admin/analytics", requireAuth, requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAdminAnalytics('30d');
      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ success: false, message: "Failed to load analytics" });
    }
  });

  // Preview rewards winners with random selection
  app.post("/api/admin/rewards/preview-winners", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { payoutConfig, rewardsConfig, winnerConfiguration } = req.body;

      // Get all eligible users by tier
      const allUsers = await storage.getAdminUsers({ page: 1, limit: 1000 });

      // Group users by tier
      const usersByTier = {
        tier1: allUsers.filter(u => u.tier === 'tier1' && u.currentMonthPoints > 0),
        tier2: allUsers.filter(u => u.tier === 'tier2' && u.currentMonthPoints > 0),
        tier3: allUsers.filter(u => u.tier === 'tier3' && u.currentMonthPoints > 0)
      };

      // Calculate reward amounts per tier
      const totalPool = allUsers.length * 20 * (rewardsConfig.poolPercentage / 100);
      const tierPools = {
        tier1: totalPool * (rewardsConfig.tierAllocations.tier1 / 100) * (payoutConfig.tier1PayoutPercentage / 100),
        tier2: totalPool * (rewardsConfig.tierAllocations.tier2 / 100) * (payoutConfig.tier2PayoutPercentage / 100),
        tier3: totalPool * (rewardsConfig.tierAllocations.tier3 / 100) * (payoutConfig.tier3PayoutPercentage / 100)
      };

      // Calculate winner counts per tier
      const winnerCounts = {
        tier1: Math.round((usersByTier.tier1.length * rewardsConfig.winnerPercentages.tier1) / 100),
        tier2: Math.round((usersByTier.tier2.length * rewardsConfig.winnerPercentages.tier2) / 100),
        tier3: Math.round((usersByTier.tier3.length * rewardsConfig.winnerPercentages.tier3) / 100)
      };

      // Random selection function with optional seed
      const seedRandom = (seed: string | undefined) => {
        if (!seed) return Math.random;
        let a = 1, b = 0, c = 0, d = 1;
        for (let i = 0; i < seed.length; i++) {
          const char = seed.charCodeAt(i);
          a = (a * char) % 2147483647;
          b = (b + char) % 2147483647;
        }
        return () => {
          const t = 2091639 * a + 2.3283064365386963e-10 * b;
          a = b; b = c; c = d; d = t - (t | 0);
          return d;
        };
      };

      const random = seedRandom(payoutConfig.randomSeed);

      const winners = [];

      // Select winners for each tier using weighted random selection
      (['tier1', 'tier2', 'tier3'] as const).forEach(tier => {
        const tierUsers = usersByTier[tier];
        const winnerCount = winnerCounts[tier];
        const tierPool = tierPools[tier];

        if (tierUsers.length === 0 || winnerCount === 0) return;

        // Create weighted array based on points
        const weightedUsers = tierUsers.flatMap(user => 
          Array(Math.max(1, Math.floor(user.currentMonthPoints / 10))).fill(user)
        );

        // Randomly select winners
        const selectedWinners = [];
        const availableUsers = [...weightedUsers];

        for (let i = 0; i < winnerCount && availableUsers.length > 0; i++) {
          const randomIndex = Math.floor(random() * availableUsers.length);
          const selectedUser = availableUsers[randomIndex];

          // Remove all instances of this user from available pool
          const userInstances = availableUsers.filter(u => u.id === selectedUser.id);
          userInstances.forEach(() => {
            const index = availableUsers.findIndex(u => u.id === selectedUser.id);
            if (index > -1) availableUsers.splice(index, 1);
          });

          // Only add if not already selected
          if (!selectedWinners.find(w => w.id === selectedUser.id)) {
            selectedWinners.push(selectedUser);
          }
        }

        // Use configured winner percentages or fall back to equal distribution
        const tierConfig = winnerConfiguration?.[tier] || [];
        
        selectedWinners.forEach((user, index) => {
          const position = index + 1;
          
          // Find configured percentage for this position
          const configEntry = tierConfig.find(config => config.position === position);
          const positionPercentage = configEntry ? configEntry.percentage : (100 / selectedWinners.length);

          const rewardAmount = Math.floor((tierPool * 100 * positionPercentage) / 100); // Convert to cents

          winners.push({
            userId: user.id,
            username: user.username,
            tier,
            points: user.currentMonthPoints,
            position: position,
            positionLabel: position === 1 ? '1st Place' : position === 2 ? '2nd Place' : position === 3 ? '3rd Place' : `${position}th Place`,
            rewardAmount: rewardAmount,
            positionPercentage: positionPercentage
          });
        });
      });

      res.json({ success: true, winners });
    } catch (error) {
      console.error('Preview winners error:', error);
      res.status(500).json({ success: false, message: "Failed to preview winners" });
    }
  });

  // Execute monthly rewards distribution
  app.post("/api/admin/rewards/execute-distribution", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { payoutConfig, rewardsConfig, winners } = req.body;

      // Create monthly reward record
      const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const totalRewardPool = winners.reduce((sum: number, w: any) => sum + w.rewardAmount, 0);

      const monthlyReward = await storage.createMonthlyReward(
        month,
        totalRewardPool,
        {
          goldRewardPercentage: rewardsConfig.tierAllocations.tier3,
          silverRewardPercentage: rewardsConfig.tierAllocations.tier2,
          bronzeRewardPercentage: rewardsConfig.tierAllocations.tier1,
          pointDeductionPercentage: 75 // Standard deduction
        }
      );

      // Process each winner
      for (const winner of winners) {
        // Award the monetary reward and deduct points
        const user = await storage.getUserById(winner.userId);
        if (!user) continue;

        // Calculate point deduction (75% of their monthly points)
        const pointsDeducted = Math.floor(user.currentMonthPoints * 0.75);
        const pointsRolledOver = user.currentMonthPoints - pointsDeducted;

        // Create user monthly reward record
        await storage.createUserMonthlyReward({
          userId: winner.userId,
          monthlyRewardId: monthlyReward.id,
          tier: winner.tier,
          pointsAtDistribution: user.currentMonthPoints,
          rewardAmount: winner.rewardAmount,
          pointsDeducted,
          pointsRolledOver,
          isWinner: true
        });

        // Update user points
        await storage.updateUserPoints(
          winner.userId,
          user.totalPoints,
          pointsRolledOver
        );

        // Record point deduction in history
        await storage.awardPoints(
          winner.userId,
          'monthly_reward_deduction',
          -pointsDeducted,
          `Monthly reward distribution - 75% point deduction ($${(winner.rewardAmount / 100).toFixed(2)} reward)`,
          { monthlyRewardId: monthlyReward.id, rewardAmount: winner.rewardAmount, tier: winner.tier }
        );

        // TODO: Initiate Stripe payout to user's connected account
        // This would integrate with Stripe Connect for actual payouts
      }

      // Process non-winners (point rollover without deduction)
      const allUsers = await storage.getAdminUsers({ page: 1, limit: 1000 });
      const winnerIds = winners.map((w: any) => w.userId);
      const nonWinners = allUsers.filter(u => !winnerIds.includes(u.id) && u.currentMonthPoints > 0);

      for (const user of nonWinners) {
        // Create user monthly reward record for non-winners
        await storage.createUserMonthlyReward({
          userId: user.id,
          monthlyRewardId: monthlyReward.id,
          tier: user.tier,
          pointsAtDistribution: user.currentMonthPoints,
          rewardAmount: 0,
          pointsDeducted: 0,
          pointsRolledOver: user.currentMonthPoints,
          isWinner: false
        });

        // Record rollover in history
        await storage.awardPoints(
          user.id,
          'monthly_rollover',
          0,
          `Monthly rollover - ${user.currentMonthPoints} points carried forward`,
          { monthlyRewardId: monthlyReward.id, rolledOverPoints: user.currentMonthPoints, tier: user.tier }
        );
      }

      // Mark reward as distributed
      await storage.markMonthlyRewardDistributed(monthlyReward.id);

      res.json({ 
        success: true, 
        totalWinners: winners.length,
        totalPayout: totalRewardPool,
        monthlyRewardId: monthlyReward.id
      });
    } catch (error) {
      console.error('Execute distribution error:', error);
      res.status(500).json({ success: false, message: "Failed to execute distribution" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}