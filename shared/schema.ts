import { pgTable, text, serial, integer, boolean, timestamp, varchar, unique } from "drizzle-orm/pg-core";
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
  lastStreakBonusDate: text("last_streak_bonus_date"), // ISO date string (YYYY-MM-DD) for tracking daily streak bonus

  // Stripe Payment Fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, past_due, canceled
  subscriptionAmount: integer("subscription_amount").default(2000), // Amount in cents (e.g., 2000 = $20.00)
  subscriptionCurrency: text("subscription_currency").default("usd"),
  subscriptionPaymentMethod: text("subscription_payment_method"), // card, paypal, etc.
  subscriptionStartDate: timestamp("subscription_start_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  nextBillingDate: timestamp("next_billing_date"),
  lastPaymentAmount: integer("last_payment_amount"),
  lastPaymentStatus: text("last_payment_status"), // succeeded, failed, pending

  // Stripe Connect Fields for Payouts
  stripeConnectAccountId: text("stripe_connect_account_id"),
  connectOnboardingComplete: boolean("connect_onboarding_complete").default(false),
  payoutEligible: boolean("payout_eligible").default(false),

  // Membership Bonus Tracking
  membershipBonusReceived: boolean("membership_bonus_received").default(false),
  theoreticalPoints: integer("theoretical_points").default(0).notNull(), // Points earned before membership

  // PayPal Disbursement Information
  paypalEmail: text("paypal_email"), // PayPal email for receiving payouts
  payoutMethod: text("payout_method").default("paypal"), // paypal, stripe, bank_transfer

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

// PayPal Payouts (Rewards)
export const paypalPayouts = pgTable("paypal_payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  paypalPayoutId: text("paypal_payout_id"), // PayPal batch payout ID
  paypalItemId: text("paypal_item_id"), // Individual payout item ID
  recipientEmail: text("recipient_email").notNull(), // PayPal email to send money to
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").default("usd").notNull(), // usd, cad
  status: text("status").notNull(), // pending, processing, success, failed, unclaimed
  reason: text("reason").notNull(), // monthly_reward, bonus, achievement
  tier: text("tier"), // bronze, silver, gold
  pointsUsed: integer("points_used").default(0),
  adminNotes: text("admin_notes"),
  processedAt: timestamp("processed_at"),
  paypalResponse: text("paypal_response"), // JSON response from PayPal
  cycleName: text("cycle_name"), // Name of the winner selection cycle
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

// Historical table kept for data integrity - use cycleSettings for new cycles

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

// Removed - use cycle-based schemas instead

// New Cycle-Based Tables (Phase 1: Add alongside existing monthly tables)

// Flexible Cycle Settings - replaces monthlyPoolSettings with full flexibility
export const cycleSettings = pgTable("cycle_settings", {
  id: serial("id").primaryKey(),
  cycleName: text("cycle_name").notNull(), // e.g., "Weekly Cycle 1", "Bi-weekly Jan 1-14"
  cycleType: text("cycle_type").notNull(), // "weekly", "bi-weekly", "monthly", "custom"
  cycleStartDate: timestamp("cycle_start_date").notNull(),
  cycleEndDate: timestamp("cycle_end_date").notNull(),
  
  // Payment Period Configuration
  paymentPeriodDays: integer("payment_period_days").notNull(), // 7, 14, 30, custom
  membershipFee: integer("membership_fee").notNull(), // Fee for the payment period in cents
  
  // Reward Pool Configuration
  rewardPoolPercentage: integer("reward_pool_percentage").notNull(), // 0-100
  minimumPoolGuarantee: integer("minimum_pool_guarantee").default(0).notNull(), // Minimum guaranteed pool in cents
  
  // Tier Distribution (admin configurable percentiles)
  tier1Threshold: integer("tier1_threshold").default(33).notNull(), // Top X% (e.g., 33 = top 33%)
  tier2Threshold: integer("tier2_threshold").default(67).notNull(), // Up to X% (e.g., 67 = top 67%, so middle 34%)
  // tier3 is everyone else (100% - tier2Threshold = bottom 33%)
  
  // Pool Distribution Among Tiers
  tier1PoolPercentage: integer("tier1_pool_percentage").default(50).notNull(),
  tier2PoolPercentage: integer("tier2_pool_percentage").default(35).notNull(),
  tier3PoolPercentage: integer("tier3_pool_percentage").default(15).notNull(),
  
  // Winner Selection Configuration
  selectionPercentage: integer("selection_percentage").default(50).notNull(), // % of each tier that wins
  
  // Point Deduction for Winners (admin configurable)
  winnerPointDeductionPercentage: integer("winner_point_deduction_percentage").default(80).notNull(),
  
  // Mid-cycle joining threshold
  midCycleJoinThresholdDays: integer("mid_cycle_join_threshold_days").default(3).notNull(),
  
  // Cycle Status and Completion
  status: text("status").default("active").notNull(), // "active", "completed", "archived"
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),
  
  // Winner Selection Completion Tracking (CRITICAL for persistence fix)
  selectionExecuted: boolean("selection_executed").default(false).notNull(),
  selectionSealed: boolean("selection_sealed").default(false).notNull(),
  totalWinners: integer("total_winners").default(0).notNull(),
  totalRewardPool: integer("total_reward_pool").default(0).notNull(), // In cents
  selectionExecutedAt: timestamp("selection_executed_at"),
  selectionSealedAt: timestamp("selection_sealed_at"),
  selectionSealedBy: integer("selection_sealed_by").references(() => users.id), // Admin who sealed the entire cycle
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// User Cycle Points - tracks points per cycle instead of monthly
export const userCyclePoints = pgTable("user_cycle_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cycleSettingId: integer("cycle_setting_id").references(() => cycleSettings.id).notNull(),
  currentCyclePoints: integer("current_cycle_points").default(0).notNull(),
  theoreticalPoints: integer("theoretical_points").default(0).notNull(), // For non-premium users
  tier: text("tier").default("tier3").notNull(), // tier1, tier2, tier3
  joinedCycleAt: timestamp("joined_cycle_at").defaultNow().notNull(),
  lastActivityDate: timestamp("last_activity_date"),
  pointsRolledOver: integer("points_rolled_over").default(0).notNull(), // From previous cycle
  isActive: boolean("is_active").default(true).notNull(),
});

// Cycle Winner Selections - replaces winnerSelectionCycles
export const cycleWinnerSelections = pgTable("cycle_winner_selections", {
  id: serial("id").primaryKey(),
  cycleSettingId: integer("cycle_setting_id").references(() => cycleSettings.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tier: text("tier").notNull(), // tier1, tier2, tier3
  overallRank: integer("overall_rank").notNull(), // Position across all tiers
  tierRank: integer("tier_rank").notNull(), // Position within tier
  pointsAtSelection: integer("points_at_selection").notNull(),
  tierSizeAmount: integer("tier_size_amount").notNull(), // Total pool for this tier in cents
  payoutPercentage: integer("payout_percentage").default(0).notNull(), // Admin input % as decimal * 10000 (e.g., 1500 = 15%)
  payoutCalculated: integer("payout_calculated").default(0).notNull(), // tier_size × payout_percentage in cents
  payoutOverride: integer("payout_override"), // Admin override amount in cents (nullable)
  payoutFinal: integer("payout_final").default(0).notNull(), // Final payout amount in cents
  rewardAmount: integer("reward_amount").notNull(), // In cents (legacy field, keeping for compatibility)
  pointsDeducted: integer("points_deducted").notNull(),
  pointsRolledOver: integer("points_rolled_over").notNull(),
  // PHASE 2 STEP 5: Enhanced Winner State Machine
  payoutStatus: text("payout_status").default("draft").notNull(), // Comprehensive state tracking
  lastModified: timestamp("last_modified").defaultNow().notNull(), // When payout data was last updated
  selectionDate: timestamp("selection_date").defaultNow().notNull(),
  
  // STEP 5: State machine tracking fields
  stateTransitions: text("state_transitions"), // JSON array of state changes with timestamps
  processingAttempts: integer("processing_attempts").default(0).notNull(), // Number of disbursement attempts
  lastProcessingAttempt: timestamp("last_processing_attempt"), // When last disbursement was attempted
  paypalBatchId: text("paypal_batch_id"), // Associated PayPal batch ID for tracking
  paypalItemId: text("paypal_item_id"), // Individual PayPal item ID for tracking
  failureReason: text("failure_reason"), // Detailed failure reason if status is failed
  adminNotes: text("admin_notes"), // Admin comments for manual intervention cases
  
  // Phase 2A: Enhanced Save/Seal Workflow Fields (Issue #2 Resolution)
  isSealed: boolean("is_sealed").default(false).notNull(), // Individual winner record seal status
  sealedAt: timestamp("sealed_at"), // When this specific winner was sealed
  sealedBy: integer("sealed_by").references(() => users.id), // Admin who sealed this winner
  savedAt: timestamp("saved_at").defaultNow().notNull(), // When selection was initially saved
  savedBy: integer("saved_by").references(() => users.id).notNull(), // Admin who executed the selection
  
  // Winner Notification Fields (for UI celebration banners)
  notificationDisplayed: boolean("notification_displayed").default(false).notNull(), // Whether user has seen winner notification
});

// Cycle Point History - enhanced version of userPointsHistory with cycle tracking
export const cyclePointHistory = pgTable("cycle_point_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cycleSettingId: integer("cycle_setting_id").references(() => cycleSettings.id).notNull(),
  points: integer("points").notNull(),
  action: text("action").notNull(), // Same actions as userPointsHistory
  description: text("description").notNull(),
  relatedId: integer("related_id"), // Reference to lesson, quiz, etc.
  status: text("status").default("approved").notNull(), // pending, approved, rejected
  proofUrl: text("proof_url"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin-configurable point actions with cycle limits instead of monthly
export const cyclePointsActions = pgTable("cycle_points_actions", {
  id: serial("id").primaryKey(),
  actionId: text("action_id").notNull().unique(),
  name: text("name").notNull(),
  basePoints: integer("base_points").notNull(),
  maxDaily: integer("max_daily"),
  maxPerCycle: integer("max_per_cycle"), // Replaces maxMonthly with cycle-based limit
  maxTotal: integer("max_total"),
  requiresProof: boolean("requires_proof").default(false).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Payout Batches - Idempotent batch intent records for PayPal disbursements
export const payoutBatches = pgTable("payout_batches", {
  id: serial("id").primaryKey(),
  cycleSettingId: integer("cycle_setting_id").references(() => cycleSettings.id).notNull(),
  senderBatchId: text("sender_batch_id").notNull().unique(), // Deterministic: cycle-{cycleId}-{checksum}-attempt-{n}
  requestChecksum: text("request_checksum").notNull(), // Hash of sorted winnerIds + amounts + emails for idempotency
  attempt: integer("attempt").default(1).notNull(), // CHATGPT: Attempt number for retries (1, 2, 3, ...)
  status: text("status").default("intent").notNull(), // intent, processing, completed, failed, partially_completed, cancelled
  adminId: integer("admin_id").references(() => users.id).notNull(), // Admin who initiated the payout
  paypalBatchId: text("paypal_batch_id"), // Returned from PayPal API after successful batch creation
  totalAmount: integer("total_amount").notNull(), // Total amount being paid out in cents
  totalRecipients: integer("total_recipients").notNull(), // Number of recipients in this batch
  successfulCount: integer("successful_count").default(0).notNull(), // Number of successful payouts
  failedCount: integer("failed_count").default(0).notNull(), // Number of failed payouts
  pendingCount: integer("pending_count").default(0).notNull(), // Number of pending/unclaimed payouts
  errorDetails: text("error_details"), // JSON string for batch-level errors
  // STEP 6: Retry tracking fields
  retryCount: integer("retry_count").default(0).notNull(), // Number of retry attempts made
  lastRetryAt: timestamp("last_retry_at"), // Timestamp of last retry attempt
  lastRetryError: text("last_retry_error"), // Details of last retry error
  supersededById: integer("superseded_by_id"), // PHASE 2 FIX: Remove circular reference for now
  // STEP 6: Chunking support fields
  isChunked: boolean("is_chunked").default(false).notNull(), // Whether this batch was processed in chunks
  totalChunks: integer("total_chunks").default(1).notNull(), // Total number of chunks for this batch
  completedChunks: integer("completed_chunks").default(0).notNull(), // Number of completed chunks
  chunkSize: integer("chunk_size").default(500).notNull(), // Number of recipients per chunk
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // CHATGPT: Change uniqueness from (cycle_id, request_checksum) to include attempt
  uniqueAttempt: unique("payout_batches_cycle_checksum_attempt_unique").on(table.cycleSettingId, table.requestChecksum, table.attempt),
}));

// STEP 6: Payout Batch Chunks - Individual chunk processing within a batch
export const payoutBatchChunks = pgTable("payout_batch_chunks", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => payoutBatches.id).notNull(),
  chunkNumber: integer("chunk_number").notNull(), // 1, 2, 3, etc.
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed, cancelled
  paypalBatchId: text("paypal_batch_id"), // Individual PayPal batch ID for this chunk
  senderBatchId: text("sender_batch_id").notNull(), // chunk-specific sender batch ID
  startIndex: integer("start_index").notNull(), // Starting recipient index in the full batch
  endIndex: integer("end_index").notNull(), // Ending recipient index in the full batch
  recipientCount: integer("recipient_count").notNull(), // Number of recipients in this chunk
  totalAmount: integer("total_amount").notNull(), // Total amount for this chunk in cents
  successfulCount: integer("successful_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  pendingCount: integer("pending_count").default(0).notNull(),
  processingStartedAt: timestamp("processing_started_at"), // When chunk processing began
  processingCompletedAt: timestamp("processing_completed_at"), // When chunk processing finished
  errorDetails: text("error_details"), // JSON string for chunk-specific errors
  retryCount: integer("retry_count").default(0).notNull(), // Retry attempts for this chunk
  lastRetryAt: timestamp("last_retry_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one chunk number per batch
  uniqueChunk: unique("payout_batch_chunks_batch_chunk_unique").on(table.batchId, table.chunkNumber),
}));

// Payout Batch Items - Individual payout records within a batch for reconciliation
export const payoutBatchItems = pgTable("payout_batch_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => payoutBatches.id).notNull(),
  chunkId: integer("chunk_id").references(() => payoutBatchChunks.id), // STEP 6: Link to chunk
  cycleWinnerSelectionId: integer("cycle_winner_selection_id").references(() => cycleWinnerSelections.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  paypalEmail: text("paypal_email").notNull(), // PayPal email used for this payout
  amount: integer("amount").notNull(), // Payout amount in cents
  currency: text("currency").default("USD").notNull(), // Currency code
  paypalItemId: text("paypal_item_id"), // PayPal payout_item_id for tracking
  status: text("status").default("pending").notNull(), // pending, processing, success, failed, unclaimed
  paypalStatus: text("paypal_status"), // Raw PayPal status (SUCCESS, FAILED, PENDING, UNCLAIMED, etc.)
  errorCode: text("error_code"), // PayPal error code if failed
  errorMessage: text("error_message"), // Human-readable error description
  note: text("note"), // Message sent with payout
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"), // When PayPal processed this item
});

// Winner Selection Cycles
export const winnerSelectionCycles = pgTable("winner_selection_cycles", {
  id: serial("id").primaryKey(),
  cycleName: text("cycle_name").notNull(), // e.g., "January 2025", "Custom Cycle 1"
  cycleStartDate: timestamp("cycle_start_date").notNull(),
  cycleEndDate: timestamp("cycle_end_date").notNull(),
  poolSettings: text("pool_settings"), // JSON: tier thresholds, selection percentages, allocations
  tier1Threshold: integer("tier1_threshold").default(33), // Top X% (default 33%)
  tier2Threshold: integer("tier2_threshold").default(67), // Top X% (default 67%, so tier2 is 33-67%)
  selectionPercentage: integer("selection_percentage").default(50), // % of each tier to select (default 50%)
  selectionCompleted: boolean("selection_completed").default(false).notNull(),
  disbursementCompleted: boolean("disbursement_completed").default(false).notNull(),
  totalPoolAmount: integer("total_pool_amount").default(0), // Total amount available for disbursement in cents
  totalRewardPool: integer("total_reward_pool").default(0), // Calculated from pool settings
  tier1Pool: integer("tier1_pool").default(0), // 50% of total reward pool
  tier2Pool: integer("tier2_pool").default(0), // 35% of total reward pool
  tier3Pool: integer("tier3_pool").default(0), // 15% of total reward pool
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
});

// Winner Selections - stores the random selections and rankings for each cycle
export const winnerSelections = pgTable("winner_selections", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").references(() => winnerSelectionCycles.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tier: text("tier").notNull(), // tier1, tier2, tier3
  tierRank: integer("tier_rank").notNull(), // 1, 2, 3, ... up to 50% of tier size
  rewardPercentage: integer("reward_percentage").default(0), // Percentage of tier pool (0-100)
  rewardAmount: integer("reward_amount").default(0), // Calculated amount in cents
  paypalEmail: text("paypal_email"), // User's PayPal email at time of selection
  disbursed: boolean("disbursed").default(false).notNull(),
  disbursementId: text("disbursement_id"), // PayPal payout batch ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Winner Allocation Templates - for CSV import/export
export const winnerAllocationTemplates = pgTable("winner_allocation_templates", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull(),
  tier: text("tier").notNull(), // tier1, tier2, tier3
  tierRank: integer("tier_rank").notNull(),
  rewardPercentage: integer("reward_percentage").notNull(), // Default percentage for this rank
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertWinnerSelectionCycleSchema = createInsertSchema(winnerSelectionCycles).pick({
  cycleName: true,
  cycleStartDate: true,
  cycleEndDate: true,
  poolSettings: true,
  totalPoolAmount: true,
});

export const insertWinnerSelectionSchema = createInsertSchema(winnerSelections).pick({
  cycleId: true,
  userId: true,
  tier: true,
  tierRank: true,
  rewardPercentage: true,
  rewardAmount: true,
  paypalEmail: true,
});

export const insertWinnerAllocationTemplateSchema = createInsertSchema(winnerAllocationTemplates).pick({
  templateName: true,
  tier: true,
  tierRank: true,
  rewardPercentage: true,
  description: true,
  isDefault: true,
});

// Payout Batch insert schemas (CHATGPT: Added attempt field for retry-safe batches)
export const insertPayoutBatchSchema = createInsertSchema(payoutBatches).pick({
  cycleSettingId: true,
  senderBatchId: true,
  requestChecksum: true,
  attempt: true, // CHATGPT: Include attempt field for retry tracking
  totalAmount: true,
  totalRecipients: true,
  adminId: true,
  isChunked: true, // STEP 6: Chunking support
  totalChunks: true,
  chunkSize: true,
});

// STEP 6: Chunking schema
export const insertPayoutBatchChunkSchema = createInsertSchema(payoutBatchChunks).pick({
  batchId: true,
  chunkNumber: true,
  senderBatchId: true,
  startIndex: true,
  endIndex: true,
  recipientCount: true,
  totalAmount: true,
});

export const insertPayoutBatchItemSchema = createInsertSchema(payoutBatchItems).pick({
  batchId: true,
  chunkId: true, // STEP 6: Link to chunk
  cycleWinnerSelectionId: true,
  userId: true,
  paypalEmail: true,
  amount: true,
  currency: true,
  note: true,
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
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;

// STEP 6: Chunking types
export type PayoutBatchChunk = typeof payoutBatchChunks.$inferSelect;
export type InsertPayoutBatchChunk = z.infer<typeof insertPayoutBatchChunkSchema>;
export type InsertPayoutBatch = z.infer<typeof insertPayoutBatchSchema>;
export type InsertPayoutBatchItem = z.infer<typeof insertPayoutBatchItemSchema>;

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
export type PaypalPayout = typeof paypalPayouts.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type AdminPointsAction = typeof adminPointsActions.$inferSelect;
export type PayoutBatch = typeof payoutBatches.$inferSelect;
export type PayoutBatchItem = typeof payoutBatchItems.$inferSelect;

// Insert schemas for new cycle-based tables
export const insertCycleSettingSchema = createInsertSchema(cycleSettings).pick({
  cycleName: true,
  cycleType: true,
  cycleStartDate: true,
  cycleEndDate: true,
  paymentPeriodDays: true,
  membershipFee: true,
  rewardPoolPercentage: true,
  minimumPoolGuarantee: true,
  tier1Threshold: true,
  tier2Threshold: true,
  tier1PoolPercentage: true,
  tier2PoolPercentage: true,
  tier3PoolPercentage: true,
  selectionPercentage: true,
  winnerPointDeductionPercentage: true,
  midCycleJoinThresholdDays: true,
});

export const insertUserCyclePointsSchema = createInsertSchema(userCyclePoints).pick({
  userId: true,
  cycleSettingId: true,
  currentCyclePoints: true,
  theoreticalPoints: true,
  tier: true,
  pointsRolledOver: true,
});

export const insertCycleWinnerSelectionSchema = createInsertSchema(cycleWinnerSelections).pick({
  cycleSettingId: true,
  userId: true,
  tier: true,
  tierRank: true,
  pointsAtSelection: true,
  rewardAmount: true,
  pointsDeducted: true,
  pointsRolledOver: true,
});

export const insertCyclePointHistorySchema = createInsertSchema(cyclePointHistory).pick({
  userId: true,
  cycleSettingId: true,
  points: true,
  action: true,
  description: true,
  relatedId: true,
  status: true,
  proofUrl: true,
  metadata: true,
});

export const insertCyclePointsActionSchema = createInsertSchema(cyclePointsActions).pick({
  actionId: true,
  name: true,
  basePoints: true,
  maxDaily: true,
  maxPerCycle: true,
  maxTotal: true,
  requiresProof: true,
  category: true,
  description: true,
});

// Types for new cycle-based tables
export type InsertCycleSetting = z.infer<typeof insertCycleSettingSchema>;
export type CycleSetting = typeof cycleSettings.$inferSelect;

export type InsertUserCyclePoints = z.infer<typeof insertUserCyclePointsSchema>;
export type UserCyclePoints = typeof userCyclePoints.$inferSelect;

export type InsertCycleWinnerSelection = z.infer<typeof insertCycleWinnerSelectionSchema>;
export type CycleWinnerSelection = typeof cycleWinnerSelections.$inferSelect;

export type InsertCyclePointHistory = z.infer<typeof insertCyclePointHistorySchema>;
export type CyclePointHistory = typeof cyclePointHistory.$inferSelect;

export type InsertCyclePointsAction = z.infer<typeof insertCyclePointsActionSchema>;
export type CyclePointsAction = typeof cyclePointsActions.$inferSelect;

// ========================================
// PREDICTION SYSTEM TABLES (Phase 1)
// ========================================

// Prediction Questions - Mid-cycle engagement questions
export const predictionQuestions = pgTable("prediction_questions", {
  id: serial("id").primaryKey(),
  cycleSettingId: integer("cycle_setting_id").references(() => cycleSettings.id).notNull(),
  questionText: text("question_text").notNull(),
  options: text("options").notNull(), // JSON array of choice options
  submissionDeadline: timestamp("submission_deadline").notNull(),
  resultDeterminationTime: timestamp("result_determination_time").notNull(),
  
  // Status and Results
  status: text("status").default("draft").notNull(), // "draft", "active", "closed", "completed"
  correctAnswerIndex: integer("correct_answer_index"), // Index of correct option (set by admin)
  pointAwards: text("point_awards"), // JSON array of points for each option
  
  // Historical tracking
  totalSubmissions: integer("total_submissions").default(0).notNull(),
  resultsPublished: boolean("results_published").default(false).notNull(),
  pointsDistributed: boolean("points_distributed").default(false).notNull(),
  
  // Admin tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  publishedAt: timestamp("published_at"),
  closedAt: timestamp("closed_at"),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),
});

// User Predictions - Individual user answers
export const userPredictions = pgTable("user_predictions", {
  id: serial("id").primaryKey(),
  predictionQuestionId: integer("prediction_question_id").references(() => predictionQuestions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  selectedOptionIndex: integer("selected_option_index").notNull(),
  pointsAwarded: integer("points_awarded").default(0).notNull(),
  
  // Tracking
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
  pointsDistributedAt: timestamp("points_distributed_at"),
});

// Prediction Results - Historical archive of question outcomes
export const predictionResults = pgTable("prediction_results", {
  id: serial("id").primaryKey(),
  predictionQuestionId: integer("prediction_question_id").references(() => predictionQuestions.id).notNull(),
  
  // Final Results
  correctAnswerIndex: integer("correct_answer_index").notNull(),
  totalParticipants: integer("total_participants").notNull(),
  optionStats: text("option_stats").notNull(), // JSON: submissions per option with percentages
  
  // Point Distribution Summary
  totalPointsAwarded: integer("total_points_awarded").notNull(),
  pointsPerOption: text("points_per_option").notNull(), // JSON: points awarded per option
  
  // Admin tracking
  determinedAt: timestamp("determined_at").defaultNow().notNull(),
  determinedBy: integer("determined_by").references(() => users.id).notNull(),
  pointsDistributedAt: timestamp("points_distributed_at"),
  notes: text("notes"), // Admin notes about the determination
});

// Insert schemas for prediction system
export const insertPredictionQuestionSchema = createInsertSchema(predictionQuestions).pick({
  cycleSettingId: true,
  questionText: true,
  options: true,
  submissionDeadline: true,
  resultDeterminationTime: true,
});

export const insertUserPredictionSchema = createInsertSchema(userPredictions).pick({
  predictionQuestionId: true,
  userId: true,
  selectedOptionIndex: true,
});

export const insertPredictionResultSchema = createInsertSchema(predictionResults).pick({
  predictionQuestionId: true,
  correctAnswerIndex: true,
  totalParticipants: true,
  optionStats: true,
  totalPointsAwarded: true,
  pointsPerOption: true,
  notes: true,
});

// Types for prediction system
export type InsertPredictionQuestion = z.infer<typeof insertPredictionQuestionSchema>;
export type PredictionQuestion = typeof predictionQuestions.$inferSelect;

export type InsertUserPrediction = z.infer<typeof insertUserPredictionSchema>;
export type UserPrediction = typeof userPredictions.$inferSelect;

export type InsertPredictionResult = z.infer<typeof insertPredictionResultSchema>;
export type PredictionResult = typeof predictionResults.$inferSelect;