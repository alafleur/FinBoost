import { users, type User, type InsertUser, subscribers, type Subscriber, type InsertSubscriber, userPointsHistory, learningModules, userProgress, monthlyRewards, userMonthlyRewards, referrals, userReferralCodes, supportRequests, type SupportRequest, passwordResetTokens, type PasswordResetToken, adminPointsActions, monthlyPoolSettings } from "@shared/schema";
import type { UserPointsHistory, MonthlyReward, UserMonthlyReward, Referral, UserReferralCode } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq, sql, desc, and, lt, gte, ne, lte, between } from "drizzle-orm";
import { db } from "./db";
import crypto from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Subscriber methods
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  getAllSubscribers(): Promise<Subscriber[]>;
  getSubscribersCount(): Promise<number>;
  getUserCount(): Promise<number>;
  getDistributionSettings(): Promise<{[key: string]: string}>;

    // Module Publication Methods
    toggleModulePublish(moduleId: number, isPublished: boolean): Promise<any>;
    getPublishedModules(): Promise<any[]>;

    // User Authentication Methods
    getUserByEmail(email: string): Promise<User | null>;
    getUserById(id: number): Promise<User | null>;
    validateUser(email: string, password: string): Promise<User | null>;
    updateUserPoints(userId: number, totalPoints: number, currentMonthPoints: number): Promise<void>;
    getUserPointsHistory(userId: number): Promise<UserPointsHistory[]>;
    updateLastLogin(userId: number): Promise<void>;
    updateUserLastLogin(userId: number): Promise<void>;
    updateUserProfile(userId: number, profileData: Partial<{firstName: string, lastName: string, bio: string, location: string, occupation: string, financialGoals: string}>): Promise<void>;
    generateToken(userId: number): Promise<string>;
    getUserByToken(token: string): Promise<User | null>;
    validateToken(token: string): Promise<User | null>;

    // Enhanced Points System Methods
    awardPoints(userId: number, actionId: string, points: number, description: string, metadata?: any): Promise<UserPointsHistory>;
    awardPointsWithProof(userId: number, actionId: string, points: number, description: string, proofUrl: string, metadata?: any): Promise<UserPointsHistory>;
    checkDailyActionLimit(userId: number, actionId: string): Promise<boolean>;
    checkTotalActionLimit(userId: number, actionId: string): Promise<boolean>;
    getPendingProofUploads(): Promise<UserPointsHistory[]>;
    approveProofUpload(historyId: number, reviewerId: number): Promise<void>;
    rejectProofUpload(historyId: number, reviewerId: number, reason: string): Promise<void>;
    calculateUserTier(currentMonthPoints: number): Promise<string>;

    //Leaderboard Methods
    getLeaderboard(period: 'monthly' | 'allTime', limit: number): Promise<Array<{rank: number, userId: number, username: string, points: number, tier: string}>>;
    getUserRank(userId: number, period: 'monthly' | 'allTime'): Promise<{rank: number, points: number, tier: string} | null>;
    getExpandedLeaderboard(timeFilter: string, page: number, search: string): Promise<Array<{rank: string, username: string, points: string, tier: string, streak: number, modulesCompleted: number, joinDate: string}>>;
    getUserLeaderboardStats(userId: number, timeFilter: string): Promise<{username: string, rank: number, points: number, tier: string, streak: number, modulesCompleted: number, pointsToNextTier: number, pointsToTopPosition?: number}>;

    // Monthly Rewards Methods
    createMonthlyReward(month: string, totalRewardPool: number, config?: Partial<{goldRewardPercentage: number, silverRewardPercentage: number, bronzeRewardPercentage: number, pointDeductionPercentage: number}>): Promise<MonthlyReward>;
    distributeMonthlyRewards(monthlyRewardId: number): Promise<void>;
    getUserMonthlyRewardsHistory(userId: number): Promise<UserMonthlyReward[]>;
    getMonthlyRewardsSummary(): Promise<MonthlyReward[]>;
    rolloverUserPoints(userId: number, fromMonth: string): Promise<void>;

    // Referral System Methods
    createUserReferralCode(userId: number): Promise<UserReferralCode>;
    getUserReferralCode(userId: number): Promise<UserReferralCode | null>;
    validateReferralCode(referralCode: string): Promise<{isValid: boolean, referrerUserId?: number}>;
    processReferralSignup(referredUserId: number, referralCode: string): Promise<void>;
    getUserReferrals(userId: number): Promise<Array<{referral: Referral, referredUser: {username: string, email: string, joinedAt: Date}}>>;
    getReferralStats(userId: number): Promise<{totalReferrals: number, completedReferrals: number, pendingReferrals: number, totalPointsEarned: number}>;
    updateReferralStatus(referralId: number, status: 'completed' | 'expired'): Promise<void>;
    getAdminReferralStats(): Promise<{totalReferrals: number, totalReferrers: number, topReferrers: Array<{username: string, referralCount: number, pointsEarned: number}>}>;

    // Enhanced Admin Methods
    getAdminUsers(filters: {page: number, limit: number, search?: string, status?: string, tier?: string}): Promise<User[]>;
    bulkUpdateUsers(userIds: number[], updates: Partial<User>): Promise<void>;
    bulkResetPasswords(userIds: number[]): Promise<void>;
    exportUserData(userIds: number[]): Promise<any>;
    getAdminAnalytics(period: string): Promise<any>;
    getSystemSettings(): Promise<any>;
    updateSystemSettings(settings: any): Promise<void>;
    getUserDetailsForAdmin(userId: number): Promise<any>;
    exportUsers(format: string): Promise<string>;
    exportPointsHistory(format: string): Promise<string>;
    exportAnalytics(format: string): Promise<string>;

    // Streak Methods
    updateUserStreak(userId: number): Promise<{ newStreak: number; bonusPoints: number }>;

    // Lesson Completion
    markLessonComplete(userId: number, lessonId: string): Promise<{ pointsEarned: number; streakBonus: number; newStreak }>;

    // === PASSWORD RESET METHODS ===

    createPasswordResetToken(userId: number): Promise<string>;
    validatePasswordResetToken(token: string): Promise<{isValid: boolean, userId?: number}>;
    resetUserPassword(token: string, newPassword: string): Promise<boolean>;
    cleanupExpiredTokens(): Promise<void>;

    // === SUPPORT REQUEST METHODS ===

    createSupportRequest(data: {
      userId?: number | null;
      name: string;
      email: string;
      category: string;
      message: string;
      hasAttachment?: boolean;
      fileName?: string | null;
    }): Promise<SupportRequest>;
    getSupportRequests(options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
    }): Promise<SupportRequest[]>;
    getSupportRequestById(requestId: number): Promise<SupportRequest | null>;
    updateSupportRequest(requestId: number, updates: {
      status?: string;
      priority?: string;
      response?: string;
      resolvedAt?: Date | null;
    }): Promise<void>;
    getSupportRequestStats(): Promise<{
      total: number;
      pending: number;
      inProgress: number;
      resolved: number;
      closed: number;
    }>;

    getTierThresholds(): Promise<{ tier1: number, tier2: number, tier3: number }>;

    // Admin CRUD operations
    createModule(moduleData: any): Promise<any>;
    updateModule(moduleId: number, moduleData: any): Promise<any>;
    deleteModule(moduleId: number): Promise<void>;
    getAllModules(): Promise<any[]>;
    getModuleById(moduleId: number): Promise<any | null>;

    updateUser(userId: number, userData: any): Promise<User>;
    deleteUser(userId: number): Promise<void>;
    
    // Stripe payment methods
    addToRewardPool(amount: number): Promise<void>;
    
    // Monthly pool settings methods
    createMonthlyPoolSetting(setting: any): Promise<any>;
    getActiveMonthlyPoolSetting(): Promise<any>;
    getCurrentPoolSettingsForDate(date: Date): Promise<{ rewardPoolPercentage: number; membershipFee: number } | null>;
    updateMonthlyPoolSetting(id: number, updates: any): Promise<any>;
    getAllMonthlyPoolSettings(): Promise<any[]>;

    awardPoints(userId: number, points: number, action: string, reason: string): Promise<void>;
    deductPoints(userId: number, points: number, action: string, reason: string): Promise<void>;

    updateRewardsConfig(config: any): Promise<void>;
    executeMonthlyDistribution(month: string): Promise<any>;

    getAllSupportTickets(): Promise<any[]>;
    updateSupportTicket(ticketId: number, ticketData: any): Promise<any>;

    getPointActions(): Promise<any[]>;
    createOrUpdatePointAction(actionData: {
      actionId: string;
      name: string;
      basePoints: number;
      maxDaily?: number;
      maxMonthly?: number;
      maxTotal?: number;
      requiresProof: boolean;
      category: string;
      description: string;
    }, adminUserId: number): Promise<any>;
    deletePointAction(actionId: string): Promise<void>;
}

import fs from 'fs/promises';
import path from 'path';
import { POINTS_CONFIG } from "@shared/pointsConfig";

