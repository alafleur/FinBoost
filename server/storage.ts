import { users, type User, type InsertUser, subscribers, type Subscriber, type InsertSubscriber, userPointsHistory, learningModules, userProgress, } from "@shared/schema";
import type { UserPointsHistory } from "@shared/schema";
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
    return await db.select()
      .from(userPointsHistory)
      .where(eq(userPointsHistory.status, 'pending'))
      .orderBy(desc(userPointsHistory.createdAt));
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
}

export const storage = new MemStorage();