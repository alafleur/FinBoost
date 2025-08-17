
import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET || null;
  if (secret && req.query.secret !== secret) return res.status(401).json({ error: 'unauthorized' });

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const ev of events) {
      // TODO: persist bounces/complaints to suppression store
      // eslint-disable-next-line no-console
      console.log('[postmark:webhook]', JSON.stringify(ev));
    }
    res.json({ ok: true });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[postmark:webhook] error', e);
    res.status(500).json({ error: 'webhook failure' });
  }
});

export default router;
