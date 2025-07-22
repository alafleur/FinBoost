import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function generateVisualSummary() {
  console.log('📊 FINBOOST 1500-MEMBER COMMUNITY SUMMARY');
  console.log('═'.repeat(60));
  console.log('');
  
  // Get comprehensive stats
  const statsQuery = await pool.query(`
    SELECT 
      COUNT(*) as total_users,
      SUM(total_points) as total_points,
      ROUND(AVG(total_points)) as avg_points,
      MIN(total_points) as min_points,
      MAX(total_points) as max_points,
      COUNT(CASE WHEN total_points > 100 THEN 1 END) as high_performers,
      COUNT(CASE WHEN total_points BETWEEN 30 AND 100 THEN 1 END) as medium_performers,
      COUNT(CASE WHEN total_points < 30 THEN 1 END) as low_performers
    FROM users 
    WHERE is_admin = false
  `);
  
  const stats = statsQuery.rows[0];
  
  // Calculate pool breakdown
  const totalPool = stats.total_users * 10;
  const rewardPool = totalPool * 0.5;
  const tier1Pool = rewardPool * 0.5;
  const tier2Pool = rewardPool * 0.3;
  const tier3Pool = rewardPool * 0.2;
  
  console.log('🏆 COMMUNITY SCALE');
  console.log(`   Total Members: ${stats.total_users.toLocaleString()}`);
  console.log(`   Total Points: ${stats.total_points.toLocaleString()}`);
  console.log(`   Average Points: ${stats.avg_points}`);
  console.log(`   Point Range: ${stats.min_points} - ${stats.max_points}`);
  console.log('');
  
  console.log('💰 REWARD POOL BREAKDOWN');
  console.log(`   Total Pool: $${totalPool.toLocaleString()}`);
  console.log(`   Reward Pool (50%): $${rewardPool.toLocaleString()}`);
  console.log(`   ├─ Tier 1 (50%): $${tier1Pool.toLocaleString()}`);
  console.log(`   ├─ Tier 2 (30%): $${tier2Pool.toLocaleString()}`);
  console.log(`   └─ Tier 3 (20%): $${tier3Pool.toLocaleString()}`);
  console.log('');
  
  console.log('📈 ENGAGEMENT DISTRIBUTION');
  console.log(`   High Performers (>100 pts): ${stats.high_performers} users`);
  console.log(`   Medium Performers (30-100): ${stats.medium_performers} users`);
  console.log(`   Low Performers (<30 pts): ${stats.low_performers} users`);
  console.log('');
  
  // Get cycle info
  const cycleQuery = await pool.query(`
    SELECT 
      cycle_name,
      COUNT(ucp.user_id) as enrolled_users,
      reward_pool_percentage,
      minimum_pool_guarantee / 100.0 as min_guarantee
    FROM cycle_settings cs
    LEFT JOIN user_cycle_points ucp ON cs.id = ucp.cycle_setting_id AND ucp.is_active = true
    WHERE cs.status = 'active'
    GROUP BY cs.id, cs.cycle_name, cs.reward_pool_percentage, cs.minimum_pool_guarantee
  `);
  
  if (cycleQuery.rows.length > 0) {
    const cycle = cycleQuery.rows[0];
    console.log('⚡ ACTIVE CYCLE');
    console.log(`   Cycle: ${cycle.cycle_name}`);
    console.log(`   Enrolled: ${cycle.enrolled_users.toLocaleString()} users`);
    console.log(`   Pool %: ${cycle.reward_pool_percentage}%`);
    console.log(`   Min Guarantee: $${cycle.min_guarantee.toLocaleString()}`);
    console.log('');
  }
  
  console.log('🔍 TEST ACCESS');
  console.log('   Password: testpass123 (all users)');
  console.log('   Examples:');
  console.log('   ├─ user1@test.com');
  console.log('   ├─ user750@test.com');
  console.log('   └─ user1500@test.com');
  console.log('');
  
  console.log('✅ READY FOR ASPIRATIONAL SCREENSHOTS!');
  console.log('   • Admin analytics showing 1500 users');
  console.log('   • $7,500 reward pool displays');
  console.log('   • Large community leaderboards');
  console.log('   • Individual user dashboards with community stats');
  console.log('');
  
  // Sample a few users for verification
  const sampleQuery = await pool.query(`
    SELECT username, total_points, 
           (SELECT COUNT(*) FROM user_points_history WHERE user_id = users.id) as action_count
    FROM users 
    WHERE is_admin = false 
    ORDER BY RANDOM() 
    LIMIT 5
  `);
  
  console.log('🎯 SAMPLE USER VERIFICATION');
  sampleQuery.rows.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.username}: ${user.total_points} pts (${user.action_count} actions)`);
  });
  
  await pool.end();
}

generateVisualSummary().catch(console.error);