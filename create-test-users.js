
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  const { db } = require('./server/db');
  const { users } = require('./shared/schema');
  
  const testUsers = [
    {
      email: 'alice@test.com',
      username: 'alice_highearner',
      firstName: 'Alice',
      lastName: 'Johnson',
      totalPoints: 2850,
      currentMonthPoints: 1200,
      tier: 'tier3', // Gold
      currentStreak: 15,
      longestStreak: 20,
      bio: 'Financial planning enthusiast',
      location: 'Toronto, ON',
      occupation: 'Financial Advisor'
    },
    {
      email: 'bob@test.com',
      username: 'bob_midearner',
      firstName: 'Bob',
      lastName: 'Smith',
      totalPoints: 1650,
      currentMonthPoints: 750,
      tier: 'tier2', // Silver
      currentStreak: 8,
      longestStreak: 12,
      bio: 'Learning to invest better',
      location: 'Vancouver, BC',
      occupation: 'Software Engineer'
    },
    {
      email: 'carol@test.com',
      username: 'carol_newbie',
      firstName: 'Carol',
      lastName: 'Davis',
      totalPoints: 420,
      currentMonthPoints: 280,
      tier: 'tier1', // Bronze
      currentStreak: 3,
      longestStreak: 5,
      bio: 'Just starting my financial journey',
      location: 'Montreal, QC',
      occupation: 'Teacher'
    },
    {
      email: 'david@test.com',
      username: 'david_consistent',
      firstName: 'David',
      lastName: 'Wilson',
      totalPoints: 3200,
      currentMonthPoints: 950,
      tier: 'tier2', // Silver
      currentStreak: 22,
      longestStreak: 30,
      bio: 'Consistent daily learner',
      location: 'Calgary, AB',
      occupation: 'Accountant'
    },
    {
      email: 'emma@test.com',
      username: 'emma_streaker',
      firstName: 'Emma',
      lastName: 'Brown',
      totalPoints: 4100,
      currentMonthPoints: 1850,
      tier: 'tier3', // Gold
      currentStreak: 45,
      longestStreak: 45,
      bio: 'On a mission to financial freedom',
      location: 'Ottawa, ON',
      occupation: 'Marketing Manager'
    },
    {
      email: 'frank@test.com',
      username: 'frank_casual',
      firstName: 'Frank',
      lastName: 'Miller',
      totalPoints: 890,
      currentMonthPoints: 180,
      tier: 'tier1', // Bronze
      currentStreak: 0,
      longestStreak: 7,
      bio: 'Casual learner',
      location: 'Winnipeg, MB',
      occupation: 'Mechanic'
    },
    {
      email: 'grace@test.com',
      username: 'grace_achiever',
      firstName: 'Grace',
      lastName: 'Lee',
      totalPoints: 5500,
      currentMonthPoints: 2200,
      tier: 'tier3', // Gold
      currentStreak: 12,
      longestStreak: 35,
      bio: 'Investment portfolio optimizer',
      location: 'Toronto, ON',
      occupation: 'Data Scientist'
    },
    {
      email: 'henry@test.com',
      username: 'henry_beginner',
      firstName: 'Henry',
      lastName: 'Garcia',
      totalPoints: 150,
      currentMonthPoints: 150,
      tier: 'tier1', // Bronze
      currentStreak: 1,
      longestStreak: 1,
      bio: 'Just joined yesterday',
      location: 'Halifax, NS',
      occupation: 'Student'
    }
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  try {
    for (const userData of testUsers) {
      const [user] = await db.insert(users).values({
        ...userData,
        password: hashedPassword,
        isActive: true,
        joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random join date within last 90 days
        lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random last login within last week
        lastActivityDate: new Date().toISOString().split('T')[0]
      }).returning();
      
      console.log(`✅ Created user: ${user.email} (${user.tier}, ${user.totalPoints} points)`);
    }
    
    console.log('\n🎉 All test users created successfully!');
    console.log('\nLogin credentials for all users:');
    console.log('Password: password123');
    console.log('\nUser profiles:');
    testUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.tier} tier, ${user.totalPoints} total points, ${user.currentMonthPoints} monthly points`);
    });
    
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('⚠️  Some users already exist. Skipping duplicates...');
    } else {
      console.error('❌ Error creating test users:', error.message);
    }
  }
  
  process.exit(0);
}

createTestUsers();
