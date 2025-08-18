import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import { emailVerificationTokens } from '@shared/schema';
import { getEmail } from '../services/email/EmailService.js';

const router = express.Router();

function sha256(x: string) { return crypto.createHash('sha256').update(x).digest('hex'); }
function hours(n: number) { return n * 60 * 60 * 1000; }

/**
 * POST /api/auth/signup
 * Body: { email, password, username? }
 */
router.post('/signup', async (req, res) => {
  try {
    const emailRaw = String(req.body?.email || '');
    const password = String(req.body?.password || '');
    const username = req.body?.username ? String(req.body.username) : undefined;

    const email = emailRaw.trim().toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password required' });
    }

    // Prevent duplicate accounts
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const created = await db.insert(users).values({
      email,
      username: username || email.split('@')[0],
      password: hash,
      // If your schema already has these fields, they will be set;
      // if not, Drizzle will ignore them (or you can remove them).
      emailVerified: false,
      verifiedAt: null,
    }).returning({ id: users.id, email: users.email, username: users.username });
    const newUser = created[0];

    // Create verification token (24h)
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + hours(24));

    await db.insert(emailVerificationTokens).values({
      userId: newUser.id,
      token: tokenHash,
      expiresAt,
    });

    // Compose verify URL
    const verifyBase = process.env.VERIFY_BASE_URL || 'https://getfinboost.com/verify';
    const verifyUrl = `${verifyBase}?token=${encodeURIComponent(raw)}`;

    // Send verification email
    await getEmail().send('verify-email', {
      to: newUser.email,
      model: {
        firstName: newUser.username || 'there',
        verifyUrl,
        supportEmail: process.env.SUPPORT_EMAIL,
        brandAddress: process.env.BRAND_ADDRESS,
      },
    });

    return res.status(201).json({
      success: true,
      userId: newUser.id,
      needVerification: true,
      message: 'Account created. Please verify your email.',
    });
  } catch (err: any) {
    console.error('[signup] error', err);
    return res.status(500).json({ success: false, message: 'Signup failed' });
  }
});

export default router;
