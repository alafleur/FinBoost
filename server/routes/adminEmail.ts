import express from 'express';
import { listSuppressions, listEvents } from '../services/email/suppressions.js';

const router = express.Router();

router.get('/suppressions', async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const rows = await listSuppressions({ limit, offset, search });
  res.json({ success: true, rows });
});

router.get('/events', async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email.toLowerCase() : undefined;
  const rows = await listEvents({ limit, offset, type, email });
  res.json({ success: true, rows });
});

export default router;