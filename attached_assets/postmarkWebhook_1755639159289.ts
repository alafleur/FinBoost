import type { Express } from 'express';
import { recordEmailEvent, upsertSuppression } from '../services/email/suppressions.js';

/**
 * Postmark webhook receiver.
 * Map all bounce/complaint events to our suppression table.
 */
export function registerPostmarkWebhook(app: Express) {
  app.post('/api/webhooks/postmark', async (req, res) => {
    const payload = req.body || {};
    try {
      await recordEmailEvent(payload);

      const type = String(payload.RecordType || payload.Type || '').toLowerCase();
      const subtype = String(payload.Type || payload.BounceType || '').toLowerCase();
      const inactive = Boolean(payload.Inactive);
      const email = String(payload.Recipient || payload.Email || payload.EmailAddress || '');

      // Hard bounces, spam complaints, or inactive -> suppress
      const isHardBounce = type.includes('bounce') && /hardbounce|hard|bademail|blocked/i.test(subtype);
      const isComplaint = type.includes('spam') || type.includes('complaint');
      const shouldSuppress = inactive || isHardBounce || isComplaint;

      if (shouldSuppress && email) {
        await upsertSuppression(email, isComplaint ? 'complaint' : 'bounce', new Date(payload.ReceivedAt || Date.now()));
      }

      res.json({ ok: true });
    } catch (err: any) {
      console.error('[POSTMARK WEBHOOK] Error processing event:', err?.message || err);
      res.status(200).json({ ok: true }); // Always 200 to satisfy Postmark
    }
  });
}
