import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db.js';
import { users, emailVerificationTokens } from '@shared/schema';
import { getEmail } from '../services/email/EmailService.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!email || !username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, username, and password are required' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      emailVerified: false,
      isActive: true,
      isAdmin: false,
      totalPoints: 0,
      currentMonthPoints: 0,
      tier: 'bronze'
    }).returning();

    // Send verification email
    try {
      const verifyBase = process.env.VERIFY_BASE_URL || 'https://getfinboost.com/verify';
      const raw = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(emailVerificationTokens).values({
        userId: newUser.id,
        token: tokenHash,
        expiresAt
      });

      const verifyUrl = `${verifyBase}?token=${encodeURIComponent(raw)}`;

      await getEmail().send('verify-email', {
        to: email,
        model: {
          firstName: firstName || username,
          verifyUrl,
          supportEmail: process.env.SUPPORT_EMAIL,
          brandAddress: process.env.BRAND_ADDRESS
        }
      });

      console.log(`[SIGNUP] Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('[SIGNUP] Failed to send verification email:', emailError);
      // Don't fail signup for email errors
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        emailVerified: false
      }
    });

  } catch (error: any) {
    console.error('[SIGNUP] Registration error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create account'
    });
  }
});

export default router;