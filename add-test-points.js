import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addTestPoints() {
  try {
    // Get the active cycle
    const cycleResult = await pool.query(`
      SELECT id FROM cycle_settings WHERE is_active = true LIMIT 1
    `);
    
    if (cycleResult.rows.length === 0) {
      console.log('No active cycle found');
      return;
    }
    
    const cycleId = cycleResult.rows[0].id;
    console.log('Active cycle ID:', cycleId);
    
    // Get all enrolled users
    const usersResult = await pool.query(`
      SELECT user_id FROM user_cycle_points 
      WHERE cycle_setting_id = $1 AND is_active = true
      ORDER BY user_id
    `, [cycleId]);
    
    console.log(`Found ${usersResult.rows.length} enrolled users`);
    
    // Give different point amounts to create a distribution for testing percentiles
    // This will create a realistic spread for 33%/67% percentile testing
    const updates = [];
    
    for (let i = 0; i < usersResult.rows.length; i++) {
      const userId = usersResult.rows[i].user_id;
      let points;
      
      // Create a distribution:
      // Top 33% (Tier 1): 60-100 points
      // Middle 33% (Tier 2): 30-59 points  
      // Bottom 33% (Tier 3): 1-29 points
      if (i < Math.floor(usersResult.rows.length * 0.33)) {
        points = 60 + Math.floor(Math.random() * 41); // 60-100 points
      } else if (i < Math.floor(usersResult.rows.length * 0.66)) {
        points = 30 + Math.floor(Math.random() * 30); // 30-59 points
      } else {
        points = 1 + Math.floor(Math.random() * 29); // 1-29 points
      }
      
      updates.push(pool.query(`
        UPDATE user_cycle_points 
        SET current_cycle_points = $1
        WHERE user_id = $2 AND cycle_setting_id = $3
      `, [points, userId, cycleId]));
    }
    
    await Promise.all(updates);
    
    // Verify the distribution
    const statsResult = await pool.query(`
      SELECT 
        MIN(current_cycle_points) as min_points,
        MAX(current_cycle_points) as max_points,
        AVG(current_cycle_points) as avg_points,
        COUNT(*) as total_users,
        COUNT(CASE WHEN current_cycle_points >= 60 THEN 1 END) as tier1_count,
        COUNT(CASE WHEN current_cycle_points >= 30 AND current_cycle_points < 60 THEN 1 END) as tier2_count,
        COUNT(CASE WHEN current_cycle_points < 30 THEN 1 END) as tier3_count
      FROM user_cycle_points 
      WHERE cycle_setting_id = $1 AND is_active = true
    `, [cycleId]);
    
    const stats = statsResult.rows[0];
    console.log('\nPoints Distribution Created:');
    console.log(`Min: ${stats.min_points}, Max: ${stats.max_points}, Avg: ${Math.round(stats.avg_points)}`);
    console.log(`Tier 1 (60+ pts): ${stats.tier1_count} users`);
    console.log(`Tier 2 (30-59 pts): ${stats.tier2_count} users`);
    console.log(`Tier 3 (1-29 pts): ${stats.tier3_count} users`);
    console.log(`Total: ${stats.total_users} users`);
    
    console.log('\nTest points added successfully! Now we can test dynamic percentile calculations.');
    
  } catch (error) {
    console.error('Error adding test points:', error);
  } finally {
    await pool.end();
  }
}

addTestPoints();