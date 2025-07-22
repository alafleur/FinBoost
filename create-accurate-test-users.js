import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CYCLE_ID = 18;
const TOTAL_USERS = 1500;
const PASSWORD = 'testpass123';
const BATCH_SIZE = 50;

// Available modules
const MODULES = [
  { id: 1, title: 'Budgeting Basics', category: 'Budgeting' },
  { id: 11, title: 'Zero-Based Budgeting', category: 'Budgeting' },
  { id: 4, title: 'Credit Management', category: 'Credit' },
  { id: 8, title: 'Understanding Credit Scores', category: 'Credit' },
  { id: 9, title: 'Debt Snowball vs Avalanche', category: 'Debt' },
  { id: 3, title: 'Investment Basics', category: 'Investing' },
  { id: 39, title: 'Building a Wealth Mindset', category: 'Planning' },
  { id: 52, title: 'Budgeting for Variable Expenses', category: 'budgeting' }
];

// Fixed point proof actions
const PROOF_ACTIONS = [
  { action: 'debt_payment', points: 50, description: 'Debt Payment Proof' },
  { action: 'investment', points: 40, description: 'Investment Proof' },
  { action: 'savings_upload', points: 30, description: 'Savings Goal Achievement' },
  { action: 'emergency_fund', points: 60, description: 'Emergency Fund Contribution' }
];

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

function generateUsername(index) {
  const prefixes = ['fin', 'money', 'budget', 'wealth', 'smart', 'save', 'invest', 'grow', 'build', 'earn'];
  const suffixes = ['master', 'pro', 'guru', 'saver', 'builder', 'planner', 'winner', 'achiever', 'creator', 'seeker'];
  
  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[Math.floor(index / prefixes.length) % suffixes.length];
  const number = index + 1;
  
  return `${prefix}${suffix}${number}`;
}

function generateAccurateActivity(userIndex) {
  const engagementLevel = Math.random();
  
  let activities = [];
  let totalPoints = 0;
  
  // Create specific activities that we will actually record
  if (engagementLevel > 0.8) {
    // High engagement: 5-8 lessons, 2-3 proofs, 1-2 referrals
    const numLessons = 5 + Math.floor(Math.random() * 4);
    const numProofs = 2 + Math.floor(Math.random() * 2);
    const numReferrals = Math.floor(Math.random() * 2) + 1;
    
    // Add lessons (20 points each)
    for (let i = 0; i < Math.min(numLessons, MODULES.length); i++) {
      activities.push({
        type: 'lesson',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: 20
      });
      totalPoints += 20;
      
      // Add quiz for each lesson (random 10-20 points)
      const quizPoints = Math.floor(Math.random() * 11) + 10;
      activities.push({
        type: 'quiz',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: quizPoints
      });
      totalPoints += quizPoints;
    }
    
    // Add proofs
    for (let i = 0; i < Math.min(numProofs, PROOF_ACTIONS.length); i++) {
      activities.push({
        type: 'proof',
        action: PROOF_ACTIONS[i].action,
        description: PROOF_ACTIONS[i].description,
        points: PROOF_ACTIONS[i].points
      });
      totalPoints += PROOF_ACTIONS[i].points;
    }
    
    // Add referrals (50 points each)
    for (let i = 0; i < numReferrals; i++) {
      activities.push({
        type: 'referral',
        points: 50
      });
      totalPoints += 50;
    }
    
  } else if (engagementLevel > 0.5) {
    // Medium engagement: 2-4 lessons, 1 proof, 0-1 referrals
    const numLessons = 2 + Math.floor(Math.random() * 3);
    const numProofs = 1;
    const numReferrals = Math.floor(Math.random() * 2);
    
    for (let i = 0; i < Math.min(numLessons, MODULES.length); i++) {
      activities.push({
        type: 'lesson',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: 20
      });
      totalPoints += 20;
      
      const quizPoints = Math.floor(Math.random() * 11) + 10;
      activities.push({
        type: 'quiz',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: quizPoints
      });
      totalPoints += quizPoints;
    }
    
    if (numProofs > 0) {
      activities.push({
        type: 'proof',
        action: PROOF_ACTIONS[0].action,
        description: PROOF_ACTIONS[0].description,
        points: PROOF_ACTIONS[0].points
      });
      totalPoints += PROOF_ACTIONS[0].points;
    }
    
    for (let i = 0; i < numReferrals; i++) {
      activities.push({
        type: 'referral',
        points: 50
      });
      totalPoints += 50;
    }
    
  } else if (engagementLevel > 0.2) {
    // Low engagement: 1-2 lessons, no proofs, no referrals
    const numLessons = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < Math.min(numLessons, MODULES.length); i++) {
      activities.push({
        type: 'lesson',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: 20
      });
      totalPoints += 20;
      
      const quizPoints = Math.floor(Math.random() * 11) + 10;
      activities.push({
        type: 'quiz',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: quizPoints
      });
      totalPoints += quizPoints;
    }
  } else {
    // Minimal engagement: maybe 1 lesson
    if (Math.random() > 0.5) {
      activities.push({
        type: 'lesson',
        moduleId: MODULES[0].id,
        moduleTitle: MODULES[0].title,
        points: 20
      });
      totalPoints += 20;
      
      const quizPoints = Math.floor(Math.random() * 11) + 10;
      activities.push({
        type: 'quiz',
        moduleId: MODULES[0].id,
        moduleTitle: MODULES[0].title,
        points: quizPoints
      });
      totalPoints += quizPoints;
    }
  }
  
  return {
    activities,
    totalPoints
  };
}

