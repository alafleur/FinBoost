import { db } from "./db";
import { users, cycleSettings, learningModules, userProgress } from "@shared/schema";
import { sql, eq, and, gte, desc, count } from "drizzle-orm";

/**
 * Simplified Analytics Storage Methods
 * These methods use only confirmed database tables and avoid undefined references
 */
export class AnalyticsStorage {
  
  // Basic KPI Overview Methods
  async getTotalUsersCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(users);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total users count:', error);
      return 0;
    }
  }

  async getActiveSubscribersCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.subscriptionStatus, 'active'));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting active subscribers count:', error);
      return 0;
    }
  }

  async getCurrentCycleParticipants(): Promise<number> {
    try {
      const activeCycle = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.isActive, true))
        .limit(1);

      if (!activeCycle.length) return 0;

      const result = await db
        .select({ count: count() })
        .from(userCycleEnrollments)
        .where(eq(userCycleEnrollments.cycleSettingId, activeCycle[0].id));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting current cycle participants:', error);
      return 0;
    }
  }

  async getCurrentCycleRewardPool(): Promise<number> {
    try {
      const activeCycle = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.isActive, true))
        .limit(1);

      if (!activeCycle.length) return 0;

      const participants = await this.getCurrentCycleParticipants();
      const membershipFee = activeCycle[0].membershipFee || 2000; // Default $20 in cents
      const rewardPoolPercentage = activeCycle[0].rewardPoolPercentage || 55; // Default 55%
      
      const totalRevenue = participants * membershipFee;
      const rewardPool = Math.floor(totalRevenue * (rewardPoolPercentage / 100));
      
      return rewardPool;
    } catch (error) {
      console.error('Error calculating current cycle reward pool:', error);
      return 0;
    }
  }

  // Activity and Performance Methods
  async getRecentUserRegistrations(limit: number = 10): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          joinedAt: users.joinedAt,
          subscriptionStatus: users.subscriptionStatus
        })
        .from(users)
        .orderBy(desc(users.joinedAt))
        .limit(limit);
      
      return result;
    } catch (error) {
      console.error('Error getting recent user registrations:', error);
      return [];
    }
  }

  async getRecentLessonCompletions(limit: number = 10): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: userProgress.id,
          userId: userProgress.userId,
          moduleId: userProgress.moduleId,
          completedAt: userProgress.completedAt,
          pointsEarned: userProgress.pointsEarned
        })
        .from(userProgress)
        .where(eq(userProgress.completed, true))
        .orderBy(desc(userProgress.completedAt))
        .limit(limit);
      
      return result;
    } catch (error) {
      console.error('Error getting recent lesson completions:', error);
      return [];
    }
  }

  async getTotalLearningModules(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(learningModules);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total learning modules:', error);
      return 0;
    }
  }

  async getTotalCompletedLessons(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(userProgress)
        .where(eq(userProgress.completed, true));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total completed lessons:', error);
      return 0;
    }
  }

  // Simple analytics aggregation
  async getKPIOverview(): Promise<any> {
    try {
      const [
        totalUsers,
        activeSubscribers,
        cycleParticipants,
        rewardPool,
        totalModules,
        completedLessons
      ] = await Promise.all([
        this.getTotalUsersCount(),
        this.getActiveSubscribersCount(),
        this.getCurrentCycleParticipants(),
        this.getCurrentCycleRewardPool(),
        this.getTotalLearningModules(),
        this.getTotalCompletedLessons()
      ]);

      return {
        totalUsers,
        activeSubscribers,
        cycleParticipants,
        rewardPool: rewardPool / 100, // Convert cents to dollars
        totalModules,
        completedLessons,
        averageCompletionRate: totalUsers > 0 ? Math.round((completedLessons / (totalUsers * totalModules)) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting KPI overview:', error);
      return {
        totalUsers: 0,
        activeSubscribers: 0,
        cycleParticipants: 0,
        rewardPool: 0,
        totalModules: 0,
        completedLessons: 0,
        averageCompletionRate: 0
      };
    }
  }

  async getRecentActivity(limit: number = 20): Promise<any[]> {
    try {
      // Get recent registrations
      const recentRegistrations = await db
        .select({
          type: sql<string>`'registration'`,
          userId: users.id,
          username: users.username,
          activity: sql<string>`'User registered'`,
          timestamp: users.joinedAt
        })
        .from(users)
        .orderBy(desc(users.joinedAt))
        .limit(limit / 2);

      // Get recent lesson completions
      const recentCompletions = await db
        .select({
          type: sql<string>`'lesson_completion'`,
          userId: userProgress.userId,
          activity: sql<string>`'Completed lesson'`,
          timestamp: userProgress.completedAt
        })
        .from(userProgress)
        .where(and(
          eq(userProgress.completed, true),
          sql`${userProgress.completedAt} IS NOT NULL`
        ))
        .orderBy(desc(userProgress.completedAt))
        .limit(limit / 2);

      // Combine and sort by timestamp
      const allActivities = [...recentRegistrations, ...recentCompletions]
        .filter(activity => activity.timestamp !== null)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
        .slice(0, limit);

      return allActivities;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }
}

export const analyticsStorage = new AnalyticsStorage();