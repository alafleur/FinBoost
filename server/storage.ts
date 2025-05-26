import { users, type User, type InsertUser, subscribers, type Subscriber, type InsertSubscriber, userPointsHistory, learningModules, userProgress, monthlyRewards, userMonthlyRewards } from "@shared/schema";
import type { UserPointsHistory, MonthlyReward, UserMonthlyReward } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "./db";

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
}

import fs from 'fs/promises';
import path from 'path';
import { POINTS_CONFIG } from "@shared/pointsConfig";

const STORAGE_FILE = 'subscribers.json';

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscribers: Map<number, Subscriber>;
  currentUserId: number;
  currentSubscriberId: number;
  db: any;

  constructor() {
    this.users = new Map();
    this.subscribers = new Map();
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

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUserPoints(userId: number, points: number, action: string, description: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update user points
      await tx.update(users)
        .set({
          totalPoints: sql`total_points + ${points}`,
          currentMonthPoints: sql`current_month_points + ${points}`,
        })
        .where(eq(users.id, userId));

      // Record points history
      await tx.insert(userPointsHistory).values({
        userId,
        points,
        action,
        description,
      });
    });
  }

  async getUserPointsHistory(userId: number): Promise<UserPointsHistory[]> {
    return await db.select()
      .from(userPointsHistory)
      .where(eq(userPointsHistory.userId, userId))
      .orderBy(desc(userPointsHistory.createdAt));
  }

  async updateLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
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
    const [historyEntry] = await db.insert(userPointsHistory).values({
      userId,
      points,
      action: actionId,
      description,
      status: 'approved',
      metadata: metadata ? JSON.stringify(metadata) : null,
    }).returning();

    // Update user points
    const user = await this.getUserById(userId);
    if (user) {
      const newTotalPoints = (user.totalPoints || 0) + points;
      const newCurrentMonthPoints = (user.currentMonthPoints || 0) + points;
      const newTier = await this.calculateUserTier(newCurrentMonthPoints);

      await db.update(users)
        .set({ 
          totalPoints: newTotalPoints, 
          currentMonthPoints: newCurrentMonthPoints,
          tier: newTier
        })
        .where(eq(users.id, userId));
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

    const count = await db.select({ count: sql<number>`count(*)` })
      .from(userPointsHistory)
      .where(
        eq(userPointsHistory.userId, userId) &&
        eq(userPointsHistory.action, actionId) &&
        sql`${userPointsHistory.createdAt} >= ${today}`
      );

    return (count[0]?.count || 0) < actionConfig.maxDaily;
  }

  async checkTotalActionLimit(userId: number, actionId: string): Promise<boolean> {
    const actionConfig = POINTS_CONFIG[actionId];
    if (!actionConfig?.maxTotal) return true;

    const count = await db.select({ count: sql<number>`count(*)` })
      .from(userPointsHistory)
      .where(
        eq(userPointsHistory.userId, userId) &&
        eq(userPointsHistory.action, actionId) &&
        eq(userPointsHistory.status, 'approved')
      );

    return (count[0]?.count || 0) < actionConfig.maxTotal;
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

  async calculateUserTier(currentMonthPoints: number): Promise<string> {
    if (currentMonthPoints >= 500) return 'gold';
    if (currentMonthPoints >= 250) return 'silver';
    return 'bronze';
  }

  async getLeaderboard(period: 'monthly' | 'allTime', limit: number): Promise<Array<{rank: number, userId: number, username: string, points: number, tier: string}>> {
    try {
      const pointsColumn = period === 'monthly' ? 'currentMonthPoints' : 'totalPoints';

      const query = await db.select({
        rank: sql<number>`RANK() OVER (ORDER BY ${pointsColumn} DESC)`,
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
        rank: sql<number>`RANK() OVER (ORDER BY ${pointsColumn} DESC)`,
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

    const goldCount = tierCounts.find(t => t.tier === 'gold')?.count || 0;
    const silverCount = tierCounts.find(t => t.tier === 'silver')?.count || 0;
    const bronzeCount = tierCounts.find(t => t.tier === 'bronze')?.count || 0;

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
        case 'gold':
          rewardAmount = goldRewardPerPerson;
          isWinner = goldRewardPerPerson > 0;
          break;
        case 'silver':
          rewardAmount = silverRewardPerPerson;
          isWinner = silverRewardPerPerson > 0;
          break;
        case 'bronze':
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
}

export const storage = new MemStorage();