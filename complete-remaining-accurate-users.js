import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CYCLE_ID = 18;
const START_INDEX = 700;
const REMAINING_USERS = 800;
const PASSWORD = 'testpass123';
const BATCH_SIZE = 100; // Larger batches for speed

const MODULES = [
  { id: 1, title: 'Budgeting Basics' },
  { id: 11, title: 'Zero-Based Budgeting' },
  { id: 4, title: 'Credit Management' },
  { id: 8, title: 'Understanding Credit Scores' },
  { id: 9, title: 'Debt Snowball vs Avalanche' },
  { id: 3, title: 'Investment Basics' }
];

const PROOF_ACTIONS = [
  { action: 'debt_payment', points: 50, description: 'Debt Payment Proof' },
  { action: 'investment', points: 40, description: 'Investment Proof' },
  { action: 'savings_upload', points: 30, description: 'Savings Goal Achievement' }
];

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

function generateUsername(index) {
  const prefixes = ['fin', 'money', 'budget', 'wealth', 'smart', 'save'];
  const suffixes = ['master', 'pro', 'guru', 'saver', 'builder', 'planner'];
  
  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[Math.floor(index / prefixes.length) % suffixes.length];
  const number = index + 1;
  
  return `${prefix}${suffix}${number}`;
}

function generateAccurateActivity(userIndex) {
  const engagementLevel = Math.random();
  
  let activities = [];
  let totalPoints = 0;
  
  if (engagementLevel > 0.7) {
    // High engagement: 4-6 lessons
    const numLessons = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < Math.min(numLessons, MODULES.length); i++) {
      // Lesson: 20 points
      activities.push({
        type: 'lesson',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: 20
      });
      totalPoints += 20;
      
      // Quiz: 10-20 points
      const quizPoints = Math.floor(Math.random() * 11) + 10;
      activities.push({
        type: 'quiz',
        moduleId: MODULES[i].id,
        moduleTitle: MODULES[i].title,
        points: quizPoints
      });
      totalPoints += quizPoints;
    }
    
    // Maybe add 1-2 proofs
    const numProofs = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < Math.min(numProofs, PROOF_ACTIONS.length); i++) {
      activities.push({
        type: 'proof',
        action: PROOF_ACTIONS[i].action,
        description: PROOF_ACTIONS[i].description,
        points: PROOF_ACTIONS[i].points
      });
      totalPoints += PROOF_ACTIONS[i].points;
    }
    
    // Maybe add 1 referral
    if (Math.random() > 0.5) {
      activities.push({
        type: 'referral',
        points: 50
      });
      totalPoints += 50;
    }
    
  } else if (engagementLevel > 0.4) {
    // Medium engagement: 2-3 lessons
    const numLessons = 2 + Math.floor(Math.random() * 2);
    
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
    
    // Maybe add 1 proof
    if (Math.random() > 0.5) {
      activities.push({
        type: 'proof',
        action: PROOF_ACTIONS[0].action,
        description: PROOF_ACTIONS[0].description,
        points: PROOF_ACTIONS[0].points
      });
      totalPoints += PROOF_ACTIONS[0].points;
    }
    
  } else if (engagementLevel > 0.2) {
    // Low engagement: 1-2 lessons
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
  
  return { activities, totalPoints };
}

