import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function enrollPremiumSubscribers() {
  const client = await pool.connect();
  
  try {
    console.log('Starting premium subscriber enrollment...');
    
    // Get active cycle
    const activeCycleResult = await client.query(
      'SELECT id, cycle_name FROM cycle_settings WHERE is_active = true LIMIT 1'
    );
    
    if (activeCycleResult.rows.length === 0) {
      console.log('No active cycle found');
      return;
    }
    
    const activeCycle = activeCycleResult.rows[0];
    console.log(`Active cycle: ${activeCycle.cycle_name} (ID: ${activeCycle.id})`);
    
    // Get premium subscribers not enrolled
    const unenrolledResult = await client.query(`
      SELECT u.id, u.username, u.email 
      FROM users u 
      WHERE u.subscription_status = 'active' 
      AND u.id NOT IN (
        SELECT user_id 
        FROM user_cycle_points 
        WHERE cycle_setting_id = $1
      )
    `, [activeCycle.id]);
    
    console.log(`Found ${unenrolledResult.rows.length} premium subscribers to enroll`);
    
    // Enroll each user
    for (const user of unenrolledResult.rows) {
      await client.query(`
        INSERT INTO user_cycle_points (
          user_id, 
          cycle_setting_id, 
          current_cycle_points, 
          theoretical_points, 
          is_active, 
          joined_cycle_at, 
          last_activity_date, 
          points_rolled_over, 
          tier
        ) VALUES ($1, $2, 0, 0, true, NOW(), NOW(), 0, 'Tier 3')
      `, [user.id, activeCycle.id]);
      
      console.log(`Enrolled user: ${user.username} (${user.email})`);
    }
    
    // Verify enrollment
    const enrolledCountResult = await client.query(
      'SELECT COUNT(*) as count FROM user_cycle_points WHERE cycle_setting_id = $1',
      [activeCycle.id]
    );
    
    console.log(`Total enrolled participants: ${enrolledCountResult.rows[0].count}`);
    console.log('Enrollment completed successfully!');
    
  } catch (error) {
    console.error('Error during enrollment:', error);
  } finally {
    client.release();
  }
}

enrollPremiumSubscribers().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});