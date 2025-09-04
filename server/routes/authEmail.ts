import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { eq, and, or } from 'drizzle-orm';
import { users, passwordResetTokens } from '@shared/schema';
import { emailVerificationTokens } from '@shared/schema';
import { getEmail } from '../services/email/EmailService.js';

const router = express.Router();

function now() { return new Date(); }
function hours(n: number) { return n * 60 * 60 * 1000; }
function genTokenRaw() { return crypto.randomBytes(32).toString('hex'); }
function sha256(x: string) { return crypto.createHash('sha256').update(x).digest('hex'); }

const VERIFY_LIFETIME_MS = hours(24);
const RESET_LIFETIME_MS = hours(1);

const emailLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

router.post('/verify/request', emailLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'email required' });
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return res.json({ success: true, message: 'If your email exists, we sent a verification link' });
    if ((user as any).emailVerified === true) return res.json({ success: true, message: 'Already verified' });

    const raw = genTokenRaw();
    const tokenHash = sha256(raw);
    const expiresAt = new Date(now().getTime() + VERIFY_LIFETIME_MS);
    await db.insert(emailVerificationTokens).values({ userId: (user as any).id, token: tokenHash, expiresAt });

    const verifyBase = process.env.VERIFY_BASE_URL || 'https://getfinboost.com/verify';
    const verifyUrl = `${verifyBase}?token=${encodeURIComponent(raw)}`;

    await getEmail().send('verify-email', { to: email, model: {
      firstName: (user as any).username || 'there',
      verifyUrl,
      supportEmail: process.env.SUPPORT_EMAIL,
      brandAddress: process.env.BRAND_ADDRESS
    }});

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (err: any) {
    console.error('[verify/request] error', err);
    return res.status(500).json({ success: false, message: 'Failed to send verification', detail: String(err?.message || err) });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const raw = String(req.query.token || '');
    if (!raw) return res.status(400).json({ success: false, message: 'token required' });
    const tokenHash = sha256(raw);

    const [row] = await db.select().from(emailVerificationTokens)
      .where(or(eq(emailVerificationTokens.token, raw), eq(emailVerificationTokens.token, tokenHash)))
      .limit(1);

    if (!row) return res.status(400).json({ success: false, message: 'invalid or already used token' });
    if (row.isUsed) return res.status(400).json({ success: false, message: 'token already used' });
    if (new Date(row.expiresAt).getTime() < now().getTime()) return res.status(400).json({ success: false, message: 'token expired' });

    // Mark email as verified
    await db.update(users).set({ emailVerified: true, verifiedAt: new Date() }).where(eq(users.id, row.userId));
    await db.update(emailVerificationTokens).set({ isUsed: true, usedAt: new Date(), token: tokenHash }).where(eq(emailVerificationTokens.id, row.id));

    // Check if auto-login is enabled (default to true in development)
    const autoLoginEnabled = process.env.AUTO_LOGIN_AFTER_VERIFY === 'true' || 
                             process.env.NODE_ENV === 'development';
    const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'development' 
      ? `http://localhost:${process.env.PORT || 5000}`
      : 'https://getfinboost.com');

    if (autoLoginEnabled) {
      try {
        // Get the user to create the JWT token
        const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
        if (user) {
          // Generate JWT token (same as login)
          const authToken = jwt.sign(
            { userId: user.id },
            'finboost-secret-key-2024',
            { expiresIn: '24h' }
          );

          // Redirect to dashboard with the auth token as a URL parameter
          // The frontend will pick this up and store it in localStorage
          return res.redirect(302, `${appUrl}/dashboard?authToken=${encodeURIComponent(authToken)}&verified=true`);
        }
      } catch (authErr: any) {
        console.error('[verify] auto-login failed', authErr);
        // Fall back to manual login flow
      }
    }

    // Fallback: redirect to auth page with verified=true
    return res.redirect(302, `${appUrl}/auth?verified=true`);
  } catch (err: any) {
    console.error('[verify] error', err);
    const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'development' 
      ? `http://localhost:${process.env.PORT || 5000}`
      : 'https://getfinboost.com');
    return res.redirect(302, `${appUrl}/auth?verify=failed`);
  }
});

router.post('/password/request', emailLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'email required' });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return res.json({ success: true, message: 'If your email exists, we sent a reset link' });

    const raw = genTokenRaw();
    const tokenHash = sha256(raw);
    const expiresAt = new Date(now().getTime() + RESET_LIFETIME_MS);
    await db.insert(passwordResetTokens).values({ userId: (user as any).id, token: tokenHash, expiresAt });

    const resetBase = process.env.RESET_BASE_URL || 'https://getfinboost.com/reset';
    const resetUrl = `${resetBase}?token=${encodeURIComponent(raw)}`;

    await getEmail().send('password-reset', { to: email, model: {
      firstName: (user as any).username || 'there',
      resetUrl,
      supportEmail: process.env.SUPPORT_EMAIL,
      brandAddress: process.env.BRAND_ADDRESS
    }});

    return res.json({ success: true, message: 'Password reset email sent' });
  } catch (err: any) {
    console.error('[password/request] error', err);
    return res.status(500).json({ success: false, message: 'Failed to send reset', detail: String(err?.message || err) });
  }
});

router.post('/password/reset', async (req, res) => {
  try {
    const raw = String(req.body?.token || '');
    const password = String(req.body?.password || '');
    if (!raw || !password) return res.status(400).json({ success: false, message: 'token and password required' });

    const tokenHash = sha256(raw);
    const [row] = await db.select().from(passwordResetTokens)
      .where(or(eq(passwordResetTokens.token, raw), eq(passwordResetTokens.token, tokenHash)))
      .limit(1);

    if (!row) return res.status(400).json({ success: false, message: 'invalid or already used token' });
    if (row.isUsed) return res.status(400).json({ success: false, message: 'token already used' });
    if (new Date(row.expiresAt).getTime() < now().getTime()) return res.status(400).json({ success: false, message: 'token expired' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await db.update(users).set({ password: hash }).where(eq(users.id, row.userId));
    await db.update(passwordResetTokens).set({ isUsed: true, token: tokenHash }).where(eq(passwordResetTokens.id, row.id));

    return res.json({ success: true, message: 'Password has been reset' });
  } catch (err: any) {
    console.error('[password/reset] error', err);
    return res.status(500).json({ success: false, message: 'Reset failed', detail: String(err?.message || err) });
  }
});

export default router;