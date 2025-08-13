#!/usr/bin/env node

/**
 * Create test admin user for Phase 5 testing
 */

import { db } from './server/db.js';
import { users } from './shared/schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createTestAdmin() {
  try {
    console.log('Creating test admin user for Phase 5 testing...');
    
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, 'lafleur.andrew@gmail.com'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('password123', 12);
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          paypalEmail: 'lafleur.andrew@gmail.com'  // Ensure PayPal email is set
        })
        .where(eq(users.email, 'lafleur.andrew@gmail.com'));
        
      console.log('✅ Admin password updated for testing');
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await db.insert(users).values({
      username: 'admin',
      email: 'lafleur.andrew@gmail.com',
      firstName: 'Andrew',
      lastName: 'LaFleur',
      password: hashedPassword,
      totalPoints: 1000,
      currentMonthPoints: 500,
      paypalEmail: 'lafleur.andrew@gmail.com',
      isVerified: true
    });

    console.log('✅ Test admin user created successfully');
    
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
  } finally {
    process.exit(0);
  }
}

createTestAdmin();