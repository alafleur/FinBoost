
// --- BEGIN: Add to @shared/schema.ts ---
import { pgTable, serial, timestamp, text, varchar, boolean, jsonb } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const emailEvents = pgTable('email_events', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 64 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  messageId: varchar('message_id', { length: 128 }),
  stream: varchar('stream', { length: 64 }),
  payload: jsonb('payload').notNull(),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
});

export const emailSuppressions = pgTable('email_suppressions', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  reason: varchar('reason', { length: 64 }).notNull(),
  source: varchar('source', { length: 64 }).notNull().default('postmark'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastEventAt: timestamp('last_event_at'),
});

export type EmailEvent = InferSelectModel<typeof emailEvents>;
export type InsertEmailEvent = InferInsertModel<typeof emailEvents>;
export type EmailSuppression = InferSelectModel<typeof emailSuppressions>;
export type InsertEmailSuppression = InferInsertModel<typeof emailSuppressions>;
// --- END: Add to @shared/schema.ts ---
