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
