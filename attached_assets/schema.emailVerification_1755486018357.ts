// --- BEGIN: Add to @shared/schema.ts ---
import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

// If not present already, extend users:
export const users = pgTable("users", {
  // ...existing fields
  emailVerified: boolean("email_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
});

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"),
});

export type EmailVerificationToken = InferSelectModel<typeof emailVerificationTokens>;
export type InsertEmailVerificationToken = InferInsertModel<typeof emailVerificationTokens>;
// --- END: Add to @shared/schema.ts ---
