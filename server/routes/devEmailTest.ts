import type { Express, Request, Response } from 'express';
import { EmailService } from '../services/email/EmailService.js';

const WINDOW_MS = 60_000;
const MAX_REQS = 12;
let windowStart = Date.now();
let count = 0;

function rateLimited(): boolean {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    count = 0;
  }
  count += 1;
  return count > MAX_REQS;
}

export function registerDevEmailTest(app: Express) {
  app.post('/api/dev/email-test', async (req: Request, res: Response) => {
    try {
      const secret = String(req.headers['x-dev-secret'] || '');
      if (!process.env.DEV_EMAIL_TEST_SECRET || secret !== process.env.DEV_EMAIL_TEST_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (rateLimited()) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      const { to, template = 'generic', stream, subject, model } = req.body || {};
      const email = new EmailService();
      const result = await email.send(template, { to, stream, subject, model });
      res.json({ ok: true, result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  });
}

// Legacy express router export for backward compatibility
import express from 'express';
const router = express.Router();

router.post('/test', async (req, res) => {
  try {
    const { template, to, model, subject } = req.body as { template: any; to: string; model?: any; subject?: string };
    if (!template || !to) return res.status(400).json({ error: '`template` and `to` are required' });
    const email = new EmailService();
    const out = await email.send(template, { to, subject, model });
    res.json({ ok: true, result: out });
  } catch (err: any) {
    console.error('[devEmailTest] error', err);
    res.status(500).json({ error: 'send failed', detail: String(err?.message || err) });
  }
});

export default router;