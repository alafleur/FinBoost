import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { findBestContent, fallbackContent } from "./contentDatabase";

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
          firstName: user.firstName,
          lastName: user.lastName,
          totalPoints: user.totalPoints || 0,
          currentMonthPoints: user.currentMonthPoints || 0,
          tier: user.tier,
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0,
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
      
      const module = await storage.toggleModulePublish(moduleId, isPublished);
      res.json({ success: true, module });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

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