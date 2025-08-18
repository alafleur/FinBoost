
import { db } from '../../routes/db.js'; // adjust path if needed
import { and, eq, like, desc } from 'drizzle-orm';
import { emailEvents, emailSuppressions } from '@shared/schema';

export async function recordEmailEvent(payload: any) {
  const type = String(payload.RecordType || payload.Type || 'Unknown');
  const email = String(payload.Recipient || payload.Email || payload.EmailAddress || '').toLowerCase();
  const messageId = String(payload.MessageID || payload.MessageId || '');
  const stream = String(payload.MessageStream || '');
  await db.insert(emailEvents).values({ type, email, messageId, stream, payload });
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