async function createBatchUsers(startIndex, batchSize) {
  const client = await pool.connect();
  const hashedPassword = await hashPassword(PASSWORD);
  
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < batchSize; i++) {
      const userIndex = startIndex + i;
      if (userIndex >= START_INDEX + REMAINING_USERS) break;
      
      const username = generateUsername(userIndex);
      const email = `user${userIndex + 1}@test.com`;
      const activityData = generateAccurateActivity(userIndex);
      
      const firstName = username.charAt(0).toUpperCase() + username.slice(1, -1);
      
      // Create user with exact calculated points
      const userResult = await client.query(`
        INSERT INTO users (
          email, username, password, first_name, last_name, 
          is_active, is_admin, total_points, current_month_points,
          subscription_status, subscription_amount, subscription_currency,
          subscription_payment_method, subscription_start_date, last_payment_date,
          next_billing_date, last_payment_amount, last_payment_status,
          paypal_email, payout_method, joined_at
        ) VALUES (
          $1, $2, $3, $4, 'User', 
          true, false, $5, $5,
          'active', 2000, 'usd',
          'card', NOW(), NOW(),
          (NOW() + INTERVAL '1 month'), 2000, 'succeeded',
          $1, 'paypal', NOW()
        ) RETURNING id
      `, [email, username, hashedPassword, firstName, activityData.totalPoints]);
      
      const userId = userResult.rows[0].id;
      
      // Enroll in cycle with exact same points
      await client.query(`
        INSERT INTO user_cycle_points (user_id, cycle_setting_id, current_cycle_points, joined_cycle_at, is_active)
        VALUES ($1, $2, $3, NOW(), true)
      `, [userId, CYCLE_ID, activityData.totalPoints]);
      
      // Create exact activity records
      for (const activity of activityData.activities) {
        if (activity.type === 'lesson') {
          await client.query(`
            INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
            VALUES ($1, $2, true, $3, NOW(), NOW())
          `, [userId, activity.moduleId, activity.points]);
          
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'lesson_complete', $3, $4, NOW())
          `, [userId, activity.points, `Completed: ${activity.moduleTitle}`, activity.moduleId]);
          
        } else if (activity.type === 'quiz') {
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'quiz_complete', $3, $4, NOW())
          `, [userId, activity.points, `Quiz: ${activity.moduleTitle}`, activity.moduleId]);
          
        } else if (activity.type === 'proof') {
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [userId, activity.points, activity.action, activity.description, userId]);
          
        } else if (activity.type === 'referral') {
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'referral_signup', 'Referral bonus earned', $3, NOW())
          `, [userId, activity.points, userId]);
        }
      }
      
      // Create referral code if needed
      const referralCount = activityData.activities.filter(a => a.type === 'referral').length;
      if (referralCount > 0) {
        const referralCode = `REF${userId.toString().padStart(4, '0')}`;
        await client.query(`
          INSERT INTO user_referral_codes (user_id, referral_code, total_referrals, total_points_earned, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [userId, referralCode, referralCount, referralCount * 50]);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Batch ${Math.floor((startIndex - START_INDEX) / BATCH_SIZE) + 1}: Users ${startIndex + 1}-${Math.min(startIndex + batchSize, START_INDEX + REMAINING_USERS)}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error at ${startIndex}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log(`🚀 Creating remaining ${REMAINING_USERS} users (starting from ${START_INDEX + 1})...`);
  
  try {
    for (let i = START_INDEX; i < START_INDEX + REMAINING_USERS; i += BATCH_SIZE) {
      await createBatchUsers(i, BATCH_SIZE);
    }
    
    // Verify accuracy
    const auditQuery = await pool.query(`
      SELECT COUNT(*) as error_count
      FROM users u
      WHERE u.is_admin = false
      AND u.total_points != (SELECT COALESCE(SUM(points), 0) FROM user_points_history WHERE user_id = u.id)
    `);
    
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(total_points) as total_points
      FROM users 
      WHERE is_admin = false
    `);
    
    const stats = statsQuery.rows[0];
    const errors = auditQuery.rows[0].error_count;
    
    console.log('');
    console.log(`✅ Completed! Total users: ${stats.total_users}`);
    console.log(`📊 Pool: ${stats.total_users} × $10 = $${(stats.total_users * 10).toLocaleString()}`);
    
    if (errors > 0) {
      console.log(`❌ Found ${errors} users with point mismatches`);
    } else {
      console.log(`✅ All users have accurate points mapping!`);
    }
    
  } catch (error) {
    console.error('❌ Failed:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);