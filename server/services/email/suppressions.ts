import { db } from '../../db.js';
import { and, eq, like, desc } from 'drizzle-orm';
import { emailEvents, emailSuppressions } from '@shared/schema';

export async function recordEmailEvent(payload: any) {
  const type = String(payload.RecordType || payload.Type || 'Unknown');
  const email = String(payload.Recipient || payload.Email || payload.EmailAddress || '').toLowerCase();
  const messageId = String(payload.MessageID || payload.MessageId || '');
  const stream = String(payload.MessageStream || '');
  
  // Create deterministic hash for idempotency (ChatGPT recommendation)
  const crypto = await import('crypto');
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');
  
  try {
    await db.insert(emailEvents).values({ 
      type, 
      email, 
      messageId, 
      stream, 
      payload, 
      payloadHash 
    });
  } catch (error: any) {
    // Handle duplicate events gracefully (idempotency protection)
    if (error.code === '23505') { // Unique constraint violation
      console.log(`[EMAIL_EVENT] Duplicate event ignored: ${messageId} ${type}`);
      return;
    }
    throw error;
  }
}

export async function upsertSuppression(email: string, reason: 'bounce' | 'complaint' | 'manual', lastEventAt?: Date) {
  const now = new Date();
  const rows = await db.select().from(emailSuppressions).where(eq(emailSuppressions.email, email.toLowerCase())).limit(1);
  if (rows.length) {
    await db.update(emailSuppressions).set({ reason, source: 'postmark', updatedAt: now, lastEventAt: lastEventAt || now })
      .where(eq(emailSuppressions.id, rows[0].id));
    return;
  }
  await db.insert(emailSuppressions).values({
    email: email.toLowerCase(), reason, source: 'postmark', createdAt: now, updatedAt: now, lastEventAt: lastEventAt || now
  });
}

export async function isSuppressed(email: string): Promise<boolean> {
  const rows = await db.select().from(emailSuppressions).where(eq(emailSuppressions.email, email.toLowerCase())).limit(1);
  return rows.length > 0;
}

export async function checkSuppression(email: string): Promise<{ suppressed: boolean; reason?: string; source?: string; lastEventAt?: Date }> {
  const rows = await db.select().from(emailSuppressions).where(eq(emailSuppressions.email, email.toLowerCase())).limit(1);
  if (rows.length === 0) {
    return { suppressed: false };
  }
  const suppression = rows[0];
  return {
    suppressed: true,
    reason: suppression.reason,
    source: suppression.source,
    lastEventAt: suppression.lastEventAt || undefined
  };
}

export async function listSuppressions(opts: { limit?: number; offset?: number; search?: string }) {
  const limit = Math.min(Math.max(1, opts.limit || 50), 200);
  const offset = Math.max(0, opts.offset || 0);
  if (opts.search) {
    return db.select().from(emailSuppressions)
      .where(like(emailSuppressions.email, `%${opts.search.toLowerCase()}%`))
      .orderBy(desc(emailSuppressions.updatedAt))
      .limit(limit).offset(offset);
  }
  return db.select().from(emailSuppressions)
    .orderBy(desc(emailSuppressions.updatedAt))
    .limit(limit).offset(offset);
}

export async function listEvents(opts: { limit?: number; offset?: number; type?: string; email?: string }) {
  const limit = Math.min(Math.max(1, opts.limit || 50), 200);
  const offset = Math.max(0, opts.offset || 0);
  let where: any[] = [];
  if (opts.type) where.push(eq(emailEvents.type, opts.type));
  if (opts.email) where.push(eq(emailEvents.email, opts.email.toLowerCase()));
  const conditions = where.length ? where.reduce((a, b) => and(a, b)) : undefined;
  const q: any = db.select().from(emailEvents).orderBy(desc(emailEvents.receivedAt)).limit(limit).offset(offset);
  if (conditions) q.where(conditions);
  return q;
}