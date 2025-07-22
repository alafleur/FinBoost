import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CYCLE_ID = 18;
const START_INDEX = 1300;
const FINAL_USERS = 200;
const PASSWORD = 'testpass123';

async function main() {
  console.log(`🚀 Creating final ${FINAL_USERS} users (starting from user${START_INDEX + 1})...`);
  
  const client = await pool.connect();
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < FINAL_USERS; i++) {
      const userIndex = START_INDEX + i;
      const username = `finaluser${userIndex + 1}`;
      const email = `user${userIndex + 1}@test.com`;
      
      // Simple points: 1-2 lessons with quizzes
      const numLessons = 1 + Math.floor(Math.random() * 2);
      let totalPoints = 0;
      
      // Each lesson = 20 + quiz (10-20) = 30-40 points
      for (let j = 0; j < numLessons; j++) {
        totalPoints += 20; // lesson
        totalPoints += 10 + Math.floor(Math.random() * 11); // quiz
      }
      
      // Maybe add one proof action (50 points)
      if (Math.random() > 0.7) {
        totalPoints += 50;
      }
      
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
          $1, $2, $3, 'Final', 'User', 
          true, false, $4, $4,
          'active', 1000, 'usd',
          'card', NOW(), NOW(),
          (NOW() + INTERVAL '1 month'), 1000, 'succeeded',
          $1, 'paypal', NOW()
        ) RETURNING id
      `, [email, username, hashedPassword, totalPoints]);
      
      const userId = userResult.rows[0].id;
      
      // Enroll in cycle
      await client.query(`
        INSERT INTO user_cycle_points (user_id, cycle_setting_id, current_cycle_points, joined_cycle_at, is_active)
        VALUES ($1, $2, $3, NOW(), true)
      `, [userId, CYCLE_ID, totalPoints]);
      
      // Create matching points history
      let pointsAdded = 0;
      
      // Add lesson completions
      for (let j = 0; j < numLessons; j++) {
        const moduleId = 1 + j; // Use modules 1, 2
        
        // Lesson points (20)
        await client.query(`
          INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
          VALUES ($1, $2, true, 20, NOW(), NOW())
        `, [userId, moduleId]);
        
        await client.query(`
          INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
          VALUES ($1, 20, 'lesson_complete', 'Completed lesson', $2, NOW())
        `, [userId, moduleId]);
        pointsAdded += 20;
        
        // Quiz points (10-20)
        const quizPoints = 10 + Math.floor(Math.random() * 11);
        await client.query(`
          INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
          VALUES ($1, $2, 'quiz_complete', 'Completed quiz', $3, NOW())
        `, [userId, quizPoints, moduleId]);
        pointsAdded += quizPoints;
      }
      
      // Add proof if needed
      if (totalPoints - pointsAdded > 0) {
        const proofPoints = totalPoints - pointsAdded;
        await client.query(`
          INSERT INTO user_points_history (user_id, points, action, description, related_id, created_at)
          VALUES ($1, $2, 'debt_payment', 'Debt payment proof', $3, NOW())
        `, [userId, proofPoints, userId]);
      }
      
      if ((i + 1) % 50 === 0) {
        console.log(`✅ Created ${i + 1}/${FINAL_USERS} users`);
      }
    }
    
    await client.query('COMMIT');
    
    // Final stats
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(total_points) as total_points,
        AVG(total_points) as avg_points
      FROM users 
      WHERE is_admin = false
    `);
    
    const stats = statsQuery.rows[0];
    
    console.log('');
    console.log(`🎉 FINAL COMPLETION!`);
    console.log(`👥 Total Users: ${stats.total_users}`);
    console.log(`📊 Total Points: ${stats.total_points.toLocaleString()}`);
    console.log(`📊 Average Points: ${Math.round(stats.avg_points)}`);
    console.log(`💰 Pool: ${stats.total_users} × $10 = $${(stats.total_users * 10).toLocaleString()}`);
    console.log(`💰 50% reward pool = $${(stats.total_users * 5).toLocaleString()}`);
    console.log('');
    console.log('✅ READY FOR ASPIRATIONAL SCREENSHOTS!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);