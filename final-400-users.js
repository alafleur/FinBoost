import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CYCLE_ID = 18;
const START_INDEX = 1100;
const FINAL_USERS = 400;
const PASSWORD = 'testpass123';

const MODULES = [
  { id: 1, title: 'Budgeting Basics' },
  { id: 4, title: 'Credit Management' },
  { id: 3, title: 'Investment Basics' }
];

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

function generateUsername(index) {
  const prefixes = ['smart', 'wise', 'money', 'wealth'];
  const suffixes = ['saver', 'builder', 'winner', 'achiever'];
  
  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[Math.floor(index / prefixes.length) % suffixes.length];
  const number = index + 1;
  
  return `${prefix}${suffix}${number}`;
}

async function main() {
  console.log(`🚀 Creating final ${FINAL_USERS} users...`);
  
  const client = await pool.connect();
  const hashedPassword = await hashPassword(PASSWORD);
  
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < FINAL_USERS; i++) {
      const userIndex = START_INDEX + i;
      const username = generateUsername(userIndex);
      const email = `user${userIndex + 1}@test.com`;
      
      // Simple activity pattern
      const engagementLevel = Math.random();
      let totalPoints = 0;
      let activities = [];
      
      if (engagementLevel > 0.5) {
        // 2-3 lessons with quizzes
        const numLessons = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < Math.min(numLessons, MODULES.length); j++) {
          const lessonPoints = 20;
          const quizPoints = 10 + Math.floor(Math.random() * 11);
          totalPoints += lessonPoints + quizPoints;
          activities.push({
            moduleId: MODULES[j].id,
            moduleTitle: MODULES[j].title,
            lessonPoints,
            quizPoints
          });
        }
        
        // Maybe add proof
        if (Math.random() > 0.7) {
          totalPoints += 50;
          activities.push({ type: 'proof', points: 50 });
        }
      } else {
        // 1 lesson with quiz
        const lessonPoints = 20;
        const quizPoints = 10 + Math.floor(Math.random() * 11);
        totalPoints += lessonPoints + quizPoints;
        activities.push({
          moduleId: MODULES[0].id,
          moduleTitle: MODULES[0].title,
          lessonPoints,
          quizPoints
        });
      }
      
      const firstName = username.charAt(0).toUpperCase() + username.slice(1, -1);
      
      // Create user
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
          'active', 1000, 'usd',
          'card', NOW(), NOW(),
          (NOW() + INTERVAL '1 month'), 1000, 'succeeded',
          $1, 'paypal', NOW()
        ) RETURNING id
      `, [email, username, hashedPassword, firstName, totalPoints]);
      
      const userId = userResult.rows[0].id;
      
      // Enroll in cycle
      await client.query(`
        INSERT INTO user_cycle_points (user_id, cycle_setting_id, current_cycle_points, joined_cycle_at, is_active)
        VALUES ($1, $2, $3, NOW(), true)
      `, [userId, CYCLE_ID, totalPoints]);
      
      // Create activity records
      for (const activity of activities) {
        if (activity.moduleId) {
          // Lesson completion
          await client.query(`
            INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
            VALUES ($1, $2, true, $3, NOW(), NOW())
          `, [userId, activity.moduleId, activity.lessonPoints]);
          
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'lesson_complete', $3, $4, NOW())
          `, [userId, activity.lessonPoints, `Completed: ${activity.moduleTitle}`, activity.moduleId]);
          
          // Quiz completion
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'quiz_complete', $3, $4, NOW())
          `, [userId, activity.quizPoints, `Quiz: ${activity.moduleTitle}`, activity.moduleId]);
        }
        
        if (activity.type === 'proof') {
          await client.query(`
            INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
            VALUES ($1, $2, 'debt_payment', 'Debt Payment Proof', $3, NOW())
          `, [userId, activity.points, userId]);
        }
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`✅ Created ${i + 1}/${FINAL_USERS} users`);
      }
    }
    
    await client.query('COMMIT');
    
    // Final verification
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(total_points) as total_points,
        AVG(total_points) as avg_points
      FROM users 
      WHERE is_admin = false
    `);
    
    const auditQuery = await pool.query(`
      SELECT COUNT(*) as error_count
      FROM users u
      WHERE u.is_admin = false
      AND u.total_points != (SELECT COALESCE(SUM(points), 0) FROM user_points_history WHERE user_id = u.id)
    `);
    
    const stats = statsQuery.rows[0];
    const errors = auditQuery.rows[0].error_count;
    
    console.log('');
    console.log(`🎉 COMPLETED! Total users: ${stats.total_users}`);
    console.log(`📊 Total points: ${stats.total_points.toLocaleString()}`);
    console.log(`📊 Average points: ${Math.round(stats.avg_points)}`);
    console.log(`💰 Pool: ${stats.total_users} × $10 = $${(stats.total_users * 10).toLocaleString()}`);
    console.log(`💰 50% reward pool = $${(stats.total_users * 5).toLocaleString()}`);
    
    if (errors > 0) {
      console.log(`❌ Found ${errors} users with point mismatches`);
    } else {
      console.log(`✅ All users have accurate points mapping!`);
    }
    
    console.log('');
    console.log('🔍 TEST EXAMPLES:');
    console.log('   user1@test.com / testpass123');
    console.log('   user750@test.com / testpass123');
    console.log('   user1500@test.com / testpass123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);