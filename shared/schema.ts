import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  email: true,
});

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

// Enhanced User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").default(true).notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  currentMonthPoints: integer("current_month_points").default(0).notNull(),
  tier: text("tier").default("bronze").notNull(), // bronze, silver, gold
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// User Points History
export const userPointsHistory = pgTable("user_points_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  points: integer("points").notNull(),
  action: text("action").notNull(), // 'lesson_complete', 'quiz_complete', 'debt_payment', 'investment', 'savings_upload', 'referral_signup', 'budget_upload', 'emergency_fund', 'credit_score_improvement', 'financial_goal_achieved'
  description: text("description").notNull(),
  relatedId: integer("related_id"), // Can reference lesson, quiz, or other entity
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected' for proof uploads
  proofUrl: text("proof_url"), // For uploaded evidence
  reviewedBy: integer("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Learning Modules
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  pointsReward: integer("points_reward").default(10).notNull(),
  category: text("category").notNull(), // 'debt', 'investing', 'budgeting', etc.
  difficulty: text("difficulty").default("beginner").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(5).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Progress
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  moduleId: integer("module_id").references(() => learningModules.id).notNull(),
  completed: boolean("completed").default(false).notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Monthly Rewards Tracking
export const monthlyRewards = pgTable("monthly_rewards", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // Format: "2024-01"
  totalRewardPool: integer("total_reward_pool").notNull(),
  totalParticipants: integer("total_participants").notNull(),
  goldTierParticipants: integer("gold_tier_participants").default(0).notNull(),
  silverTierParticipants: integer("silver_tier_participants").default(0).notNull(),
  bronzeTierParticipants: integer("bronze_tier_participants").default(0).notNull(),
  goldRewardPercentage: integer("gold_reward_percentage").default(50).notNull(),
  silverRewardPercentage: integer("silver_reward_percentage").default(30).notNull(),
  bronzeRewardPercentage: integer("bronze_reward_percentage").default(20).notNull(),
  pointDeductionPercentage: integer("point_deduction_percentage").default(75).notNull(), // How much of winner's points are deducted
  status: text("status").default("pending").notNull(), // 'pending', 'distributed', 'cancelled'
  distributedAt: timestamp("distributed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Monthly Rewards History
export const userMonthlyRewards = pgTable("user_monthly_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  monthlyRewardId: integer("monthly_reward_id").references(() => monthlyRewards.id).notNull(),
  tier: text("tier").notNull(), // 'bronze', 'silver', 'gold'
  pointsAtDistribution: integer("points_at_distribution").notNull(),
  rewardAmount: integer("reward_amount").default(0).notNull(), // In cents
  pointsDeducted: integer("points_deducted").default(0).notNull(),
  pointsRolledOver: integer("points_rolled_over").notNull(),
  isWinner: boolean("is_winner").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPointsHistory = typeof userPointsHistory.$inferSelect;
export type LearningModule = typeof learningModules.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type MonthlyReward = typeof monthlyRewards.$inferSelect;
export type UserMonthlyReward = typeof userMonthlyRewards.$inferSelect;
