import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { eq, and } from 'drizzle-orm';
import { users, passwordResetTokens, emailVerificationTokens } from '@shared/schema';
import { getEmail } from '../services/email/EmailService.js';

const router = express.Router();

function now() { return new Date(); }
function hours(n: number) { return n * 60 * 60 * 1000; }
function genToken() { return crypto.randomBytes(32).toString('hex'); }

const VERIFY_LIFETIME_MS = hours(24);
const RESET_LIFETIME_MS = hours(1);

/**
 * POST /api/auth/verify/request
 * Body: { email?: string }
 */
router.post('/verify/request', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'email required' });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return res.json({ success: true, message: 'If your email exists, we sent a verification email' });

    if (user.emailVerified === true) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const token = genToken();
    const expiresAt = new Date(now().getTime() + VERIFY_LIFETIME_MS);

    await db.insert(emailVerificationTokens).values({ userId: user.id, token, expiresAt });

    const verifyBase = process.env.VERIFY_BASE_URL || 'https://getfinboost.com/verify';
    const verifyUrl = `${verifyBase}?token=${encodeURIComponent(token)}`;

    await getEmail().send('verify-email', {
      to: email,
      model: {
        firstName: user.username || 'there',
        verifyUrl,
        supportEmail: process.env.SUPPORT_EMAIL,
        brandAddress: process.env.BRAND_ADDRESS
      }
    });

    console.log(`[authEmail] Verification email sent to ${email} with token starting with ${token.substring(0, 8)}...`);
    return res.json({ success: true, message: 'Verification email sent' });
  } catch (err: any) {
    console.error('[verify/request] error', err);
    return res.status(500).json({ success: false, message: 'Failed to send verification', detail: String(err?.message || err) });
  }
});

/**
 * GET /api/auth/verify?token=...
 */
router.get('/verify', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ success: false, message: 'token required' });

    const [row] = await db.select().from(emailVerificationTokens)
      .where(and(eq(emailVerificationTokens.token, token), eq(emailVerificationTokens.isUsed, false)))
      .limit(1);

    if (!row) return res.status(400).json({ success: false, message: 'invalid or used token' });
    if (new Date(row.expiresAt).getTime() < now().getTime()) {
      return res.status(400).json({ success: false, message: 'token expired' });
    }

    await db.update(users).set({ emailVerified: true, verifiedAt: new Date() }).where(eq(users.id, row.userId));
    await db.update(emailVerificationTokens).set({ isUsed: true, usedAt: new Date() }).where(eq(emailVerificationTokens.id, row.id));

    console.log(`[authEmail] Email verified for user ${row.userId}`);
    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (err: any) {
    console.error('[verify] error', err);
    return res.status(500).json({ success: false, message: 'Verification failed', detail: String(err?.message || err) });
  }
});

/**
 * POST /api/auth/password/request
 * Body: { email }
 */
router.post('/password/request', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'email required' });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return res.json({ success: true, message: 'If your email exists, we sent a password reset link' });

    const token = genToken();
    const expiresAt = new Date(now().getTime() + RESET_LIFETIME_MS);

    await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

    const resetBase = process.env.RESET_BASE_URL || 'https://getfinboost.com/reset';
    const resetUrl = `${resetBase}?token=${encodeURIComponent(token)}`;

    await getEmail().send('password-reset', {
      to: email,
      model: {
        firstName: user.username || 'there',
        resetUrl,
        supportEmail: process.env.SUPPORT_EMAIL,
        brandAddress: process.env.BRAND_ADDRESS
      }
    });

    console.log(`[authEmail] Password reset email sent to ${email} with token starting with ${token.substring(0, 8)}...`);
    return res.json({ success: true, message: 'Password reset email sent' });
  } catch (err: any) {
    console.error('[password/request] error', err);
    return res.status(500).json({ success: false, message: 'Failed to send reset email', detail: String(err?.message || err) });
  }
});

/**
 * POST /api/auth/password/reset
 * Body: { token, password }
 */
router.post('/password/reset', async (req, res) => {
  try {
    const token = String(req.body?.token || '');
    const password = String(req.body?.password || '');
    if (!token || !password) return res.status(400).json({ success: false, message: 'token and password required' });

    const [row] = await db.select().from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.isUsed, false)))
      .limit(1);

    if (!row) return res.status(400).json({ success: false, message: 'invalid or used token' });
    if (new Date(row.expiresAt).getTime() < now().getTime()) {
      return res.status(400).json({ success: false, message: 'token expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await db.update(users).set({ password: hash }).where(eq(users.id, row.userId));
    await db.update(passwordResetTokens).set({ isUsed: true }).where(eq(passwordResetTokens.id, row.id));

    console.log(`[authEmail] Password reset successful for user ${row.userId}`);
    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err: any) {
    console.error('[password/reset] error', err);
    return res.status(500).json({ success: false, message: 'Password reset failed', detail: String(err?.message || err) });
  }
});

export default router;