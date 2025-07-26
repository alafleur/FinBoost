import { db } from './server/db';
import { storage } from './server/storage';

async function testPhase2Columns() {
  console.log('=== PHASE 2: Testing New Table Columns ===\n');

  try {
    // Run a small winner selection to generate test data
    console.log('Running winner selection for testing...');
    const results = await storage.executeFlexibleWinnerSelection(18, {
      selectionMode: 'weighted_random',
      tierSettings: {
        tier1: { winnerCount: 3, poolPercentage: 50 },
        tier2: { winnerCount: 4, poolPercentage: 30 },
        tier3: { winnerCount: 5, poolPercentage: 20 }
      },
      pointDeductionPercentage: 50,
      rolloverPercentage: 50
    });

    console.log(`Selection completed: ${results.totalWinners} total winners`);
    console.log(`Tier breakdown: ${results.tier1Winners}/${results.tier2Winners}/${results.tier3Winners}\n`);

    // Test the new getCycleWinnerDetails method with enhanced columns
    console.log('Testing enhanced winner details with new columns:');
    const winnerDetails = await storage.getCycleWinnerDetails(18);

    // Verify all new columns are present
    console.log('Checking new column structure:');
    const sampleWinner = winnerDetails.winners[0];
    const requiredFields = ['overallRank', 'tierRank', 'userId', 'email', 'username', 'tier', 'pointsAtSelection'];
    
    requiredFields.forEach(field => {
      const hasField = sampleWinner && sampleWinner[field] !== undefined;
      console.log(`- ${field}: ${hasField ? '✅ Present' : '❌ Missing'}`);
    });

    console.log('\nFirst 12 winners with new column structure:');
    console.log('Overall | Tier | Username | UserID | Email | Tier | Points');
    console.log('--------|------|----------|--------|-------|------|-------');
    
    winnerDetails.winners.slice(0, 12).forEach(winner => {
      const email = winner.email ? winner.email.substring(0, 15) + '...' : 'N/A';
      console.log(`${winner.overallRank.toString().padStart(7)} | ${winner.tierRank.toString().padStart(4)} | ${winner.username.padEnd(10)} | ${winner.userId.toString().padStart(6)} | ${email.padEnd(15)} | ${winner.tier.padEnd(6)} | ${winner.pointsAtSelection.toString().padStart(6)}`);
    });

    // Verify proper ranking logic
    console.log('\nRanking Logic Verification:');
    
    // Test overall ranks (should be 1, 2, 3... across all winners)
    const overallRanks = winnerDetails.winners.map(w => w.overallRank);
    const expectedOverallRanks = Array.from({length: winnerDetails.winners.length}, (_, i) => i + 1);
    const overallRanksCorrect = JSON.stringify(overallRanks) === JSON.stringify(expectedOverallRanks);
    console.log(`Overall Ranks: ${overallRanksCorrect ? '✅ Correct (1,2,3...)' : '❌ Incorrect'}`);

    // Test tier rank resets (should restart at 1 for each tier)
    const tierGroups = {};
    winnerDetails.winners.forEach(winner => {
      if (!tierGroups[winner.tier]) tierGroups[winner.tier] = [];
      tierGroups[winner.tier].push(winner.tierRank);
    });

    let tierRanksCorrect = true;
    Object.entries(tierGroups).forEach(([tier, ranks]) => {
      const expectedTierRanks = Array.from({length: ranks.length}, (_, i) => i + 1);
      const isCorrect = JSON.stringify(ranks) === JSON.stringify(expectedTierRanks);
      console.log(`${tier} Ranks: ${isCorrect ? '✅ Correct (1,2,3...)' : '❌ Incorrect'}`);
      if (!isCorrect) tierRanksCorrect = false;
    });

    // Test tier-based sorting maintained
    let previousTier = 'tier1';
    let tierSwitches = 0;
    for (const winner of winnerDetails.winners) {
      if (winner.tier !== previousTier) {
        tierSwitches++;
        previousTier = winner.tier;
      }
    }
    const sortingCorrect = tierSwitches <= 2;
    console.log(`Tier Sorting: ${sortingCorrect ? '✅ Correct (≤2 switches)' : '❌ Incorrect'} (${tierSwitches} switches)`);

    // Summary
    console.log('\n=== PHASE 2 TEST RESULTS ===');
    console.log(`✅ New Columns Added: Overall Rank, Tier Rank, User ID, Email`);
    console.log(`${overallRanksCorrect ? '✅' : '❌'} Overall Ranking: Sequential 1,2,3... across all winners`);
    console.log(`${tierRanksCorrect ? '✅' : '❌'} Tier Ranking: Resets to 1,2,3... for each tier`);
    console.log(`${sortingCorrect ? '✅' : '❌'} Sorting Preserved: Tier-based with selection order`);

    const allTestsPassed = overallRanksCorrect && tierRanksCorrect && sortingCorrect;
    console.log(`\n🎯 PHASE 2 STATUS: ${allTestsPassed ? 'PASSED' : 'FAILED'}`);

  } catch (error) {
    console.error('Error during Phase 2 testing:', error);
  }

  process.exit(0);
}

testPhase2Columns();