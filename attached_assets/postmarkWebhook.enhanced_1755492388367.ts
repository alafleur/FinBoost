
import express from 'express';
import { recordEmailEvent, upsertSuppression } from '../services/email/suppressions.js';

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
