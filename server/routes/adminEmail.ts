import express from 'express';
import rateLimit from 'express-rate-limit';
import { listSuppressions, listEvents } from '../services/email/suppressions.js';

const router = express.Router();

// Rate limiting for admin email endpoints (protect against abuse)
const adminEmailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: { error: 'Too many admin email requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all admin email routes
router.use(adminEmailRateLimit);

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