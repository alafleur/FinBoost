import { db } from '../../db.js';
import { eq, like, desc } from 'drizzle-orm';
import { emailEvents, emailSuppressions } from '@shared/schema';

/** Normalize email for storage/lookup (lowercase, trim). */
export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export async function recordEmailEvent(payload: any) {
  const type = String(payload.RecordType || payload.Type || 'Unknown');
  const email = normalizeEmail(payload.Recipient || payload.Email || payload.EmailAddress || '');
  const messageId = String(payload.MessageID || payload.MessageId || '');
  const stream = String(payload.MessageStream || '');

  // Deterministic hash for idempotency
  const crypto = await import('crypto');
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

  try {
    await db.insert(emailEvents).values({ type, email, messageId, stream, payload, payloadHash });
  } catch (error: any) {
    // 23505 = unique violation -> duplicate webhook event
    if (error?.code === '23505') {
      console.log(`[EMAIL_EVENT] Duplicate event ignored: ${messageId} ${type}`);
      return;
    }
    throw error;
  }
}

export type SuppressionReason = 'bounce' | 'complaint' | 'manual';

export async function upsertSuppression(email: string, reason: SuppressionReason, lastEventAt?: Date) {
  const normalized = normalizeEmail(email);
  const now = new Date();
  const rows = await db.select().from(emailSuppressions).where(eq(emailSuppressions.email, normalized)).limit(1);
  if (rows.length) {
    await db.update(emailSuppressions).set({
      reason,
      source: 'postmark',
      updatedAt: now,
      lastEventAt: lastEventAt || now,
    }).where(eq(emailSuppressions.id, rows[0].id));
    return;
  }
  await db.insert(emailSuppressions).values({
    email: normalized,
    reason,
    source: 'postmark',
    createdAt: now,
    updatedAt: now,
    lastEventAt: lastEventAt || now,
  });
}

export async function isSuppressed(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const rows = await db.select().from(emailSuppressions).where(eq(emailSuppressions.email, normalized)).limit(1);
  return rows.length > 0;
}

export async function checkSuppression(email: string): Promise<{ suppressed: boolean; reason?: string; source?: string; lastEventAt?: Date }> {
  const normalized = normalizeEmail(email);
  const rows = await db.select().from(emailSuppressions).where(eq(emailSuppressions.email, normalized)).limit(1);
  if (!rows.length) return { suppressed: false };
  const s = rows[0];
  return { suppressed: true, reason: s.reason, source: s.source, lastEventAt: s.lastEventAt || undefined };
}

export async function listSuppressions(opts: { limit?: number; offset?: number; search?: string }) {
  const limit = Math.min(Math.max(1, opts.limit || 50), 200);
  const offset = Math.max(0, opts.offset || 0);
  if (opts.search) {
    return db.select().from(emailSuppressions)
      .where(like(emailSuppressions.email, `%${normalizeEmail(opts.search)}%`))
      .orderBy(desc(emailSuppressions.updatedAt))
      .limit(limit).offset(offset);
  }
  return db.select().from(emailSuppressions).orderBy(desc(emailSuppressions.updatedAt)).limit(limit).offset(offset);
}
