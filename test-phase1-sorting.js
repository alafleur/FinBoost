import { db } from './server/db';
import { storage } from './server/storage';

async function testPhase1Sorting() {
  console.log('=== PHASE 1: Testing Display Order Fix ===\n');
  
  try {
    // Run winner selection with small test numbers
    console.log('Running winner selection...');
    const results = await storage.executeFlexibleWinnerSelection(18, {
      selectionMode: 'weighted_random',
      tierSettings: {
        tier1: { winnerCount: 5, poolPercentage: 50 },
        tier2: { winnerCount: 5, poolPercentage: 30 },
        tier3: { winnerCount: 10, poolPercentage: 20 }
      },
      pointDeductionPercentage: 50,
      rolloverPercentage: 50
    });

    console.log('Selection completed:', results.message);
    console.log(`Total winners: ${results.totalWinners}`);
    console.log(`Tier 1: ${results.tier1Winners} | Tier 2: ${results.tier2Winners} | Tier 3: ${results.tier3Winners}\n`);

    // Test the new sorting order
    console.log('Testing display order (should be sorted by tier, then by selection_date ASC):');
    const winnerDetails = await storage.getCycleWinnerDetails(18);
    
    console.log('First 15 winners (showing tier and selection order):');
    winnerDetails.winners.slice(0, 15).forEach((winner, index) => {
      const selectionTime = new Date(winner.selectionDate).toISOString().substr(11, 12);
      console.log(`${index + 1}. ${winner.username} - ${winner.tier} - Points: ${winner.pointsAtSelection} - Time: ${selectionTime}`);
    });

    // Verify tier grouping
    const tierCounts = winnerDetails.winners.reduce((acc, winner) => {
      acc[winner.tier] = (acc[winner.tier] || 0) + 1;
      return acc;
    }, {});

    console.log('\nTier grouping verification:');
    console.log(`Tier 1: ${tierCounts.tier1 || 0} winners`);
    console.log(`Tier 2: ${tierCounts.tier2 || 0} winners`);
    console.log(`Tier 3: ${tierCounts.tier3 || 0} winners`);

    // Check if sorting is working properly
    let currentTier = 'tier1';
    let tierSwitchCount = 0;
    for (const winner of winnerDetails.winners) {
      if (winner.tier !== currentTier) {
        tierSwitchCount++;
        currentTier = winner.tier;
      }
    }

    console.log(`\nSorting verification: ${tierSwitchCount <= 2 ? 'PASSED' : 'FAILED'}`);
    console.log(`(Expected: ≤2 tier switches, Actual: ${tierSwitchCount})`);

    console.log('\n=== PHASE 1 TESTING COMPLETE ===');
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
  
  process.exit(0);
}

testPhase1Sorting();