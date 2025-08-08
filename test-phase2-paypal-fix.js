const { db } = await import('./server/db.ts');
const { sql } = await import('drizzle-orm');

console.log('=== PHASE 2 VERIFICATION: PayPal Email JOIN Fix ===');
console.log('Testing both storage methods with real data...\n');

try {
  // Step 1: Find a cycle with winner selections
  console.log('🔍 Step 1: Finding cycles with winner data...');
  const cyclesWithWinners = await db.execute(sql`
    SELECT DISTINCT cws.cycle_setting_id, cs.cycle_name, COUNT(*) as winner_count
    FROM cycle_winner_selections cws
    JOIN cycle_settings cs ON cws.cycle_setting_id = cs.id
    GROUP BY cws.cycle_setting_id, cs.cycle_name
    ORDER BY cws.cycle_setting_id DESC
    LIMIT 3
  `);

  if (cyclesWithWinners.length === 0) {
    console.log('❌ No cycles with winners found - cannot test PayPal data');
    process.exit(1);
  }

  for (const cycle of cyclesWithWinners) {
    console.log(`✓ Cycle ${cycle.cycle_setting_id}: "${cycle.cycle_name}" (${cycle.winner_count} winners)`);
  }

  const testCycleId = cyclesWithWinners[0].cycle_setting_id;
  console.log(`\n🎯 Testing with Cycle ${testCycleId}: "${cyclesWithWinners[0].cycle_name}"`);

  // Step 2: Test current JOIN query directly 
  console.log('\n🔍 Step 2: Testing JOIN query directly...');
  const directJoinResults = await db.execute(sql`
    SELECT 
      cws.user_id,
      cws.tier,
      cws.tier_rank,
      u.username,
      u.email,
      u.paypal_email,
      CASE WHEN u.paypal_email IS NOT NULL AND u.paypal_email != '' 
           THEN 'Yes' 
           ELSE 'Not configured' 
      END as paypal_configured
    FROM cycle_winner_selections cws
    LEFT JOIN users u ON u.id = cws.user_id
    WHERE cws.cycle_setting_id = ${testCycleId}
    ORDER BY cws.overall_rank
    LIMIT 5
  `);

  console.log('Direct JOIN results:');
  directJoinResults.forEach((winner, index) => {
    console.log(`  ${index + 1}. ${winner.username} (${winner.email})`);
    console.log(`     PayPal: ${winner.paypal_email || 'NULL'} → ${winner.paypal_configured}`);
  });

  // Step 3: Test API endpoint simulation
  console.log('\n🔍 Step 3: Simulating API endpoint call...');
  
  // Import storage methods
  const { PostgresStorage } = await import('./server/storage.ts');
  const storage = new PostgresStorage();

  // Test getCycleWinnerDetailsPaginated (primary endpoint)
  console.log('Testing getCycleWinnerDetailsPaginated...');
  const paginatedResults = await storage.getCycleWinnerDetailsPaginated(testCycleId, 1, 5);
  
  console.log(`Paginated API Results (${paginatedResults.totalCount} total):`);
  paginatedResults.winners.forEach((winner, index) => {
    console.log(`  ${index + 1}. ${winner.username} (${winner.email})`);
    console.log(`     PayPal: ${winner.paypalEmail || 'NULL'} → ${winner.paypalConfigured}`);
  });

  // Step 4: Test getCycleWinnerDetails (secondary endpoint)  
  console.log('\n🔍 Step 4: Testing getCycleWinnerDetails...');
  const fullResults = await storage.getCycleWinnerDetails(testCycleId);
  
  console.log(`Full API Results (${fullResults.winners.length} total):`);
  fullResults.winners.slice(0, 3).forEach((winner, index) => {
    console.log(`  ${index + 1}. ${winner.username} (${winner.email})`);
    console.log(`     PayPal: ${winner.paypalEmail || 'NULL'} → ${winner.paypalConfigured}`);
  });

  // Step 5: Validation summary
  console.log('\n📊 VALIDATION SUMMARY:');
  
  const allDataMatches = paginatedResults.winners.every((winner, index) => {
    const directWinner = directJoinResults[index];
    return winner.paypalEmail === directWinner?.paypal_email &&
           winner.paypalConfigured === directWinner?.paypal_configured;
  });

  if (allDataMatches) {
    console.log('✅ SUCCESS: API endpoints now return correct PayPal data from users table');
    console.log('✅ SUCCESS: paypalConfigured computed field working correctly');
    console.log('✅ SUCCESS: JOIN with users table implemented properly');
  } else {
    console.log('❌ FAILURE: Data mismatch between direct query and API endpoints');
  }

  // Step 6: Test specific user example if available
  const userWithPayPal = directJoinResults.find(w => w.paypal_email);
  const userWithoutPayPal = directJoinResults.find(w => !w.paypal_email);

  console.log('\n🔍 Test Cases:');
  if (userWithPayPal) {
    console.log(`✓ User WITH PayPal: ${userWithPayPal.username} → "${userWithPayPal.paypal_configured}"`);
  }
  if (userWithoutPayPal) {
    console.log(`✓ User WITHOUT PayPal: ${userWithoutPayPal.username} → "${userWithoutPayPal.paypal_configured}"`);
  }

  console.log('\n🎯 PHASE 2 VERIFICATION COMPLETE');

} catch (error) {
  console.error('❌ ERROR during Phase 2 verification:', error);
  console.error(error.stack);
  process.exit(1);
}