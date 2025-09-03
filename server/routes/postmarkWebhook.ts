import type { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import crypto from 'crypto';
import { recordEmailEvent, upsertSuppression } from '../services/email/suppressions.js';

/** Check HTTP Basic Auth with direct comparison (simplified for debugging). */
function checkBasicAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  
  if (!header.startsWith("Basic ")) {
    return res.sendStatus(401);
  }
  
  try {
    const credentials = Buffer.from(header.split(" ")[1], "base64").toString("utf8");
    const okU = process.env.POSTMARK_WEBHOOK_BASIC_USER || "";
    const okP = process.env.POSTMARK_WEBHOOK_BASIC_PASS || "";
    const expectedCredentials = `${okU}:${okP}`;
    
    // Direct string comparison for now (we can add timing-safe later)
    if (credentials === expectedCredentials) {
      console.log('[WEBHOOK AUTH] ✅ Authentication successful');
      return next();
    } else {
      console.log('[WEBHOOK AUTH] ❌ Authentication failed');
      return res.sendStatus(401);
    }
  } catch (error) {
    console.error('[WEBHOOK AUTH] Error parsing auth:', error);
    return res.sendStatus(401);
  }
}

/** Verify Postmark signature if POSTMARK_WEBHOOK_SECRET is set. */
function verifySignature(req: Request, raw: string): boolean {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured
  const sig = req.header('X-Postmark-Webhook-Signature') || '';
  if (!sig) return false;
  const hmac = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('base64');
  
  // Ensure same length for timingSafeEqual
  const sigBuffer = Buffer.from(sig);
  const hmacBuffer = Buffer.from(hmac);
  if (sigBuffer.length !== hmacBuffer.length) return false;
  
  return crypto.timingSafeEqual(sigBuffer, hmacBuffer);
}

/**
 * Postmark webhook receiver with HMAC verification.
 * Map all bounce/complaint events to our suppression table.
 */
export function registerPostmarkWebhook(app: Express) {
  app.post('/api/webhooks/postmark',
    // Check Basic Auth FIRST (before processing)
    checkBasicAuth,
    // Use raw body for signature validation
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const raw = req.body?.toString?.('utf8') || '';
      try {
        if (!verifySignature(req, raw)) {
          console.warn('[POSTMARK] invalid webhook signature');
          return res.status(200).json({ ok: true });
        }
        const payload = JSON.parse(raw);
        await recordEmailEvent(payload);

        const type = String(payload.RecordType || payload.Type || '').toLowerCase();
        const subtype = String(payload.Type || payload.BounceType || '').toLowerCase();
        const inactive = Boolean(payload.Inactive);
        const email = String(payload.Recipient || payload.Email || payload.EmailAddress || '');

        const isHardBounce = type.includes('bounce') && /hardbounce|hard|bademail|blocked|invalid/i.test(subtype);
        const isComplaint = type.includes('spam') || type.includes('complaint');
        const shouldSuppress = inactive || isHardBounce || isComplaint;

        if (shouldSuppress && email) {
          await upsertSuppression(email, isComplaint ? 'complaint' : 'bounce', new Date(payload.ReceivedAt || Date.now()));
        }
        res.json({ ok: true });
      } catch (err: any) {
        console.error('[POSTMARK WEBHOOK] error:', err?.message || err);
        res.status(200).json({ ok: true }); // always 200
      }
    }
  );
}

// Legacy export for backward compatibility
const router = express.Router();

router.post('/', async (req, res) => {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET || null;
  if (secret && req.query.secret !== secret) return res.status(401).json({ error: 'unauthorized' });

  try {
    const payloads = Array.isArray(req.body) ? req.body : [req.body];
    for (const ev of payloads) {
      await recordEmailEvent(ev);

      const type = String(ev.RecordType || ev.Type || 'Unknown');
      const email = String(ev.Recipient || ev.Email || ev.EmailAddress || '').toLowerCase();
      const ts = new Date(ev.ReceivedAt || Date.now());
      if (!email) continue;

      if (type === 'Bounce') {
        const bounceType = String(ev.BounceType || ev.Type || '').toLowerCase();
        if (bounceType.includes('hard')) await upsertSuppression(email, 'bounce', ts);
      } else if (type === 'SpamComplaint') {
        await upsertSuppression(email, 'complaint', ts);
      }
    }
    res.json({ ok: true, count: payloads.length });
  } catch (e: any) {
    console.error('[postmark:webhook] error', e);
    res.status(500).json({ error: 'webhook failure' });
  }
});

export default router;