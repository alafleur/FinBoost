import type { Express, Request, Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import { recordEmailEvent, upsertSuppression } from '../services/email/suppressions.js';

/** Verify Postmark signature if POSTMARK_WEBHOOK_SECRET is set. */
function verifySignature(req: Request, raw: string): boolean {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured
  const sig = req.header('X-Postmark-Webhook-Signature') || '';
  if (!sig) return false;
  const hmac = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(hmac));
}

export function registerPostmarkWebhook(app: Express) {
  app.post('/api/webhooks/postmark',
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
