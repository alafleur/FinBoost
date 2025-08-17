
import express from 'express';
import { getEmail } from '../services/email/EmailService.js';
import type { TemplateKey } from '../services/email/types.js';

const router = express.Router();

router.post('/test', async (req, res) => {
  try {
    const { template, to, model, subject } = req.body as { template: TemplateKey; to: string; model?: any; subject?: string };
    if (!template || !to) return res.status(400).json({ error: '`template` and `to` are required' });
    const email = getEmail();
    const out = await email.send(template, { to, subject, model });
    res.json({ ok: true, result: out });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[devEmailTest] error', err);
    res.status(500).json({ error: 'send failed', detail: String(err?.message || err) });
  }
});

export default router;