async function createBatchUsers(startIndex, batchSize) {
  const client = await pool.connect();
  const hashedPassword = await hashPassword(PASSWORD);
  
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < batchSize; i++) {
      const userIndex = startIndex + i;
      if (userIndex >= TOTAL_USERS) break;
      
      const username = generateUsername(userIndex);
      const email = `user${userIndex + 1}@test.com`;
      const activityData = generateAccurateActivity(userIndex);
      
      const firstName = username.charAt(0).toUpperCase() + username.slice(1, -1);
      const lastName = 'User';
      
      // Create user with EXACT calculated points
      const userQuery = `
        INSERT INTO users (
          email, username, password, first_name, last_name, 
          is_active, is_admin, total_points, current_month_points,
          subscription_status, subscription_amount, subscription_currency,
          subscription_payment_method, subscription_start_date, last_payment_date,
          next_billing_date, last_payment_amount, last_payment_status,
          paypal_email, payout_method, joined_at
        ) VALUES (
          $1, $2, $3, $4, $5, 
          true, false, $6, $6,
          'active', 2000, 'usd',
          'card', NOW(), NOW(),
          (NOW() + INTERVAL '1 month'), 2000, 'succeeded',
          $1, 'paypal', NOW()
        ) RETURNING id
      `;
      
      const userResult = await client.query(userQuery, [
        email, username, hashedPassword, firstName, lastName, activityData.totalPoints
      ]);
      
      const userId = userResult.rows[0].id;
      
      // Enroll in cycle with EXACT same points
      await client.query(`
        INSERT INTO user_cycle_points (user_id, cycle_setting_id, current_cycle_points, joined_cycle_at, is_active)
        VALUES ($1, $2, $3, NOW(), true)
      `, [userId, CYCLE_ID, activityData.totalPoints]);
      
      // Create EXACT activity records that match the calculated points
      for (const activity of activityData.activities) {
        if (activity.type === 'lesson') {
          // Create lesson completion record
          await client.query(`
            INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
            VALUES ($1, $2, true, $3, NOW(), NOW())
          `, [userId, activity.moduleId, activity.points]);
          
          // Create points history record
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'lesson_complete', $3, $4, NOW())
          `, [userId, activity.points, `Completed: ${activity.moduleTitle}`, activity.moduleId]);
          
        } else if (activity.type === 'quiz') {
          // Create quiz points history
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'quiz_complete', $3, $4, NOW())
          `, [userId, activity.points, `Quiz: ${activity.moduleTitle}`, activity.moduleId]);
          
        } else if (activity.type === 'proof') {
          // Create proof points history
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [userId, activity.points, activity.action, activity.description, userId]);
          
        } else if (activity.type === 'referral') {
          // Create referral points history
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'referral_signup', 'Referral bonus earned', $3, NOW())
          `, [userId, activity.points, userId]);
        }
      }
      
      // Create referral code if user has referrals
      const referralCount = activityData.activities.filter(a => a.type === 'referral').length;
      if (referralCount > 0) {
        const referralCode = `REF${userId.toString().padStart(4, '0')}`;
        const referralPoints = referralCount * 50;
        await client.query(`
          INSERT INTO user_referral_codes (user_id, referral_code, total_referrals, total_points_earned, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [userId, referralCode, referralCount, referralPoints]);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Created batch ${Math.floor(startIndex / BATCH_SIZE) + 1}: Users ${startIndex + 1}-${Math.min(startIndex + batchSize, TOTAL_USERS)}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error creating batch starting at ${startIndex}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log(`🚀 Creating ${TOTAL_USERS} premium test users with ACCURATE points mapping...`);
  console.log(`📊 Every user's total points = sum of their recorded actions`);
  console.log(`🔐 Password: "${PASSWORD}" for all test users`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
      await createBatchUsers(i, BATCH_SIZE);
      
      if (i + BATCH_SIZE < TOTAL_USERS) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log(`🎉 Successfully created ${TOTAL_USERS} users in ${duration} seconds!`);
    
    // Verify accuracy with detailed audit
    const auditQuery = await pool.query(`
      SELECT 
        u.id, u.username, u.total_points, ucp.current_cycle_points,
        (SELECT COALESCE(SUM(points), 0) FROM user_points_history WHERE user_id = u.id) as points_history_sum,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND completed = true) as lessons_completed,
        (SELECT COUNT(*) FROM user_points_history WHERE user_id = u.id AND action = 'quiz_complete') as quizzes_completed,
        (SELECT COUNT(*) FROM user_points_history WHERE user_id = u.id AND action IN ('debt_payment', 'investment', 'savings_upload', 'emergency_fund')) as proofs_completed,
        (SELECT COUNT(*) FROM user_points_history WHERE user_id = u.id AND action = 'referral_signup') as referrals_earned
      FROM users u
      LEFT JOIN user_cycle_points ucp ON u.id = ucp.user_id AND ucp.cycle_setting_id = $1
      WHERE u.is_admin = false
      AND u.total_points != (SELECT COALESCE(SUM(points), 0) FROM user_points_history WHERE user_id = u.id)
      LIMIT 5
    `, [CYCLE_ID]);
    
    if (auditQuery.rows.length > 0) {
      console.log('');
      console.log('❌ AUDIT ERRORS FOUND:');
      auditQuery.rows.forEach(row => {
        console.log(`   User ${row.username}: Total=${row.total_points}, History Sum=${row.points_history_sum}`);
      });
    } else {
      console.log('');
      console.log('✅ AUDIT PASSED: All user points exactly match their action records!');
    }
    
    // Final stats
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(total_points) as total_points_sum,
        AVG(total_points) as avg_points,
        MIN(total_points) as min_points,
        MAX(total_points) as max_points
      FROM users 
      WHERE is_admin = false
    `);
    
    const stats = statsQuery.rows[0];
    
    console.log('');
    console.log('📊 FINAL STATS:');
    console.log(`   Total Users: ${stats.total_users}`);
    console.log(`   Total Points: ${stats.total_points_sum.toLocaleString()}`);
    console.log(`   Average Points: ${Math.round(stats.avg_points)}`);
    console.log(`   Point Range: ${stats.min_points} - ${stats.max_points}`);
    console.log('');
    console.log('💰 POOL CALCULATION:');
    console.log(`   ${stats.total_users} users × $10 = $${(stats.total_users * 10).toLocaleString()}`);
    console.log(`   50% reward pool = $${(stats.total_users * 5).toLocaleString()}`);
    console.log('');
    console.log('🔍 TEST EXAMPLES:');
    console.log('   user1@test.com / testpass123');
    console.log('   user500@test.com / testpass123');
    console.log('   user1500@test.com / testpass123');
    console.log('');
    console.log('✅ READY FOR ACCURATE TESTING!');
    
  } catch (error) {
    console.error('❌ Failed to create test users:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);