const STORAGE_FILE = 'subscribers.json';

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscribers: Map<number, Subscriber>;
  private pointsHistory: Map<number, UserPointsHistory[]>;
  private pointsHistoryCounter: number;
  currentUserId: number;
  currentSubscriberId: number;
  db: any;
  private tierThresholdCache: { tier1: number, tier2: number, tier3: number } | null = null;
  private tierThresholdCacheTime: number | null = null;
  private tokens = new Map<string, { userId: number; createdAt: Date }>();

  constructor() {
    this.users = new Map();
    this.subscribers = new Map();
    this.pointsHistory = new Map();
    this.pointsHistoryCounter = 1;
    this.currentUserId = 1;
    this.currentSubscriberId = 1;
    this.loadFromFile();
  }

  private async loadFromFile() {
    try {
      const data = await fs.readFile(STORAGE_FILE, 'utf-8');
      const json = JSON.parse(data);
      this.subscribers = new Map(Object.entries(json.subscribers));
      this.currentSubscriberId = json.currentSubscriberId;
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.saveToFile();
    }
  }

  private async saveToFile() {
    const data = {
      subscribers: Object.fromEntries(this.subscribers),
      currentSubscriberId: this.currentSubscriberId
    };
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserStreak(userId: number): Promise<{ newStreak: number; bonusPoints: number }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const lastActivityDate = user.lastActivityDate;

    let newStreak = 1;
    let bonusPoints = 0;

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = user.currentStreak + 1;
      } else if (diffDays === 0) {
        // Same day - don't update streak but still give bonus for existing streak
        newStreak = user.currentStreak;
      } else {
        // Missed days - reset streak
        newStreak = 1;
      }
    }

    // Calculate bonus points
    bonusPoints = this.calculateStreakBonus(newStreak);

    // Update user record
    const longestStreak = Math.max(user.longestStreak, newStreak);

    await db.update(users)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
        totalPoints: user.totalPoints + bonusPoints,
        currentMonthPoints: user.currentMonthPoints + bonusPoints,
      })
      .where(eq(users.id, userId));

    return { newStreak, bonusPoints };
  }

  private calculateStreakBonus(streakDays: number): number {
    if (streakDays < 2) return 0;
    if (streakDays >= 2 && streakDays <= 4) return 5;
    if (streakDays >= 5 && streakDays <= 6) return 10;
    return 15; // 7+ days
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();

    // Store in memory storage
    this.users.set(user.id, user);

    // Skip all referral processing to fix registration

    // Invalidate tier threshold cache when new users are added
    this.tierThresholdCache = null;

    return user;
  }

  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const id = this.currentSubscriberId++;
    const now = new Date();
    const subscriber: Subscriber = { 
      ...insertSubscriber, 
      id, 
      createdAt: now.toISOString() 
    };
    this.subscribers.set(id, subscriber);
    await this.saveToFile();
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    return Array.from(this.subscribers.values()).find(
      (subscriber) => subscriber.email === email
    );
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values());
  }

  async getSubscribersCount(): Promise<number> {
    return this.subscribers.size;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  // User Authentication Methods
  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: number): Promise<User | null> {
    const user = this.users.get(id);
    return user || null;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    // Check database first
    const [dbUser] = await db.select().from(users).where(eq(users.email, email));
    if (!dbUser) return null;

    const isValid = await bcrypt.compare(password, dbUser.password);
    if (isValid) {
      // Store in memory and return
      this.users.set(dbUser.id, dbUser);
      return dbUser;
    }
    return null;
  }

  async updateUserPoints(userId: number, totalPoints: number, currentMonthPoints: number): Promise<void> {
    const tier = await this.calculateUserTier(currentMonthPoints);

    await db.update(users)
      .set({ 
        totalPoints, 
        currentMonthPoints, 
        tier,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserPointsHistory(userId: number): Promise<UserPointsHistory[]> {
    const history = this.pointsHistory.get(userId) || [];
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: number, profileData: Partial<{firstName: string, lastName: string, bio: string, location: string, occupation: string, financialGoals: string}>): Promise<void> {
    await db.update(users)
      .set(profileData)
      .where(eq(users.id, userId));
  }

  // Enhanced Points System Implementation
  async awardPoints(userId: number, actionId: string, points: number, description: string, metadata?: any): Promise<UserPointsHistory> {
    // Check action limits
    const actionConfig = POINTS_CONFIG[actionId];
    if (actionConfig) {
      if (actionConfig.maxDaily && !(await this.checkDailyActionLimit(userId, actionId))) {
        throw new Error(`Daily limit reached for action: ${actionId}`);
      }
      if (actionConfig.maxTotal && !(await this.checkTotalActionLimit(userId, actionId))) {
        throw new Error(`Total limit reached for action: ${actionId}`);
      }
    }

    // Create points history entry
    const historyEntry: UserPointsHistory = {
      id: this.pointsHistoryCounter++,
      userId,
      points,
      action: actionId,
      description,
      status: 'approved',
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      relatedId: null,
      proofUrl: null
    };

    // Add to points history
    if (!this.pointsHistory.has(userId)) {
      this.pointsHistory.set(userId, []);
    }
    this.pointsHistory.get(userId)!.push(historyEntry);

    // Update user points in memory
    const user = this.users.get(userId);
    console.log("=== DEBUG POINTS: Updating user", userId, "found user:", !!user);
    if (user) {
      const oldPoints = user.totalPoints || 0;
      const newTotalPoints = oldPoints + points;
      const newCurrentMonthPoints = (user.currentMonthPoints || 0) + points;
      const newTier = await this.calculateUserTier(newCurrentMonthPoints);

      user.totalPoints = newTotalPoints;
      user.currentMonthPoints = newCurrentMonthPoints;
      user.tier = newTier;

      console.log("=== DEBUG POINTS: Updated user points from", oldPoints, "to", newTotalPoints);

      // Update database
      await db.update(users)
        .set({
          totalPoints: newTotalPoints,
          currentMonthPoints: newCurrentMonthPoints,
          tier: newTier
        })
        .where(eq(users.id, userId));

      // Invalidate tier threshold cache to force recalculation on next request
      this.tierThresholdCache = null;

      // Save to file
      await this.saveToFile();
    } else {
      console.log("=== DEBUG POINTS: User not found in memory storage for ID:", userId);
    }

    return historyEntry;
  }

  async awardPointsWithProof(
    userId: number, 
    actionId: string, 
    points: number, 
    description: string, 
    proofUrl: string,
    metadata?: any
  ): Promise<UserPointsHistory> {
    // Check monthly limits
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const startOfMonth = new Date(currentMonth + '-01T00:00:00.000Z');

    // Get action configuration
    const actionConfig = await db.select()
      .from(adminPointsActions)
      .where(eq(adminPointsActions.actionId, actionId))
      .limit(1);

    if (actionConfig.length > 0 && actionConfig[0].maxMonthly) {
      // Check how many times this action has been done this month
      const monthlyCount = await db.select({ count: sql<number>`count(*)` })
        .from(userPointsHistory)
        .where(
          and(
            eq(userPointsHistory.userId, userId),
            eq(userPointsHistory.action, actionId),
            gte(userPointsHistory.createdAt, startOfMonth),
            ne(userPointsHistory.status, 'rejected')
          )
        );

      if (monthlyCount[0].count >= actionConfig[0].maxMonthly) {
        throw new Error(`Monthly limit reached for ${actionConfig[0].name}. Limit: ${actionConfig[0].maxMonthly} per month.`);
      }
    }

    const entry = await db.insert(userPointsHistory)
      .values({
        userId,
        points,
        action: actionId,
        description,
        proofUrl,
        status: 'pending', // Requires admin approval
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    return entry[0];
  }

  async checkDailyActionLimit(userId: number, actionId: string): Promise<boolean> {
    const actionConfig = POINTS_CONFIG[actionId];
    if (!actionConfig?.maxDaily) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userHistory = this.pointsHistory.get(userId) || [];
    const todayCount = userHistory.filter(entry => 
      entry.action === actionId && 
      entry.createdAt >= today &&
      entry.status === 'approved'
    ).length;

    return todayCount < actionConfig.maxDaily;
  }

  async checkTotalActionLimit(userId: number, actionId: string): Promise<boolean> {
    const actionConfig = POINTS_CONFIG[actionId];
    if (!actionConfig?.maxTotal) return true;

    const userHistory = this.pointsHistory.get(userId) || [];
    const totalCount = userHistory.filter(entry => 
      entry.action === actionId && 
      entry.status === 'approved'
    ).length;

    return totalCount < actionConfig.maxTotal;
  }

  async getPendingProofUploads(): Promise<UserPointsHistory[]> {
    const result = await db.select({
      id: userPointsHistory.id,
      userId: userPointsHistory.userId,
      action: userPointsHistory.action,
      points: userPointsHistory.points,
      description: userPointsHistory.description,
      proofUrl: userPointsHistory.proofUrl,
      status: userPointsHistory.status,
      createdAt: userPointsHistory.createdAt,
      reviewedAt: userPointsHistory.reviewedAt,
      reviewedBy: userPointsHistory.reviewedBy,
      metadata: userPointsHistory.metadata,
      username: users.username,
      email: users.email
    })
      .from(userPointsHistory)
      .leftJoin(users, eq(userPointsHistory.userId, users.id))
      .where(eq(userPointsHistory.status, 'pending'))
      .orderBy(desc(userPointsHistory.createdAt));

    return result.map(row => ({
      ...row,
      user: {
        username: row.username,
        email: row.email
      }
    })) as any;
  }

  async approveProofUpload(historyId: number, reviewerId: number): Promise<void> {
    const historyEntry = await db.select()
      .from(userPointsHistory)
      .where(eq(userPointsHistory.id, historyId))
      .limit(1);

    if (!historyEntry[0]) {
      throw new Error('Points history entry not found');
    }

    const entry = historyEntry[0];

    // Update history entry
    await db.update(userPointsHistory)
      .set({
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(userPointsHistory.id, historyId));

    // Award points to user
    const user = await this.getUserById(entry.userId);
    if (user) {
      const newTotalPoints = (user.totalPoints || 0) + entry.points;
      const newCurrentMonthPoints = (user.currentMonthPoints || 0) + entry.points;
      const newTier = await this.calculateUserTier(newCurrentMonthPoints);

      await db.update(users)
        .set({ 
          totalPoints: newTotalPoints, 
          currentMonthPoints: newCurrentMonthPoints,
          tier: newTier
        })
        .where(eq(users.id, entry.userId));

      // Invalidate tier threshold cache to force recalculation on next request
      this.tierThresholdCache = null;
    }
  }

  async rejectProofUpload(historyId: number, reviewerId: number, reason: string): Promise<void> {
    await db.update(userPointsHistory)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        description: `${await db.select({ description: userPointsHistory.description })
          .from(userPointsHistory)
          .where(eq(userPointsHistory.id, historyId))
          .then(r => r[0]?.description || '')} - REJECTED: ${reason}`,
      })
      .where(eq(userPointsHistory.id, historyId));
  }

  async calculateUserTier(currentMonthPoints: number): Promise<string> {
    const thresholds = await this.getTierThresholds();

    if (currentMonthPoints >= thresholds.tier1) {
      return 'tier1';
    } else if (currentMonthPoints >= thresholds.tier2) {
      return 'tier2';
    } else {
      return 'tier3';
    }
  }

  async recalculateAllUserTiers(): Promise<void> {
    console.log("Starting tier recalculation for all users...");

    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.isActive, true));

    console.log(`Recalculating tiers for ${allUsers.length} users`);

    // Update each user's tier based on their current points
    for (const user of allUsers) {
      const newTier = await this.calculateUserTier(user.currentMonthPoints || 0);

      if (user.tier !== newTier) {
        console.log(`Updating user ${user.id} (${user.username}) from ${user.tier} to ${newTier} (${user.currentMonthPoints} points)`);

        await db.update(users)
          .set({ 
            tier: newTier,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));

        // Update memory cache
        this.users.set(user.id, { ...user, tier: newTier });
      }
    }

    console.log("Tier recalculation completed");
  }

  async getLeaderboard(period: 'monthly' | 'allTime', limit: number): Promise<Array<{rank: number, userId: number, username: string, points: number, tier: string}>> {
    try {
      const pointsColumn = period === 'monthly' ? 'currentMonthPoints' : 'totalPoints';

      const query = await db.select({
        rank: sql<number>`RANK() OVER (ORDER BY ${pointsColumn} DESC)`.as('rank'),
        userId: users.id,
        username: users.username,
        points: users[pointsColumn],
        tier: users.tier
      }).from(users)
      .where(eq(users.isActive, true))
      .orderBy(desc(users[pointsColumn]))
      .limit(limit);

      return query as Array<{rank: number, userId: number, username: string, points: number, tier: string}>;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
  }

  async getUserRank(userId: number, period: 'monthly' | 'allTime'): Promise<{rank: number, points: number, tier: string} | null> {
    try {
      const pointsColumn = period === 'monthly' ? 'currentMonthPoints' : 'totalPoints';

      const subquery = db.select({
        id: users.id,
        rank: sql<number>`RANK() OVER (ORDER BY ${pointsColumn} DESC)`.as('rank'),
        points: users[pointsColumn],
        tier: users.tier
      }).from(users)
      .where(eq(users.isActive, true))
      .as('ranked_users');

      const query = await db.select({
        rank: subquery.rank,
        points: subquery.points,
        tier: subquery.tier
      }).from(subquery)
      .where(eq(subquery.id, userId));

      const result = query[0] as {rank: number, points: number, tier: string} | null;
      return result;
    } catch (error) {
      console.error("Error fetching user rank:", error);
      throw error;
    }
  }

  // Monthly Rewards Implementation
  async createMonthlyReward(
    month: string, 
    totalRewardPool: number, 
    config?: Partial<{goldRewardPercentage: number, silverRewardPercentage: number, bronzeRewardPercentage: number, pointDeductionPercentage: number}>
  ): Promise<MonthlyReward> {
    // Get tier counts for this month
    const tierCounts = await db.select({
      tier: users.tier,
      count: sql<number>`count(*)`
    }).from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.tier);

    const goldCount = tierCounts.find(t => t.tier === 'tier3')?.count || 0;
    const silverCount = tierCounts.find(t => t.tier === 'tier2')?.count || 0;
    const bronzeCount = tierCounts.find(t => t.tier === 'tier1')?.count || 0;

    const [monthlyReward] = await db.insert(monthlyRewards).values({
      month,
      totalRewardPool,
      totalParticipants: goldCount + silverCount + bronzeCount,
      goldTierParticipants: goldCount,
      silverTierParticipants: silverCount,
      bronzeTierParticipants: bronzeCount,
      goldRewardPercentage: config?.goldRewardPercentage || 50,
      silverRewardPercentage: config?.silverRewardPercentage || 30,
      bronzeRewardPercentage: config?.bronzeRewardPercentage || 20,
      pointDeductionPercentage: config?.pointDeductionPercentage || 75,
    }).returning();

    return monthlyReward;
  }

  async distributeMonthlyRewards(monthlyRewardId: number): Promise<void> {
    const monthlyReward = await db.select()
      .from(monthlyRewards)
      .where(eq(monthlyRewards.id, monthlyRewardId))
      .limit(1);

    if (!monthlyReward[0]) {
      throw new Error('Monthly reward not found');
    }

    const reward = monthlyReward[0];

    // Calculate reward amounts per tier
    const goldRewardPool = Math.floor(reward.totalRewardPool * reward.goldRewardPercentage / 100);
    const silverRewardPool = Math.floor(reward.totalRewardPool * reward.silverRewardPercentage / 100);
    const bronzeRewardPool = Math.floor(reward.totalRewardPool * reward.bronzeRewardPercentage / 100);

    const goldRewardPerPerson = reward.goldTierParticipants > 0 ? Math.floor(goldRewardPool / reward.goldTierParticipants) : 0;
    const silverRewardPerPerson = reward.silverTierParticipants > 0 ? Math.floor(silverRewardPool / reward.silverTierParticipants) : 0;
    const bronzeRewardPerPerson = reward.bronzeTierParticipants > 0 ? Math.floor(bronzeRewardPool / reward.bronzeTierParticipants) : 0;

    // Get all active users with their current points
    const activeUsers = await db.select()
      .from(users)
      .where(eq(users.isActive, true));

    // Process each user
    for (const user of activeUsers) {
      let rewardAmount = 0;
      let isWinner = false;

      // Determine reward based on tier
      switch (user.tier) {
        case 'tier3':
          rewardAmount = goldRewardPerPerson;
          isWinner = goldRewardPerPerson > 0;
          break;
        case 'tier2':
          rewardAmount = silverRewardPerPerson;
          isWinner = silverRewardPerPerson > 0;
          break;
        case 'tier1':
          rewardAmount = bronzeRewardPerPerson;
          isWinner = bronzeRewardPerPerson > 0;
          break;
      }

      // Calculate point deduction for winners
      const pointsDeducted = isWinner && rewardAmount > 0 
        ? Math.floor(user.currentMonthPoints * reward.pointDeductionPercentage / 100)
        : 0;

      const pointsRolledOver = user.currentMonthPoints - pointsDeducted;

      // Create user monthly reward record
      await db.insert(userMonthlyRewards).values({
        userId: user.id,
        monthlyRewardId: monthlyRewardId,
        tier: user.tier,
        pointsAtDistribution: user.currentMonthPoints,
        rewardAmount,
        pointsDeducted,
        pointsRolledOver,
        isWinner,
      });

      // Update user's points (reset monthly points, keep total)
      await db.update(users)
        .set({
          currentMonthPoints: pointsRolledOver,
          tier: await this.calculateUserTier(pointsRolledOver),
        })
        .where(eq(users.id, user.id));

      // Record points adjustment in history
      if (pointsDeducted > 0) {
        await db.insert(userPointsHistory).values({
          userId: user.id,
          points: -pointsDeducted,
          action: 'monthly_reward_deduction',
          description: `Monthly reward distribution - ${reward.pointDeductionPercentage}% point deduction ($${(rewardAmount / 100).toFixed(2)} reward)`,
          status: 'approved',
          metadata: JSON.stringify({
            monthlyRewardId,
            rewardAmount,
            tier: user.tier
          }),
        });
      }

      if (pointsRolledOver > 0) {
        await db.insert(userPointsHistory).values({
          userId: user.id,
          points: 0,
          action: 'monthly_rollover',
          description: `Monthly rollover - ${pointsRolledOver} points carried forward`,
          status: 'approved',
          metadata: JSON.stringify({
            monthlyRewardId,
            rolledOverPoints: pointsRolledOver,
            tier: user.tier
          }),
        });
      }
    }

    // Mark reward as distributed
    await db.update(monthlyRewards)
      .set({
        status: 'distributed',
        distributedAt: new Date(),
      })
      .where(eq(monthlyRewards.id, monthlyRewardId));
  }

  async getUserMonthlyRewardsHistory(userId: number): Promise<UserMonthlyReward[]> {
    return await db.select()
      .from(userMonthlyRewards)
      .where(eq(userMonthlyRewards.userId, userId))
      .orderBy(desc(userMonthlyRewards.createdAt));
  }

  async getMonthlyRewardsSummary(): Promise<MonthlyReward[]> {
    return await db.select()
      .from(monthlyRewards)
      .orderBy(desc(monthlyRewards.createdAt));
  }

  async rolloverUserPoints(userId: number, fromMonth: string): Promise<void> {
    // This method can be used for manual rollover adjustments if needed
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    await db.insert(userPointsHistory).values({
      userId,
      points: 0,
      action: 'manual_rollover',
      description: `Manual rollover from ${fromMonth}`,
      status: 'approved',
      metadata: JSON.stringify({ fromMonth, currentPoints: user.currentMonthPoints }),
    });
  }

  // Referral System Implementation
  async createUserReferralCode(userId: number): Promise<UserReferralCode> {
    // Temporarily disabled to fix registration
    const referralCode = `USER-${userId}-${Date.now()}`;
    return {
      id: userId,
      userId,
      referralCode,
      createdAt: new Date(),
      isActive: true,
      totalReferrals: 0,
      totalPointsEarned: 0
    };
  }

  async getUserReferralCode(userId: number): Promise<UserReferralCode | null> {
    const [referralCode] = await db.select()
      .from(userReferralCodes)
      .where(eq(userReferralCodes.userId, userId))
      .limit(1);

    return referralCode || null;
  }

  async validateReferralCode(referralCode: string): Promise<{isValid: boolean, referrerUserId?: number}> {
    const [code] = await db.select()
      .from(userReferralCodes)
      .where(eq(userReferralCodes.referralCode, referralCode) && eq(userReferralCodes.isActive, true))
      .limit(1);

    if (!code) {
      return { isValid: false };
    }

    return { isValid: true, referrerUserId: code.userId };
  }

  async processReferralSignup(referredUserId: number, referralCode: string): Promise<void> {
    const validation = await this.validateReferralCode(referralCode);

    if (!validation.isValid || !validation.referrerUserId) {
      throw new Error('Invalid referral code');
    }

    // Prevent self-referral
    if (validation.referrerUserId === referredUserId) {
      throw new Error('Cannot refer yourself');
    }

    // Create referral record
    const [referral] = await db.insert(referrals).values({
      referrerUserId: validation.referrerUserId,
      referredUserId,
      referralCode,
      status: 'pending',
    }).returning();

    // Award initial signup points to referrer
    const signupPoints = POINTS_CONFIG.referral_signup.points;

    await this.awardPoints(
      validation.referrerUserId,
      'referral_signup',
      signupPoints,
      `Referral signup: User joined with your code ${referralCode}`,
      { referralId: referral.id, referredUserId }
    );

    // Update referralcode stats
    await db.update(userReferralCodes)
      .set({
        totalReferrals: sql`total_referrals + 1`,
        totalPointsEarned: sql`total_points_earned + ${signupPoints}`,
      })
      .where(eq(userReferralCodes.referralCode, referralCode));

    // Mark referral as completed for signup
    await db.update(referrals)
      .set({
        status: 'completed',
        pointsAwarded: signupPoints,
        completedAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));
  }

  async getUserReferrals(userId: number): Promise<Array<{referral: Referral, referredUser: {username: string, email: string, joinedAt: Date}}>> {
    const referralsList = await db.select({
      // Referral fields
      id: referrals.id,
      referrerUserId: referrals.referrerUserId,
      referredUserId: referrals.referredUserId,
      referralCode: referrals.referralCode,
      status: referrals.status,
      pointsAwarded: referrals.pointsAwarded,
      completedAt: referrals.completedAt,
      createdAt: referrals.createdAt,
      // User fields
      username: users.username,
      email: users.email,
      joinedAt: users.joinedAt,
    })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredUserId, users.id))
      .where(eq(referrals.referrerUserId, userId))
      .orderBy(desc(referrals.createdAt));

    return referralsList.map(row => ({
      referral: {
        id: row.id,
        referrerUserId: row.referrerUserId,
        referredUserId: row.referredUserId,
        referralCode: row.referralCode,
        status: row.status,
        pointsAwarded: row.pointsAwarded,
        completedAt: row.completedAt,
        createdAt: row.createdAt,
      },
      referredUser: {
        username: row.username || 'Unknown',
        email: row.email || 'Unknown',
        joinedAt: row.joinedAt || new Date(),
      },
    })) as any;
  }

  async getReferralStats(userId: number): Promise<{totalReferrals: number, completedReferrals: number, pendingReferrals: number, totalPointsEarned: number}> {
    const referralCode = await this.getUserReferralCode(userId);

    if (!referralCode) {
      return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, totalPointsEarned: 0 };
    }

    const [stats] = await db.select({
      totalReferrals: sql<number>`count(*)`,
      completedReferrals: sql<number>`count(*) filter (where status = 'completed')`,
      pendingReferrals: sql<number>`count(*) filter (where status = 'pending')`,
      totalPointsEarned: sql<number>`coalesce(sum(points_awarded), 0)`,
    })
      .from(referrals)
      .where(eq(referrals.referrerUserId, userId));

    return {
      totalReferrals: stats?.totalReferrals || 0,
      completedReferrals: stats?.completedReferrals || 0,
      pendingReferrals: stats?.pendingReferrals || 0,
      totalPointsEarned: stats?.totalPointsEarned || 0,
    };
  }

  async updateReferralStatus(referralId: number, status: 'completed' | 'expired'): Promise<void> {
    await db.update(referrals)
      .set({
        status,
        completedAt: status === 'completed' ? new Date() : null,
      })
      .where(eq(referrals.id, referralId));
  }

  async getAdminReferralStats(): Promise<{totalReferrals: number, totalReferrers: number, topReferrers: Array<{username: string, referralCount: number, pointsEarned: number}>}> {
    // Total referrals and referrers
    const [totalStats] = await db.select({
      totalReferrals: sql<number>`count(*)`,
      totalReferrers: sql<number>`count(distinct referrer_user_id)`,
    })
      .from(referrals);

    // Top referrers
    const topReferrers = await db.select({
      username: users.username,
      referralCount: sql<number>`count(*)`,
      pointsEarned: sql<number>`coalesce(sum(points_awarded), 0)`,
    })
      .from(referrals)
      .leftJoin(users, eq(referrals.referrerUserId, users.id))
      .groupBy(referrals.referrerUserId, users.username)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      totalReferrals: totalStats?.totalReferrals || 0,
      totalReferrers: totalStats?.totalReferrers || 0,
      topReferrers: topReferrers.map(row => ({
        username: row.username || 'Unknown',
        referralCount: row.referralCount,
        pointsEarned: row.pointsEarned,
      })),
    };
  }

  async getAdminUsers(filters: {page: number, limit: number, search?: string, status?: string, tier?: string}): Promise<User[]> {
    const { page = 1, limit = 50, search, status, tier } = filters;
    const offset = (page - 1) * limit;

    let query = db.select().from(users);

    const conditions = [];
    if (search) {
      conditions.push(sql`(${users.username} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'})`);
    }
    if (status === 'active') {
      conditions.push(eq(users.isActive, true));
    } else if (status === 'inactive') {
      conditions.push(eq(users.isActive, false));
    }
    if (tier) {
      conditions.push(eq(users.tier, tier));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(users.joinedAt))
      .limit(limit)
      .offset(offset);
  }

  async getAdminAnalytics(period: string): Promise<any> {
    // Get basic analytics data
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeUsers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));

    const totalPointsAwarded = await db.select({ 
      total: sql<number>`coalesce(sum(points), 0)` 
    }).from(userPointsHistory).where(eq(userPointsHistory.status, 'approved'));

    return {
      userGrowth: [],
      pointsDistribution: [],
      recentActivity: [],
      activeUsers: activeUsers[0]?.count || 0,
      totalPointsAwarded: totalPointsAwarded[0]?.total || 0,
      avgSessionDuration: 0,
      errorRate: 0
    };
  }

  async getSystemSettings(): Promise<any> {
    // Try to get settings from database
    try {
      const settingsResult = await db.execute(sql`
        SELECT settings_data FROM system_settings WHERE id = 1
      `);

      if (settingsResult.rows && settingsResult.rows.length > 0) {
        const settings = JSON.parse(settingsResult.rows[0].settings_data);
        return {
          maintenanceMode: false,
          registrationEnabled: true,
          pointsMultiplier: 1.0,
          maxDailyPoints: 500,
          tierRequirements: {
            bronze: 0,
            silver: 500,
            gold: 2000
          },
          monthlySettings: {
            cycleStartDay: 1,
            cycleStartTime: "00:00",
            distributionDay: 5,
            distributionTime: "12:00",
            timezone: "UTC",
            distributionDelayDays: 3
          },
          ...settings
        };
      }
    } catch (error) {
      console.log('No system settings table or data found, using defaults');
    }

    return {
      maintenanceMode: false,
      registrationEnabled: true,
      pointsMultiplier: 1.0,
      maxDailyPoints: 500,
      tierRequirements: {
        bronze: 0,
        silver: 500,
        gold: 2000
      },
      monthlySettings: {
        cycleStartDay: 1,
        cycleStartTime: "00:00",
        distributionDay: 5,
        distributionTime: "12:00",
        timezone: "UTC",
        distributionDelayDays: 3
      }
    };
  }

  async updateSystemSettings(settings: any): Promise<void> {
    try {
      // Ensure system_settings table exists
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY,
          settings_data TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `);

      // Save to database
      await db.execute(sql`
        INSERT INTO system_settings (id, settings_data, updated_at)
        VALUES (1, ${JSON.stringify(settings)}, ${new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET
          settings_data = ${JSON.stringify(settings)},
          updated_at = ${new Date().toISOString()}
      `);

      console.log('System settings updated:', settings);
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(userIds: number[], updates: Partial<User>): Promise<void> {
    await db.update(users)
      .set(updates)
      .where(sql`${users.id} = ANY(${userIds})`);
  }

  async bulkResetPasswords(userIds: number[]): Promise<void> {
    // Generate temporary passwords and update users
    const tempPassword = await bcrypt.hash('TempPassword123!', 10);
    await db.update(users)
      .set({ password: tempPassword })
      .where(sql`${users.id} = ANY(${userIds})`);
  }

  async exportUserData(userIds: number[]): Promise<any> {
    return await db.select().from(users).where(sql`${users.id} = ANY(${userIds})`);
  }

  async getUserDetailsForAdmin(userId: number): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const pointsHistory = await this.getUserPointsHistory(userId);
    return { user, pointsHistory };
  }

  async exportUsers(format: string): Promise<string> {
    const users = await db.select().from(users);
    if (format === 'csv') {
      const headers = 'ID,Username,Email,Total Points,Tier,Joined At\n';
      const rows = users.map(u => `${u.id},${u.username},${u.email},${u.totalPoints},${u.tier},${u.joinedAt}`).join('\n');
      return headers + rows;
    }
    return JSON.stringify(users, null, 2);
  }

  async exportPointsHistory(format: string): Promise<string> {
    const history = await db.select().from(userPointsHistory);
    if (format === 'csv') {
      const headers = 'User ID,Points,Action,Description,Status,Created At\n';
      const rows = history.map(h => `${h.userId},${h.points},${h.action},${h.description},${h.status},${h.createdAt}`).join('\n');
      return headers + rows;
    }
    return JSON.stringify(history, null, 2);
  }

  async exportAnalytics(format: string): Promise<string> {
    const analytics = await this.getAdminAnalytics('30d');
    return JSON.stringify(analytics, null, 2);
  }

  // === SUPPORT REQUEST METHODS ===

  async createSupportRequest(data: {
    userId?: number | null;
    name: string;
    email: string;
    category: string;
    message: string;
    hasAttachment?: boolean;
    fileName?: string | null;
  }): Promise<SupportRequest> {
    const [supportRequest] = await db.insert(supportRequests).values({
      userId: data.userId,
      name: data.name,
      email: data.email,
      category: data.category,
      message: data.message,
      hasAttachment: data.hasAttachment || false,
      fileName: data.fileName,
      status: 'pending',
      priority: 'normal'
    }).returning();

    return supportRequest;
  }

  async getSupportRequests(options: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }): Promise<SupportRequest[]> {
    const { page = 1, limit = 50, status, category } = options;
    const offset = (page - 1) * limit;

    let query = db.select().from(supportRequests);

    // Add filters
    const conditions = [];
    if (status) {
      conditions.push(eq(supportRequests.status, status));
    }
    if (category) {
      conditions.push(eq(supportRequests.category, category));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const requests = await query
      .orderBy(desc(supportRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return requests;
  }

  async getSupportRequestById(requestId: number): Promise<SupportRequest | null> {
    const [request] = await db.select()
      .from(supportRequests)
      .where(eq(supportRequests.id, requestId))
      .limit(1);

    return request || null;
  }

  async updateSupportRequest(requestId: number, updates: {
    status?: string;
    priority?: string;
    response?: string;
    resolvedAt?: Date | null;
  }): Promise<void> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date()
    };

    await db.update(supportRequests)
      .set(updateData)
      .where(eq(supportRequests.id, requestId));
  }

  async getSupportRequestStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    const stats = await db.select({
      status: supportRequests.status,
      count: sql<number>`count(*)`
    })
    .from(supportRequests)
    .groupBy(supportRequests.status);

    const result = {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      switch (stat.status) {
        case 'pending':
          result.pending = stat.count;
          break;
        case 'in_progress':
          result.inProgress = stat.count;
          break;
        case 'resolved':
          result.resolved = stat.count;
          break;
        case 'closed':
          result.closed = stat.count;
          break;
      }
    });

    return result;
  }

  async getUserProgress(userId: number) {
    try {
      // Get all progress records for the user, not just completed ones
      const progress = await db.execute(sql`
        SELECT * FROM user_progress 
        WHERE user_id = ${userId}
        ORDER BY completed_at DESC
      `);

      // Handle different response formats
      const rows = progress.rows || progress || [];

      console.log(`User ${userId} progress query returned ${rows.length} total lessons, ${rows.filter((r: any) => r.completed).length} completed`);

      return rows.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        moduleId: p.module_id,
        completed: !!p.completed,
        pointsEarned: p.points_earned || 0,
        completedAt: p.completed_at,
        createdAt: p.created_at
      }));
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  }

  async markLessonComplete(userId: number, lessonId: string): Promise<{ pointsEarned: number; streakBonus: number; newStreak }> {
    // Handle both numeric and string lesson IDs
    let moduleId: number;

    // If lessonId is numeric, use it directly as moduleId
    if (!isNaN(Number(lessonId))) {
      moduleId = Number(lessonId);
      console.log(`Marking lesson with numeric ID ${lessonId} as complete for user ${userId}`);
    } else {
      // Create a complete mapping of lesson string IDs to numbers for database storage
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
        // Additional mappings for all education content
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

      console.log(`Marking lesson ${lessonId} (moduleId: ${lessonIdMap[lessonId]}) as complete for user ${userId}`);

      moduleId = lessonIdMap[lessonId];
      if (!moduleId) {
        console.error(`Unknown lesson ID: ${lessonId}. Available IDs:`, Object.keys(lessonIdMap));
        throw new Error(`Unknown lesson ID: ${lessonId}`);
      }
    }

    // Check if already completed using raw SQL
    const existingProgress = await db.execute(sql`
      SELECT * FROM user_progress 
      WHERE user_id = ${userId} AND module_id = ${moduleId}
      LIMIT 1
    `);

    const existingRows = existingProgress.rows || existingProgress || [];
    if (existingRows.length > 0 && existingRows[0].completed) {
      throw new Error('Lesson already completed');
    }

    // Use static points for lesson completion
    const pointsEarned = 20;

    // Update streak and get bonus points
    const { newStreak, bonusPoints } = await this.updateUserStreak(userId);

    // Create a proper completion record in the database
    try {
      if (existingRows.length > 0) {
        await db.execute(sql`
          UPDATE user_progress 
          SET completed = true, points_earned = ${pointsEarned}, completed_at = NOW()
          WHERE user_id = ${userId} AND module_id = ${moduleId}
        `);
      } else {
        // Insert new progress record - check if exists first to avoid conflicts
        await db.execute(sql`
          INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
          VALUES (${userId}, ${moduleId}, true, ${pointsEarned}, NOW(), NOW())
        `);
      }
      console.log(`Successfully recorded lesson completion for user ${userId}, lesson ${lessonId}, moduleId ${moduleId}`);
    } catch (error) {
      console.error('Database completion tracking failed:', error);
      // Continue with points award even if database tracking fails
    }

    // Update user points (base points only, streak bonus already added in updateUserStreak)
    await db.update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${pointsEarned}`,
        currentMonthPoints: sql`${users.currentMonthPoints} + ${pointsEarned}`,
      })
      .where(eq(users.id, userId));

    // Record points history for lesson completion
    await this.awardPoints(userId, 'lesson_complete', pointsEarned, `Completed lesson: ${lessonId}`, { moduleId, lessonId });

    // Record streak bonus in history if any
    if (bonusPoints > 0) {
      await this.awardPoints(userId, 'streak_bonus', bonusPoints, `${newStreak}-day streak bonus`);
    }

    return { pointsEarned, streakBonus: bonusPoints, newStreak };
  }

  // === PASSWORD RESET METHODS ===

  async createPasswordResetToken(userId: number): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidate any existing tokens for this user
    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.userId, userId));

    // Create new token
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<{isValid: boolean, userId?: number}> {
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken) {
      return { isValid: false };
    }

    const now = new Date();

    // Check if token is expired or already used
    if (resetToken.expiresAt < now || resetToken.isUsed) {
      return { isValid: false };
    }

    return { isValid: true, userId: resetToken.userId };
  }

  async resetUserPassword(token: string, newPassword: string): Promise<boolean> {
    const validation = await this.validatePasswordResetToken(token);

    if (!validation.isValid || !validation.userId) {
      return false;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, validation.userId));

    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, token));

    return true;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(lt(passwordResetTokens.expiresAt, now));
  }

  async getTierThresholds(): Promise<{ tier1: number, tier2: number, tier3: number }> {
    // Return cached thresholds if available and not expired (cache for 5 minutes)
    if (this.tierThresholdCache && this.tierThresholdCacheTime && 
        (Date.now() - this.tierThresholdCacheTime < 5 * 60 * 1000)) {
      return this.tierThresholdCache;
    }

    // Get all active users' current month points to calculate percentiles
    const allUsers = await db.select({
      currentMonthPoints: users.currentMonthPoints
    }).from(users)
    .where(eq(users.isActive, true));

    if (allUsers.length === 0) {
      const thresholds = { tier1: 0, tier2: 0, tier3: 0 };
      this.tierThresholdCache = thresholds;
      this.tierThresholdCacheTime = Date.now();
      return thresholds;
    }

    // Sort points in ascending order - include ALL users including those with 0 points
    const allPoints = allUsers
      .map(u => u.currentMonthPoints || 0)
      .sort((a, b) => a - b);

    // Calculate percentile thresholds based on ALL users
    // Now Tier 1 is highest (67th percentile), Tier 3 is lowest (0-33rd percentile)
    const tier2Index = Math.floor(allPoints.length * 0.33);
    const tier1Index = Math.floor(allPoints.length * 0.67);

    const thresholds = {
      tier1: allPoints[tier1Index] || 0, // Tier 1 is now highest (67th percentile+)
      tier2: allPoints[tier2Index] || 0, // Tier 2 is middle (33rd-67th percentile)
      tier3: 0 // Tier 3 is now lowest (0-33rd percentile)
    };

    // Cache the calculated thresholds with timestamp
    this.tierThresholdCache = thresholds;
    this.tierThresholdCacheTime = Date.now();
    return thresholds;
  }

  async createUserMonthlyReward(data: {
    userId: number;
    monthlyRewardId: number;
    tier: string;
    pointsAtDistribution: number;
    rewardAmount: number;
    pointsDeducted: number;
    pointsRolledOver: number;
    isWinner: boolean;
  }): Promise<UserMonthlyReward> {
    const [userMonthlyReward] = await db.insert(userMonthlyRewards).values(data).returning();
    return userMonthlyReward;
  }

  async markMonthlyRewardDistributed(monthlyRewardId: number): Promise<void> {
    await db.update(monthlyRewards)
      .set({
        status: 'distributed',
        distributedAt: new Date(),
      })
      .where(eq(monthlyRewards.id, monthlyRewardId));
  }

  async getTotalRewardsReceived(userId: number): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COALESCE(SUM(reward_amount), 0) as total_rewards
        FROM user_monthly_rewards 
        WHERE user_id = ${userId} AND is_winner = true
      `);

      const totalCents = result.rows?.[0]?.total_rewards || result[0]?.total_rewards || 0;
      return Math.floor(totalCents / 100); // Convert cents to dollars
    } catch (error) {
      console.error('Error fetching total rewards:', error);
      return 0;
    }
  }

  async getDistributionSettings(): Promise<{[key: string]: string}> {
    // In a real system, this would fetch from a settings table
    // For now, using configurable defaults that admins can set
    return {
      accumulationPeriodEnd: "last_day_of_month", // Options: last_day_of_month, last_thursday, 15th, etc.
      distributionDelayDays: "1", // Days after accumulation period ends
      accumulationPeriodType: "monthly", // monthly, weekly, custom
      timezone: "UTC",
      nextDistributionDate: "auto" // auto-calculate or specific date
    };
  }

  // Authentication methods
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async generateToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    // Store token in memory for this session
    this.tokens.set(token, { userId, createdAt: new Date() });
    return token;
  }

  async getUserByToken(token: string): Promise<User | null> {
    try {
      const tokenData = this.tokens.get(token);
      if (!tokenData) return null;

      // Check if token is expired (24 hours)
      const tokenAge = Date.now() - tokenData.createdAt.getTime();
      if (tokenAge > 24 * 60 * 60 * 1000) {
        this.tokens.delete(token);
        return null;
      }

      return await this.getUser(tokenData.userId) || null;
    } catch (error) {
      console.error('Error getting user by token:', error);
      return null;
    }
  }

  async validateToken(token: string): Promise<User | null> {
    return this.getUserByToken(token);
  }

  // Admin methods
  async getAdminAnalytics(): Promise<any> {
    try {
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const activeUsers = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`last_login_at > NOW() - INTERVAL '30 days'`);

      const moduleCount = await db.select({ count: sql<number>`count(*)` }).from(learningModules);

      return {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
        totalModules: moduleCount[0]?.count || 0,
        totalCompletions: 0,
        avgCompletionRate: 0,
        userGrowth: [],
        pointsDistribution: [],
        recentActivity: [],
        systemHealth: {}
      };
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalModules: 0,
        totalCompletions: 0,
        avgCompletionRate: 0,
        userGrowth: [],
        pointsDistribution: [],
        recentActivity: [],
        systemHealth: {}
      };
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.joinedAt));
      return allUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllModules(): Promise<any[]> {
    try {
      const modules = await db.select().from(learningModules).orderBy(learningModules.order);
      return modules;
    } catch (error) {
      console.error('Error getting all modules:', error);
      return [];
    }
  }

  async getModuleById(moduleId: number): Promise<any | null> {
    try {
      const [module] = await db.select()
        .from(learningModules)
        .where(eq(learningModules.id, moduleId))
        .limit(1);
      return module || null;
    } catch (error) {
      console.error('Error getting module by ID:', error);
      return null;
    }
  }

  async toggleModulePublish(moduleId: number, isPublished: boolean): Promise<any> {
    try {
      const publishedAt = isPublished ? new Date() : null;

      const [updatedModule] = await db.update(learningModules)
        .set({ 
          isPublished: isPublished,
          publishedAt: publishedAt
        })
        .where(eq(learningModules.id, moduleId))
        .returning();

      return updatedModule;
    } catch (error) {
      console.error('Error toggling module publish status:', error);
      throw new Error('Failed to update module publish status');
    }
  }

  async getPublishedModules(): Promise<any[]> {
    try {
      const modules = await db.select({
        id: learningModules.id,
        title: learningModules.title,
        description: learningModules.description,
        content: learningModules.content,
        quiz: learningModules.quiz,
        pointsReward: learningModules.pointsReward,
        category: learningModules.category,
        difficulty: learningModules.difficulty,
        estimatedMinutes: learningModules.estimatedMinutes,
        accessType: learningModules.accessType,
        isActive: learningModules.isActive,
        isPublished: learningModules.isPublished,
        order: learningModules.order,
        createdAt: learningModules.createdAt
      })
        .from(learningModules)
        .where(eq(learningModules.isPublished, true))
        .orderBy(learningModules.order);
      return modules;
    } catch (error) {
      console.error('Error getting published modules:', error);
      return [];
    }
  }

  async getMonthlyPool(): Promise<any> {
    try {
      // Only count premium members (active subscription status)
      const premiumUsers = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.subscriptionStatus, 'active'));
      const premiumUserCount = premiumUsers[0]?.count || 0;

      // Get tier distribution for premium users only
      const tierCounts = await db.select({
        tier: users.tier,
        count: sql<number>`count(*)`
      })
        .from(users)
        .where(eq(users.subscriptionStatus, 'active'))
        .groupBy(users.tier);

      const tierMap = tierCounts.reduce((acc, { tier, count }) => {
        acc[tier] = count;
        return acc;
      }, {} as Record<string, number>);

      const monthlyRevenue = premiumUserCount * 20; // $20 per premium user
      const totalPool = Math.round(monthlyRevenue * 0.55); // 55% of revenue

      return {
        totalUsers: premiumUserCount, // Return as number for consistency
        premiumUsers: premiumUserCount, // Explicitly show premium user count
        monthlyRevenue: monthlyRevenue.toString(),
        totalPool,
        tier1Pool: Math.round(totalPool * 0.5), // 50%
        tier2Pool: Math.round(totalPool * 0.3), // 30%
        tier3Pool: Math.round(totalPool * 0.2), // 20%
        tier1Users: tierMap.tier1 || 0,
        tier2Users: tierMap.tier2 || 0,
        tier3Users: tierMap.tier3 || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting monthly pool:', error);
      return {
        totalUsers: 0,
        premiumUsers: 0,
        monthlyRevenue: "0",
        totalPool: 0,
        tier1Pool: 0,
        tier2Pool: 0,
        tier3Pool: 0,
        tier1Users: 0,
        tier2Users: 0,
        tier3Users: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getNextDistribution(): Promise<any> {
    try {
      // Get distribution settings
      const settings = await this.getDistributionSettings();

      // Calculate next distribution date based on current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // For monthly distributions, next payout is first day of next month
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextDate = new Date(nextYear, nextMonth, 1);

      // Calculate time remaining
      const timeRemaining = nextDate.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
      const hours = Math.max(0, Math.ceil((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.ceil((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

      return {
        nextDate: nextDate.toISOString(),
        timeRemaining: {
          days,
          hours,
          minutes,
          totalMs: timeRemaining
        },
        settings,
        estimatedPool: 1000
      };
    } catch (error) {
      console.error('Error calculating next distribution:', error);
      return {
        nextDate: null,
        timeRemaining: { days: 0, hours: 0, minutes: 0, totalMs: 0 },
        settings: {},
        estimatedPool: 0
      };
    }
  }

  async getTierThresholds(): Promise<any> {
    try {
      const allUsers = await db.select({ points: users.currentMonthPoints })
        .from(users)
        .where(eq(users.subscriptionStatus, 'active'));
      const points = allUsers.map(u => u.points || 0).sort((a, b) => a - b);

      if (points.length === 0) {
        return { tier1: 0, tier2: 0, tier3: 0 };
      }

      // Calculate 33rd and 67th percentiles
      // Now Tier 1 is highest (67th percentile), Tier 3 is lowest (0-33rd percentile)
      const tier2Index = Math.floor(points.length * 0.33);
      const tier1Index = Math.floor(points.length * 0.67);

      return {
        tier1: points[tier1Index] || 0, // Tier 1 is now highest (67th percentile+)
        tier2: points[tier2Index] || 0, // Tier 2 is middle (33rd-67th percentile)
        tier3: 0 // Tier 3 is now lowest (0-33rd percentile)
      };
    } catch (error) {
      console.error('Error calculating tier thresholds:', error);
      return { tier1: 0, tier2: 28, tier3: 64 };
    }
  }

  async getLeaderboard(): Promise<any[]> {
    try {
      const leaderboard = await db.select({
        userId: users.id,
        username: users.username,
        points: users.currentMonthPoints,
        tier: users.tier
      })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'))
      .orderBy(desc(users.currentMonthPoints))
      .limit(50);

      return leaderboard.map((user, index) => ({
        rank: (index + 1).toString(),
        userId: user.userId,
        username: user.username,
        points: user.points || 0,
        tier: user.tier || 'tier1'
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  async getExpandedLeaderboard(timeFilter: string, page: number, search: string): Promise<Array<{rank: string, username: string, points: string, tier: string, streak: number, modulesCompleted: number, joinDate: string}>> {
    try {
      // Build base query for all premium users (active subscription status)
      let query = db.select({
        id: users.id,
        username: users.username,
        totalPoints: users.totalPoints,
        currentMonthPoints: users.currentMonthPoints,
        tier: users.tier,
        streak: users.currentStreak,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'));

      // Add search filter if provided
      if (search && search.trim()) {
        query = query.where(and(
          eq(users.subscriptionStatus, 'active'),
          sql`${users.username} ILIKE ${`%${search}%`}`
        ));
      }

      // Determine which points column to use and order by it
      const pointsColumn = timeFilter === 'alltime' ? 'totalPoints' : 'currentMonthPoints';
      
      const usersData = await query.orderBy(desc(pointsColumn === 'alltime' ? users.totalPoints : users.currentMonthPoints));

      console.log(`Expanded leaderboard query returned ${usersData.length} premium users`);

      // Get module completion counts for all these users
      const userIds = usersData.map(u => u.id);
      let moduleCompletions = [];
      
      if (userIds.length > 0) {
        try {
          moduleCompletions = await db.select({
            userId: userProgress.userId,
            completedCount: sql<number>`COUNT(*)`.as('completedCount')
          })
          .from(userProgress)
          .where(and(
            sql`${userProgress.userId} = ANY(${userIds})`,
            eq(userProgress.completed, true)
          ))
          .groupBy(userProgress.userId);
        } catch (progressError) {
          console.error('Error fetching module completions:', progressError);
          moduleCompletions = [];
        }
      }

      const completionMap = new Map(
        moduleCompletions.map(c => [c.userId, c.completedCount])
      );

      const result = usersData.map((user, index) => {
        const points = timeFilter === 'alltime' ? (user.totalPoints || 0) : (user.currentMonthPoints || 0);
        
        return {
          rank: (index + 1).toString(),
          username: user.username,
          points: points.toString(),
          tier: user.tier || 'tier3',
          streak: user.streak || 0,
          modulesCompleted: completionMap.get(user.id) || 0,
          joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

      console.log(`Returning ${result.length} users in expanded leaderboard`);
      return result;
    } catch (error) {
      console.error('Error getting expanded leaderboard:', error);
      return [];
    }
  }

  async getUserLeaderboardStats(userId: number, timeFilter: string): Promise<{username: string, rank: number, points: number, tier: string, streak: number, modulesCompleted: number, pointsToNextTier: number, pointsToTopPosition?: number}> {
    try {
      const pointsColumn = timeFilter === 'alltime' ? users.totalPoints : users.currentMonthPoints;
      
      // Get user data
      const userData = await db.select({
        username: users.username,
        points: pointsColumn,
        tier: users.tier,
        streak: users.currentStreak
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

      if (!userData.length) {
        throw new Error('User not found');
      }

      const user = userData[0];

      // Get user's rank
      const rankQuery = await db.select({
        rank: sql<number>`COUNT(*) + 1`.as('rank')
      })
      .from(users)
      .where(sql`${pointsColumn} > ${user.points}`);

      const rank = rankQuery[0]?.rank || 1;

      // Get module completion count
      const moduleCompletion = await db.select({
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, true)
      ));

      const modulesCompleted = moduleCompletion[0]?.count || 0;

      // Calculate points to next tier
      const tierThresholds = await this.getTierThresholds();
      let pointsToNextTier = 0;
      const currentPoints = user.points || 0;

      if (user.tier === 'member') {
        pointsToNextTier = tierThresholds.tier1 - currentPoints;
      } else if (user.tier === 'tier1') {
        pointsToNextTier = tierThresholds.tier2 - currentPoints;
      } else if (user.tier === 'tier2') {
        pointsToNextTier = tierThresholds.tier3 - currentPoints;
      }

      // Get points to top position if user is in top tier
      let pointsToTopPosition;
      if (user.tier === 'tier3') {
        const topUser = await db.select({
          points: pointsColumn
        })
        .from(users)
        .orderBy(desc(pointsColumn))
        .limit(1);

        if (topUser.length && topUser[0].points > currentPoints) {
          pointsToTopPosition = topUser[0].points - currentPoints + 1;
        }
      }

      return {
        username: user.username,
        rank,
        points: currentPoints,
        tier: user.tier || 'member',
        streak: user.streak || 0,
        modulesCompleted,
        pointsToNextTier: Math.max(0, pointsToNextTier),
        pointsToTopPosition
      };
    } catch (error) {
      console.error('Error getting user leaderboard stats:', error);
      throw error;
    }
  }

  async getUserProgress(userId: number): Promise<any[]> {
    try {
      const progress = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
      return progress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return [];
    }
  }

  async getPointActions(): Promise<any[]> {
    try {
      // Get all admin-configured actions (both active and inactive for admin management)
      const adminActions = await db.select().from(adminPointsActions);

      if (adminActions.length > 0) {
        return adminActions.map(action => ({
          id: action.id,
          actionId: action.actionId,
          name: action.name,
          basePoints: action.basePoints,
          maxDaily: action.maxDaily,
          maxMonthly: action.maxMonthly,
          maxTotal: action.maxTotal,
          requiresProof: action.requiresProof,
          category: action.category,
          description: action.description,
          isActive: action.isActive
        }));
      }

      // Fallback to static configuration
      return Object.values(POINTS_CONFIG).filter(action => typeof action === 'object' && action.id);
    } catch (error) {
      console.error('Error fetching point actions:', error);
      // Fallback to static configuration on error
      return Object.values(POINTS_CONFIG).filter(action => typeof action === 'object' && action.id);
    }
  }

  async createOrUpdatePointAction(actionData: {
    actionId: string;
    name: string;
    basePoints: number;
    maxDaily?: number;
    maxMonthly?: number;
    maxTotal?: number;
    requiresProof: boolean;
    category: string;
    description: string;
  }, adminUserId: number): Promise<any> {
    const existing = await db.select()
      .from(adminPointsActions)
      .where(eq(adminPointsActions.actionId, actionData.actionId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const updated = await db.update(adminPointsActions)
        .set({
          name: actionData.name,
          basePoints: actionData.basePoints,
          maxDaily: actionData.maxDaily,
          maxMonthly: actionData.maxMonthly,
          maxTotal: actionData.maxTotal,
          requiresProof: actionData.requiresProof,
          category: actionData.category,
          description: actionData.description,
          updatedAt: new Date(),
          updatedBy: adminUserId
        })
        .where(eq(adminPointsActions.actionId, actionData.actionId))
        .returning();

      return updated[0];
    } else {
      // Create new
      const created = await db.insert(adminPointsActions)
        .values({
          ...actionData,
          updatedBy: adminUserId
        })
        .returning();

      return created[0];
    }
  }

  async updatePointAction(id: number, actionData: any, adminUserId: number): Promise<any> {
    const updated = await db.update(adminPointsActions)
      .set({
        name: actionData.name,
        basePoints: actionData.basePoints,
        maxDaily: actionData.maxDaily,
        maxMonthly: actionData.maxMonthly,
        requiresProof: actionData.requiresProof,
        category: actionData.category,
        description: actionData.description,
        isActive: actionData.isActive,
        updatedAt: new Date(),
        updatedBy: adminUserId
      })
      .where(eq(adminPointsActions.id, id))
      .returning();

    return updated[0];
  }

  async deletePointAction(actionId: string): Promise<void> {
    await db.update(adminPointsActions)
      .set({ isActive: false })
      .where(eq(adminPointsActions.actionId, actionId));
  }

  // Admin CRUD operations implementation
  async createModule(moduleData: any): Promise<any> {
    try {
      const [module] = await db.insert(learningModules).values({
        title: moduleData.title,
        description: moduleData.description,
        category: moduleData.category,
        difficulty: moduleData.difficulty,
        estimatedMinutes: moduleData.estimatedMinutes || 5,
        content: moduleData.content,
        quiz: moduleData.quiz || null,
        isActive: moduleData.isActive !== undefined ? moduleData.isActive : true,
        order: moduleData.order || 0,
        pointsReward: moduleData.pointsReward || 20,
        accessType: 'premium',
        isPublished: false
      }).returning();
      return module;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  async updateModule(moduleId: number, moduleData: any): Promise<any> {
    try {
      const [module] = await db.update(learningModules)
        .set({
          title: moduleData.title,
          description: moduleData.description,
          category: moduleData.category,
          difficulty: moduleData.difficulty,
          estimatedMinutes: moduleData.estimatedMinutes,
          content: moduleData.content,
          quiz: moduleData.quiz,
          isActive: moduleData.isActive,
          order: moduleData.order,
          pointsReward: moduleData.pointsReward,
          accessType: moduleData.accessType,
          isPublished: moduleData.isPublished
        })
        .where(eq(learningModules.id, moduleId))
        .returning();
      return module;
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  async deleteModule(moduleId: number): Promise<void> {
    try {
      await db.delete(learningModules).where(eq(learningModules.id, moduleId));
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }

  async getAllModules(): Promise<any[]> {
    try {
      const modules = await db.select().from(learningModules);
      return modules;
    } catch (error) {
      console.error('Error getting all modules:', error);
      return [];
    }
  }

  async updateUser(userId: number, userData: any): Promise<User> {
    try {
      const updateData: any = {};

      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
      if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
      if (userData.currentMonthPoints !== undefined) updateData.currentMonthPoints = userData.currentMonthPoints;
      if (userData.totalPoints !== undefined) updateData.totalPoints = userData.totalPoints;
      if (userData.tier !== undefined) updateData.tier = userData.tier;
      if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
      if (userData.subscriptionStatus !== undefined) updateData.subscriptionStatus = userData.subscriptionStatus;
      if (userData.stripeCustomerId !== undefined) updateData.stripeCustomerId = userData.stripeCustomerId;
      if (userData.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = userData.stripeSubscriptionId;
      if (userData.nextBillingDate !== undefined) updateData.nextBillingDate = userData.nextBillingDate;
      if (userData.password !== undefined) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      const [user] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      // Delete related records first
      await db.delete(userPointsHistory).where(eq(userPointsHistory.userId, userId));
      await db.delete(userProgress).where(eq(userProgress.userId, userId));
      await db.delete(userMonthlyRewards).where(eq(userMonthlyRewards.userId, userId));

      // Delete the user
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async awardPoints(userId: number, points: number, action: string, reason: string): Promise<void> {
    try {
      // Update user points
      const user = await this.getUserById(userId);
      if (user) {
        await db.update(users)
          .set({
            currentMonthPoints: (user.currentMonthPoints || 0) + points,
            totalPoints: (user.totalPoints || 0) + points
          })
          .where(eq(users.id, userId));

        // Record points history
        await db.insert(userPointsHistory).values({
          userId: userId,
          action: action,
          points: points,
          description: reason,
          metadata: JSON.stringify({ adminAwarded: true })
        });
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  async deductPoints(userId: number, points: number, action: string, reason: string): Promise<void> {
    try {
      // Update user points
      const user = await this.getUserById(userId);
      if (user) {
        const newCurrentPoints = Math.max(0, (user.currentMonthPoints || 0) - points);
        const newTotalPoints = Math.max(0, (user.totalPoints || 0) - points);

        await db.update(users)
          .set({
            currentMonthPoints: newCurrentPoints,
            totalPoints: newTotalPoints
          })
          .where(eq(users.id, userId));

        // Record points history
        await db.insert(userPointsHistory).values({
          userId: userId,
          action: action,
          points: -points,
          description: reason,
          metadata: JSON.stringify({ adminDeducted: true })
        });
      }
    } catch (error) {
      console.error('Error deducting points:', error);
      throw error;
    }
  }

  async updateRewardsConfig(config: any): Promise<void> {
    try {
      // Store rewards configuration (implement based on your schema)
      console.log('Updating rewards config:', config);
      // Implementation depends on how you want to store the config
    } catch (error) {
      console.error('Error updating rewards config:', error);
      throw error;
    }
  }

  async executeMonthlyDistribution(month: string): Promise<any> {
    try {
      // Implement monthly distribution logic
      console.log('Executing monthly distribution for:', month);

      // Get all users with points for the month
      const usersWithPoints = await db.select()
        .from(users)
        .where(gte(users.currentMonthPoints, 1))
        .orderBy(desc(users.currentMonthPoints));

      const result = {
        month: month,
        distributedUsers: usersWithPoints.length,
        totalAmount: 0,
        distribution: []
      };

      return result;
    } catch (error) {
      console.error('Error executing monthly distribution:', error);
      throw error;
    }
  }

  async getAllSupportTickets(): Promise<any[]> {
    try {
      const tickets = await db.select().from(supportRequests).orderBy(desc(supportRequests.createdAt));
      return tickets;
    } catch (error) {
      console.error('Error getting support tickets:', error);
      return [];
    }
  }

  async updateSupportTicket(ticketId: number, ticketData: any): Promise<any> {
    try {
      const updateData: any = {};

      if (ticketData.status !== undefined) updateData.status = ticketData.status;
      if (ticketData.priority !== undefined) updateData.priority = ticketData.priority;
      if (ticketData.response !== undefined) updateData.response = ticketData.response;
      if (ticketData.resolvedAt !== undefined) updateData.resolvedAt = ticketData.resolvedAt;

      const [ticket] = await db.update(supportRequests)
        .set(updateData)
        .where(eq(supportRequests.id, ticketId))
        .returning();

      return ticket;
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  // Stripe payment methods
  async addToRewardPool(amount: number): Promise<void> {
    // Add payment amount to the monthly pool
    // This would update the reward pool balance in the database
    console.log(`Added $${amount/100} to reward pool from subscription payment`);
    // In a real implementation, this would update a reward pool table
  }

  // Monthly pool settings methods
  async createMonthlyPoolSetting(setting: any): Promise<any> {
    try {
      const [newSetting] = await db.insert(monthlyPoolSettings).values(setting).returning();
      return newSetting;
    } catch (error) {
      console.error('Error creating monthly pool setting:', error);
      throw error;
    }
  }

  async getActiveMonthlyPoolSetting(): Promise<any> {
    try {
      const [activeSetting] = await db.select()
        .from(monthlyPoolSettings)
        .where(eq(monthlyPoolSettings.isActive, true))
        .orderBy(desc(monthlyPoolSettings.cycleStartDate))
        .limit(1);
      return activeSetting || null;
    } catch (error) {
      console.error('Error getting active monthly pool setting:', error);
      return null;
    }
  }

  async getCurrentPoolSettingsForDate(date: Date): Promise<{ rewardPoolPercentage: number; membershipFee: number } | null> {
    try {
      const [setting] = await db.select()
        .from(monthlyPoolSettings)
        .where(
          and(
            sql`${monthlyPoolSettings.cycleStartDate} <= ${date.toISOString().split('T')[0]}`,
            sql`${monthlyPoolSettings.cycleEndDate} >= ${date.toISOString().split('T')[0]}`,
            eq(monthlyPoolSettings.isActive, true)
          )
        )
        .limit(1);

      if (setting) {
        return {
          rewardPoolPercentage: setting.rewardPoolPercentage,
          membershipFee: setting.membershipFee
        };
      }

      // Fallback to default if no setting found
      return {
        rewardPoolPercentage: 55, // Default 55%
        membershipFee: 2000 // Default $20
      };
    } catch (error) {
      console.error('Error getting current pool settings:', error);
      return {
        rewardPoolPercentage: 55,
        membershipFee: 2000
      };
    }
  }

  async updateMonthlyPoolSetting(id: number, updates: any): Promise<any> {
    try {
      const [updated] = await db.update(monthlyPoolSettings)
        .set(updates)
        .where(eq(monthlyPoolSettings.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating monthly pool setting:', error);
      throw error;
    }
  }

  async getAllMonthlyPoolSettings(): Promise<any[]> {
    try {
      return await db.select()
        .from(monthlyPoolSettings)
        .orderBy(desc(monthlyPoolSettings.cycleStartDate));
    } catch (error) {
      console.error('Error getting all monthly pool settings:', error);
      return [];
    }
  }

  // Stripe integration methods
  async updateUserSubscriptionStatus(userId: number, status: string): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          subscriptionStatus: status
        })
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    } catch (error) {
      console.error('Error updating user subscription status:', error);
      return null;
    }
  }

  async updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          stripeCustomerId: stripeCustomerId
        })
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    } catch (error) {
      console.error('Error updating user Stripe customer ID:', error);
      return null;
    }
  }

  async updateUserStripeSubscriptionId(userId: number, stripeSubscriptionId: string): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          stripeSubscriptionId: stripeSubscriptionId
        })
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    } catch (error) {
      console.error('Error updating user Stripe subscription ID:', error);
      return null;
    }
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
      return user || null;
    } catch (error) {
      console.error('Error getting user by Stripe customer ID:', error);
      return null;
    }
  }

  async convertTheoreticalPoints(userId: number): Promise<void> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user && user.theoreticalPoints > 0) {
        await db
          .update(users)
          .set({ 
            totalPoints: user.totalPoints + user.theoreticalPoints,
            currentMonthPoints: user.currentMonthPoints + user.theoreticalPoints,
            theoreticalPoints: 0
          })
          .where(eq(users.id, userId));
      }
    } catch (error) {
      console.error('Error converting theoretical points:', error);
    }
  }
}

export const storage = new MemStorage();