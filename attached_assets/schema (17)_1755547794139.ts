// shared/schema.ts
// Minimal Drizzle table defs used by the rewards endpoint.
// Merge with your existing schema if you already have a complete file.

import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const cycleSettings = pgTable("cycle_settings", {
  id: serial("id").primaryKey(),
  cycleName: text("cycle_name"),
  cycleStartDate: timestamp("cycle_start_date"),
  cycleEndDate: timestamp("cycle_end_date"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const cycleWinnerSelections = pgTable("cycle_winner_selections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cycleSettingId: integer("cycle_setting_id").notNull(),
  payoutFinal: integer("payout_final"),
  rewardAmount: integer("reward_amount"),
  payoutStatus: text("payout_status"),
  isSealed: boolean("is_sealed").default(false).notNull(),
  sealedAt: timestamp("sealed_at"),
  selectionDate: timestamp("selection_date"),
  createdAt: timestamp("created_at"),
});

export const payoutBatchItems = pgTable("payout_batch_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id"),
  userId: integer("user_id").notNull(),
  cycleSettingId: integer("cycle_setting_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  reason: text("reason"),
  recipientEmail: text("recipient_email"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at"),
});
