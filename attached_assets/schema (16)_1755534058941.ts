// shared/schema.ts
// Minimal exports to support the consolidated rewards endpoint.
// If your project already has a full schema file, either merge these into it
// or re-export your existing table objects with these names.

import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

// --- Users (subset) ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  paypalEmail: text("paypal_email"),
  payoutMethod: text("payout_method"),
});

// --- Cycle Settings ---
export const cycleSettings = pgTable("cycle_settings", {
  id: serial("id").primaryKey(),
  cycleName: text("cycle_name"),
  cycleStartDate: timestamp("cycle_start_date"),
  cycleEndDate: timestamp("cycle_end_date"),
  rewardPoolPercentage: integer("reward_pool_percentage"), // cents basis points or percentage as stored in your DB
  minimumPoolGuarantee: integer("minimum_pool_guarantee"),  // cents
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
});

// --- Winners (finalized selections) ---
export const cycleWinnerSelections = pgTable("cycle_winner_selections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cycleSettingId: integer("cycle_setting_id").notNull(),
  tier: text("tier"),
  pointsAtSelection: integer("points_at_selection"),
  rewardAmount: integer("reward_amount").notNull(),    // in cents (legacy field / calculated)
  payoutFinal: integer("payout_final").default(0).notNull(), // final amount in cents
  payoutStatus: text("payout_status").default("draft").notNull(), // draft|pending|earned|paid|failed|...
  payoutOverride: integer("payout_override"),
  payoutCalculated: integer("payout_calculated"),
  isSealed: boolean("is_sealed").default(false).notNull(),
  sealedAt: timestamp("sealed_at"),
  selectionDate: timestamp("selection_date").notNull(),
  createdAt: timestamp("created_at").notNull()
});

// --- Payout batch items (per-winner disbursement entries) ---
export const payoutBatchItems = pgTable("payout_batch_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id"),
  userId: integer("user_id").notNull(),
  cycleSettingId: integer("cycle_setting_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),            // success|failed|pending|unclaimed
  reason: text("reason"),
  recipientEmail: text("recipient_email"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull()
});

export type User = typeof users.$inferSelect;
export type CycleSetting = typeof cycleSettings.$inferSelect;
export type CycleWinnerSelection = typeof cycleWinnerSelections.$inferSelect;
export type PayoutBatchItem = typeof payoutBatchItems.$inferSelect;
