
async function createTestActivity() {
  const { db } = require('./server/db');
  const { users, userPointsHistory } = require('./shared/schema');
  const { eq } = require('drizzle-orm');
  
  // Get all test users
  const testUsers = await db.select().from(users).where(
    eq(users.email, 'alice@test.com')
  );
  
  if (testUsers.length === 0) {
    console.log('❌ No test users found. Run create-test-users.js first.');
    process.exit(1);
  }
  
  // Sample activities for different user types
  const activities = [
    { action: 'lesson_complete', points: 25, description: 'Completed Budgeting Basics lesson' },
    { action: 'quiz_complete', points: 15, description: 'Passed Investment Fundamentals quiz' },
    { action: 'debt_payment', points: 25, description: 'Uploaded proof of credit card payment', status: 'approved' },
    { action: 'savings_upload', points: 20, description: 'Uploaded proof of savings deposit', status: 'approved' },
    { action: 'investment', points: 30, description: 'Uploaded proof of RRSP contribution', status: 'approved' },
    { action: 'emergency_fund', points: 40, description: 'Uploaded proof of emergency fund deposit', status: 'pending' },
    { action: 'daily-login', points: 5, description: 'Daily login bonus' },
    { action: 'referral_signup', points: 100, description: 'Successful referral - new user signed up' },
    { action: 'lesson_complete', points: 30, description: 'Completed Emergency Fund lesson' },
    { action: 'lesson_complete', points: 35, description: 'Completed Investment Basics lesson' }
  ];
  
  try {
    // Get all test users by their email pattern
    const allTestUsers = await db.select().from(users);
    const testUserEmails = ['alice@test.com', 'bob@test.com', 'carol@test.com', 'david@test.com', 'emma@test.com', 'frank@test.com', 'grace@test.com', 'henry@test.com'];
    const filteredTestUsers = allTestUsers.filter(user => testUserEmails.includes(user.email));
    
    for (const user of filteredTestUsers) {
      // Create different amounts of activity based on user tier
      let activityCount;
      switch (user.tier) {
        case 'tier3': activityCount = 15 + Math.floor(Math.random() * 10); break; // Gold: 15-25 activities
        case 'tier2': activityCount = 8 + Math.floor(Math.random() * 7); break;   // Silver: 8-15 activities
        case 'tier1': activityCount = 3 + Math.floor(Math.random() * 5); break;   // Bronze: 3-8 activities
        default: activityCount = 5;
      }
      
      for (let i = 0; i < activityCount; i++) {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const daysAgo = Math.floor(Math.random() * 30); // Activity within last 30 days
        const activityDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await db.insert(userPointsHistory).values({
          userId: user.id,
          points: activity.points,
          action: activity.action,
          description: activity.description,
          status: activity.status || 'approved',
          createdAt: activityDate,
          reviewedAt: activity.status === 'approved' ? activityDate : null,
          metadata: JSON.stringify({ 
            automated: true, 
            testData: true,
            submittedAt: activityDate.toISOString()
          })
        });
      }
      
      console.log(`✅ Created ${activityCount} activities for ${user.email}`);
    }
    
    console.log('\n🎉 Test activity data created successfully!');
    console.log('\nYou can now test:');
    console.log('- Points history and leaderboards');
    console.log('- Different user tiers and rankings');
    console.log('- Activity tracking and validation');
    console.log('- Monthly rewards calculations');
    
  } catch (error) {
    console.error('❌ Error creating test activity:', error.message);
  }
  
  process.exit(0);
}

createTestActivity();
