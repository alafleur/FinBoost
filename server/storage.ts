import { users, type User, type InsertUser, subscribers, type Subscriber, type InsertSubscriber, userPointsHistory, learningModules, userProgress, monthlyRewards, userMonthlyRewards, referrals, userReferralCodes, supportRequests, type SupportRequest, passwordResetTokens, type PasswordResetToken } from "@shared/schema";
import type { UserPointsHistory, MonthlyReward, UserMonthlyReward, Referral, UserReferralCode } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq, sql, desc, and, lt } from "drizzle-orm";
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

    // User Authentication Methods
    getUserByEmail(email: string): Promise<User | null>;
    getUserById(id: number): Promise<User | null>;
    validatePassword(email: string, password: string): Promise<User | null>;
    updateUserPoints(userId: number, totalPoints: number, currentMonthPoints: number): Promise<void>;
    getUserPointsHistory(userId: number): Promise<UserPointsHistory[]>;
    updateLastLogin(userId: number): Promise<void>;
    updateUserProfile(userId: number, profileData: Partial<{firstName: string, lastName: string, bio: string, location: string, occupation: string, financialGoals: string}>): Promise<void>;

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
    markLessonComplete(userId: number, moduleId: number): Promise<{ pointsEarned: number; streakBonus: number; newStreak }>;

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

      // Save to file
      await this.saveToFile();
    } else {
      console.log("=== DEBUG POINTS: User not found in memory storage for ID:", userId);
    }

    return historyEntry;
  }

  async awardPointsWithProof(userId: number, actionId: string, points: number, description: string, proofUrl: string, metadata?: any): Promise<UserPointsHistory> {
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

    // Create pending points history entry
    const [historyEntry] = await db.insert(userPointsHistory).values({
      userId,
      points,
      action: actionId,
      description,
      status: 'pending',
      proofUrl,
      metadata: metadata ? JSON.stringify(metadata) : null,
    }).returning();

    return historyEntry;
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

  async calculateUserTier(points: number): Promise<string> {
    // Get all users' current month points to calculate percentiles
    const allUsers = await db.select({
      currentMonthPoints: users.currentMonthPoints
    }).from(users);

    if (allUsers.length === 0) return 'tier1';

    // Sort points in ascending order
    const sortedPoints = allUsers.map(u => u.currentMonthPoints).sort((a, b) => a - b);

    // Calculate percentile thresholds
    const p33Index = Math.floor(sortedPoints.length * 0.33);
    const p66Index = Math.floor(sortedPoints.length * 0.66);

    const bronzeThreshold = sortedPoints[p33Index] || 0;
    const silverThreshold = sortedPoints[p66Index] || 0;

    // Determine tier based on percentiles
    if (points >= silverThreshold) return 'tier3';
    if (points >= bronzeThreshold) return 'tier2';
    return 'tier1';
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

    // Update referral code stats
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

  async getUserDetailsForAdmin(userId: number): Promise<any> {
    // Implementation would depend on your specific requirements
    return null;
  }

  async exportUsers(format: string): Promise<string> {
    // Implementation would depend on your specific requirements
    return "";
  }

  async exportPointsHistory(format: string): Promise<string> {
    // Implementation would depend on your specific requirements
    return "";
  }

  async exportAnalytics(format: string): Promise<string> {
    // Implementation would depend on your specific requirements
    return "";
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
      const progress = await db.execute(sql`
        SELECT * FROM user_progress 
        WHERE user_id = ${userId}
      `);
      
      return progress.rows.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        moduleId: p.module_id,
        completed: !!p.completed,
        pointsEarned: p.points_earned,
        completedAt: p.completed_at,
        createdAt: p.created_at
      }));
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  }

  async markLessonComplete(userId: number, moduleId: number): Promise<{ pointsEarned: number; streakBonus: number; newStreak }> {
    // Check if already completed using raw SQL to avoid foreign key issues
    const existingProgress = await db.execute(sql`
      SELECT * FROM user_progress 
      WHERE user_id = ${userId} AND module_id = ${moduleId}
      LIMIT 1
    `);

    if (existingProgress.rows.length > 0 && existingProgress.rows[0].completed) {
      throw new Error('Lesson already completed');
    }

    // Use static points for lesson completion since we're using educationContent.ts
    const pointsEarned = 25; // Standard points for completing a lesson

    // Update streak and get bonus points
    const { newStreak, bonusPoints } = await this.updateUserStreak(userId);

    // Update or create progress record using raw SQL to bypass foreign key constraint
    if (existingProgress.rows.length > 0) {
      await db.execute(sql`
        UPDATE user_progress 
        SET completed = true, points_earned = ${pointsEarned}, completed_at = NOW()
        WHERE user_id = ${userId} AND module_id = ${moduleId}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
        VALUES (${userId}, ${moduleId}, true, ${pointsEarned}, NOW(), NOW())
      `);
    }

    // Update user points (base points only, streak bonus already added in updateUserStreak)
    await db.update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${pointsEarned}`,
        currentMonthPoints: sql`${users.currentMonthPoints} + ${pointsEarned}`,
      })
      .where(eq(users.id, userId));

    // Record points history for lesson completion
    await this.awardPoints(userId, 'lesson_complete', pointsEarned, `Completed lesson: Module ${moduleId}`, { moduleId });

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
    // Get all users' current month points to calculate percentiles
    const allUsers = await db.select({
      currentMonthPoints: users.currentMonthPoints
    }).from(users);

    if (allUsers.length === 0) {
      return { tier1: 0, tier2: 0, tier3: 0 };
    }

    // Sort points in ascending order and filter out zero/null values for better distribution
    const validPoints = allUsers
      .map(u => u.currentMonthPoints || 0)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    // If no valid points exist, use default thresholds
    if (validPoints.length === 0) {
      return { tier1: 0, tier2: 0, tier3: 0 };
    }

    // Calculate percentile thresholds
    const p33Index = Math.floor(validPoints.length * 0.33);
    const p66Index = Math.floor(validPoints.length * 0.66);

    return {
      tier1: 0, // Tier 1 always starts at 0
      tier2: validPoints[p33Index] || 0,
      tier3: validPoints[p66Index] || 0
    };
  }
}

export const storage = new MemStorage();