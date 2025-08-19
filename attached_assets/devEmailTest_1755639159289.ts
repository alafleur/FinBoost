import type { Express } from 'express';
import { EmailService } from '../services/email/EmailService.js';

export function registerDevEmailTest(app: Express) {
  app.post('/api/dev/email-test', async (req, res) => {
    try {
      const { to, template = 'generic', stream, subject, model } = req.body || {};
      const secret = req.headers['x-dev-secret'];
      if (!process.env.DEV_EMAIL_TEST_SECRET || secret !== process.env.DEV_EMAIL_TEST_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const email = new EmailService();
      const result = await email.send(template, { to, stream, subject, model });
      res.json({ ok: true, result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  });
}
