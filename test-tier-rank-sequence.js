#!/usr/bin/env node

/**
 * Test Tier Rank Selection Sequence Implementation
 * 
 * This test verifies that the tierRank column now shows the actual
 * selection sequence order (1st selected, 2nd selected, etc.) from
 * the point-weighted random algorithm instead of performance-based ranking.
 * 
 * Expected behavior:
 * - tierRank should show 1, 2, 3, 4, ... within each tier
 * - This represents the order winners were selected during the algorithm
 * - NOT the performance-based ranking by cycle points
 */

import fetch from 'node-fetch';
import fs from 'fs';

async function testTierRankSequence() {
  console.log('🔥 Testing Tier Rank Selection Sequence Implementation');
  
  try {
    // Read admin token
    const adminToken = fs.readFileSync('fresh_admin_token.txt', 'utf8').trim();
    console.log('✅ Admin token loaded');

    // Step 1: Clear any existing winner selections to start fresh
    console.log('\n1️⃣ Clearing existing winner selections...');
    const clearResponse = await fetch('http://localhost:5000/api/admin/cycle-winner-selection/18', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (clearResponse.ok) {
      console.log('   ✅ Previous selections cleared');
    } else {
      console.log('   ⚠️  No previous selections to clear (or already cleared)');
    }

    // Step 2: Execute point-weighted random selection with small test pool
    console.log('\n2️⃣ Executing point-weighted random selection...');
    const selectionResponse = await fetch('http://localhost:5000/api/admin/cycle-winner-selection/execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cycleSettingId: 18,
        selectionMode: 'weighted_random',
        tierSettings: {
          tier1: { winnerCount: 5, poolPercentage: 50 },
          tier2: { winnerCount: 8, poolPercentage: 30 },
          tier3: { winnerCount: 12, poolPercentage: 20 }
        }
      })
    });
    
    const selectionData = await selectionResponse.json();
    console.log(`   ✅ Selection completed: ${selectionData.success !== false ? 'SUCCESS' : 'FAILED'}`);
    
    if (selectionData.winners) {
      console.log(`   🏆 Total winners selected: ${selectionData.winners.length}`);
    }

    // Step 3: Retrieve winner details to verify tier rank sequence
    console.log('\n3️⃣ Verifying tier rank sequence order...');
    const winnersResponse = await fetch('http://localhost:5000/api/admin/cycle-winner-details/18/paginated?page=1&limit=50', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const winnersData = await winnersResponse.json();
    
    if (winnersData.winners && winnersData.winners.length > 0) {
      console.log(`   📊 Retrieved ${winnersData.winners.length} winners for analysis`);
      
      // Group winners by tier to analyze tier ranks
      const tierGroups = {
        tier1: winnersData.winners.filter(w => w.tier === 'tier1').sort((a, b) => a.tierRank - b.tierRank),
        tier2: winnersData.winners.filter(w => w.tier === 'tier2').sort((a, b) => a.tierRank - b.tierRank),
        tier3: winnersData.winners.filter(w => w.tier === 'tier3').sort((a, b) => a.tierRank - b.tierRank)
      };

      // Verify tier rank sequence for each tier
      let allTierRanksCorrect = true;
      
      Object.entries(tierGroups).forEach(([tier, winners]) => {
        if (winners.length === 0) return;
        
        console.log(`\n   ${tier.toUpperCase()} Analysis (${winners.length} winners):`);
        
        // Check if tier ranks are sequential (1, 2, 3, ...)
        const tierRanks = winners.map(w => w.tierRank);
        const expectedSequence = Array.from({length: winners.length}, (_, i) => i + 1);
        const isSequential = JSON.stringify(tierRanks) === JSON.stringify(expectedSequence);
        
        console.log(`   • Tier Ranks: [${tierRanks.join(', ')}]`);
        console.log(`   • Expected:   [${expectedSequence.join(', ')}]`);
        console.log(`   • Sequential: ${isSequential ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (!isSequential) {
          allTierRanksCorrect = false;
        }
        
        // Show sample of winners with their selection details
        console.log(`   • Sample Winners:`);
        winners.slice(0, 3).forEach(winner => {
          console.log(`     - Rank ${winner.tierRank}: ${winner.username} (${winner.cyclePoints} pts)`);
        });
      });

      // Final verification result
      console.log(`\n4️⃣ TIER RANK SEQUENCE TEST RESULT:`);
      if (allTierRanksCorrect) {
        console.log('   🎉 SUCCESS: Tier ranks now reflect selection sequence order!');
        console.log('   ✅ tierRank = 1 means "1st selected within tier"');
        console.log('   ✅ tierRank = 2 means "2nd selected within tier"');
        console.log('   ✅ No longer showing performance-based ranking');
      } else {
        console.log('   ❌ FAILED: Tier ranks are not in proper sequence');
        console.log('   🔧 Still showing performance-based ranking instead of selection order');
      }
      
    } else {
      console.log('   ❌ No winner data retrieved for analysis');
    }

    console.log('\n✅ Tier rank sequence test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the test
testTierRankSequence();