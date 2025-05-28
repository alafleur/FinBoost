// Simple test to create a working user account
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const { db } = require('./server/db');
  const { users } = require('./shared/schema');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  try {
    const [user] = await db.insert(users).values({
      email: 'testuser@example.com',
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      totalPoints: 0,
      currentMonthPoints: 0,
      tier: 'Bronze',
      currentStreak: 0,
      longestStreak: 0,
      joinedAt: new Date(),
      lastLoginAt: null
    }).returning();
    
    console.log('Test user created successfully:', user.email);
    console.log('Login with: testuser@example.com / password123');
  } catch (error) {
    console.error('Error creating test user:', error.message);
  }
}

createTestUser();