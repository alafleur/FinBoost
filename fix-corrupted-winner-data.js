#!/usr/bin/env node

/**
 * Data Corruption Fix Script
 * 
 * Fixes corrupted rewardAmount and totalRewardPool values that were stored
 * with * 100 multiplier when they should have been stored in dollars.
 * 
 * Problem: 
 * - rewardAmount: $16 was stored as 1600 (displayed as $1,600)
 * - totalRewardPool: $7,500 was stored as 750,000 (displayed as $750,500)
 * 
 * Solution:
 * - Divide corrupted values by 100 to restore correct dollar amounts
 */

import pkg from 'pg';
const { Pool } = pkg;

async function fixCorruptedData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Starting corrupted winner data fix...');

    // Step 1: Fix corrupted rewardAmount values (divide by 100)
    console.log('\n1. Fixing corrupted rewardAmount values...');
    
    const rewardAmountFix = await pool.query(`
      UPDATE cycle_winner_selections 
      SET reward_amount = reward_amount / 100
      WHERE reward_amount > 100
        AND cycle_setting_id = 18
        AND is_sealed = true;
    `);
    
    console.log(`   ✅ Fixed ${rewardAmountFix.rowCount} corrupted rewardAmount records`);

    // Step 2: Fix corrupted totalRewardPool values (divide by 100)
    console.log('\n2. Fixing corrupted totalRewardPool values...');
    
    const poolAmountFix = await pool.query(`
      UPDATE cycle_settings 
      SET total_reward_pool = total_reward_pool / 100
      WHERE total_reward_pool > 100000
        AND id = 18;
    `);
    
    console.log(`   ✅ Fixed ${poolAmountFix.rowCount} corrupted totalRewardPool records`);

    // Step 3: Verify the fixes
    console.log('\n3. Verifying fixes...');
    
    const verifyReward = await pool.query(`
      SELECT reward_amount, COUNT(*) as count
      FROM cycle_winner_selections 
      WHERE cycle_setting_id = 18 AND is_sealed = true
      GROUP BY reward_amount
      ORDER BY reward_amount;
    `);
    
    console.log('   Reward amounts after fix:');
    verifyReward.rows.forEach(row => {
      console.log(`     $${row.reward_amount}: ${row.count} winners`);
    });

    const verifyPool = await pool.query(`
      SELECT total_reward_pool
      FROM cycle_settings 
      WHERE id = 18;
    `);
    
    console.log(`\n   Total pool after fix: $${verifyPool.rows[0]?.total_reward_pool || 'N/A'}`);

    console.log('\n✅ Data corruption fix completed successfully!');
    console.log('\n🎯 Expected results:');
    console.log('   - Winner rewards: $16 (was $1,600)');
    console.log('   - Total pool: $7,500 (was $750,500)');

  } catch (error) {
    console.error('❌ Error fixing corrupted data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
if (import.meta.url === `file://${process.argv[1]}`) {
  fixCorruptedData()
    .then(() => {
      console.log('\n🎉 All fixes applied successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fix failed:', error);
      process.exit(1);
    });
}

export { fixCorruptedData };