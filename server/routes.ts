import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { findBestContent, fallbackContent } from "./contentDatabase";
import Stripe from "stripe";

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-30.basil",
  });
}

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

  // Stripe subscription routes
  app.post('/api/create-subscription', async (req, res) => {
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

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId && user.subscriptionStatus === 'active') {
        return res.json({ 
          success: true, 
          message: "User already has active subscription",
          subscriptionId: user.stripeSubscriptionId 
        });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      });

      const latestInvoice = subscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret;

      res.json({
        success: true,
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}