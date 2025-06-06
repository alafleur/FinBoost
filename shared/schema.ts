import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
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
  isAdmin: boolean("is_admin").default(false).notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  currentMonthPoints: integer("current_month_points").default(0).notNull(),
  tier: text("tier").default("bronze").notNull(),
  bio: text("bio"),
  location: text("location"),
  occupation: text("occupation"),
  financialGoals: text("financial_goals"),
  referredBy: text("referred_by"), // Referral code used when signing up
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActivityDate: text("last_activity_date"), // ISO date string

  // Stripe Payment Fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, past_due, canceled
  nextBillingDate: timestamp("next_billing_date"),

  // Stripe Connect Fields for Payouts
  stripeConnectAccountId: text("stripe_connect_account_id"),
  connectOnboardingComplete: boolean("connect_onboarding_complete").default(false),
  payoutEligible: boolean("payout_eligible").default(false),

  // Membership Bonus Tracking
  membershipBonusReceived: boolean("membership_bonus_received").default(false),
  theoreticalPoints: integer("theoretical_points").default(0).notNull(), // Points earned before membership

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
  quiz: text("quiz"), // JSON string containing quiz questions
  pointsReward: integer("points_reward").default(10).notNull(),
  category: text("category").notNull(), // 'debt', 'investing', 'budgeting', etc.
  difficulty: text("difficulty").default("beginner").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(5).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  accessType: text("access_type").default("free").notNull(), // 'free' or 'premium'
  publishedAt: timestamp("published_at"),
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

// Referral System
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrer_user_id").references(() => users.id).notNull(),
  referredUserId: integer("referred_user_id").references(() => users.id).notNull(),
  referralCode: text("referral_code").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'completed', 'expired'
  pointsAwarded: integer("points_awarded").default(0).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Referral Codes
export const userReferralCodes = pgTable("user_referral_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  referralCode: text("referral_code").notNull().unique(),
  totalReferrals: integer("total_referrals").default(0).notNull(),
  totalPointsEarned: integer("total_points_earned").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stripe Payments
export const stripePayments = pgTable("stripe_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  stripeInvoiceId: text("stripe_invoice_id"),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").default("usd").notNull(), // usd, cad
  status: text("status").notNull(), // succeeded, pending, failed
  paymentType: text("payment_type").notNull(), // subscription, one_time
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stripe Payouts (Rewards)
export const stripePayouts = pgTable("stripe_payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripePayoutId: text("stripe_payout_id"),
  stripeTransferId: text("stripe_transfer_id"),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").default("usd").notNull(), // usd, cad
  status: text("status").notNull(), // pending, paid, failed
  reason: text("reason").notNull(), // monthly_reward, bonus, achievement
  pointsUsed: integer("points_used").default(0),
  adminNotes: text("admin_notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reward Distribution Settings
export const rewardDistributionSettings = pgTable("reward_distribution_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Setting name
  value: text("value").notNull(), // Setting value
  description: text("description"), // Setting description
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Admin configurable points actions
export const adminPointsActions = pgTable("admin_points_actions", {
  id: serial("id").primaryKey(),
  actionId: text("action_id").notNull().unique(), // e.g., 'debt_payment', 'investment', etc.
  name: text("name").notNull(),
  basePoints: integer("base_points").notNull(),
  maxDaily: integer("max_daily"),
  maxMonthly: integer("max_monthly"), // Admin configurable monthly limit
  maxTotal: integer("max_total"),
  requiresProof: boolean("requires_proof").default(false).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Monthly reward pool settings controlled by admin
export const monthlyPoolSettings = pgTable("monthly_pool_settings", {
  id: serial("id").primaryKey(),
  cycleName: text("cycle_name").notNull(), // e.g., "January 2025", "February 2025"
  cycleStartDate: timestamp("cycle_start_date").notNull(),
  cycleEndDate: timestamp("cycle_end_date").notNull(),
  rewardPoolPercentage: integer("reward_pool_percentage").notNull(), // Percentage of subscription fee going to rewards (0-100)
  membershipFee: integer("membership_fee").notNull(), // Monthly fee in cents ($20 = 2000)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Admin settings for membership and bonuses
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  settingType: text("setting_type").notNull(), // 'number', 'text', 'boolean'
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'membership', 'rewards', 'features'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const insertRewardDistributionSettingSchema = createInsertSchema(rewardDistributionSettings).pick({
  name: true,
  value: true,
  description: true,
});

export const insertMonthlyPoolSettingSchema = createInsertSchema(monthlyPoolSettings).pick({
  cycleName: true,
  cycleStartDate: true,
  cycleEndDate: true,
  rewardPoolPercentage: true,
  membershipFee: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).pick({
  settingKey: true,
  settingValue: true,
  settingType: true,
  displayName: true,
  description: true,
  category: true,
});

export const insertLearningModuleSchema = createInsertSchema(learningModules).pick({
  title: true,
  description: true,
  content: true,
  quiz: true,
  pointsReward: true,
  category: true,
  difficulty: true,
  estimatedMinutes: true,
  accessType: true,
  order: true,
});

export type RewardDistributionSetting = typeof rewardDistributionSettings.$inferSelect;
export type InsertRewardDistributionSetting = z.infer<typeof insertRewardDistributionSettingSchema>;
export type MonthlyPoolSetting = typeof monthlyPoolSettings.$inferSelect;
export type InsertMonthlyPoolSetting = z.infer<typeof insertMonthlyPoolSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;

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

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Support Requests table
export const supportRequests = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  priority: varchar("priority", { length: 50 }).default("normal"),
  hasAttachment: boolean("has_attachment").default(false),
  fileName: varchar("file_name", { length: 255 }),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at")
});

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = typeof supportRequests.$inferInsert;
export type UserPointsHistory = typeof userPointsHistory.$inferSelect;
export type LearningModule = typeof learningModules.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type MonthlyReward = typeof monthlyRewards.$inferSelect;
export type UserMonthlyReward = typeof userMonthlyRewards.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type UserReferralCode = typeof userReferralCodes.$inferSelect;
export type StripePayment = typeof stripePayments.$inferSelect;
export type StripePayout = typeof stripePayouts.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type AdminPointsAction = typeof adminPointsActions.$inferSelect;