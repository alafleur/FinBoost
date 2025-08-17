
const express = require('express'); const router = express.Router();
const EmailService = require('../services/email/EmailService');
router.post('/test', async (req, res) => {
  try {
    const { template, to, model, subject } = req.body || {};
    if (!template || !to) return res.status(400).json({ error: '`template` and `to` are required' });
    const email = EmailService.get();
    const out = await email.send(template, { to, subject, model });
    res.json({ ok: true, result: out });
  } catch (err) {
    console.error('[devEmailTest] error', err);
    res.status(500).json({ error: 'send failed', detail: String(err?.message || err) });
  }
});
module.exports = router;
