#!/usr/bin/env node

/**
 * Test script to verify the tier assignment fix in winner selection
 * Tests the real-time tier recalculation functionality
 */

console.log('🧪 Testing Tier Assignment Fix for Winner Selection Algorithm');
console.log('='.repeat(60));

async function testTierAssignmentFix() {
  try {
    const response = await fetch('http://localhost:5000/api/admin/cycles/18/analytics', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || await getTestToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.status}`);
    }

    const analytics = await response.json();
    console.log('📊 Current Cycle Analytics:');
    console.log(`   Participants: ${analytics.participantCount}`);
    console.log(`   Pool Size: $${analytics.totalPool}`);
    console.log(`   Tier Distribution: ${JSON.stringify(analytics.tierDistribution)}`);

    // Check specific user tier assignment
    console.log('\n🔍 Checking user850@test.com tier assignment...');
    
    const usersResponse = await fetch('http://localhost:5000/api/admin/winners/data/18', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || await getTestToken()}`
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch winner data: ${usersResponse.status}`);
    }

    const winners = await usersResponse.json();
    const user850 = winners.find(w => w.userEmail === 'user850@test.com');
    
    if (!user850) {
      console.log('❌ user850@test.com not found in winner selection data');
      return false;
    }

    console.log(`📋 user850@test.com Details:`);
    console.log(`   Points: ${user850.cyclePoints}`);
    console.log(`   Tier: ${user850.tier}`);
    console.log(`   Expected: Tier 1 (points >= 180)`);

    const isCorrect = user850.cyclePoints >= 180 && user850.tier === 'tier1';
    
    if (isCorrect) {
      console.log('✅ PASS: user850@test.com correctly assigned to tier1');
      return true;
    } else {
      console.log('❌ FAIL: user850@test.com has incorrect tier assignment');
      console.log(`   Expected: tier1 (${user850.cyclePoints} >= 180)`);
      console.log(`   Actual: ${user850.tier}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function getTestToken() {
  // Try to get admin token from file
  try {
    const fs = require('fs');
    const token = fs.readFileSync('admin_token.txt', 'utf8').trim();
    return token;
  } catch (error) {
    console.log('⚠️  Could not read admin token from file, using test token');
    return 'test-token-123';
  }
}

// Run the test
testTierAssignmentFix()
  .then(result => {
    console.log('\n' + '='.repeat(60));
    if (result) {
      console.log('🎉 TIER ASSIGNMENT FIX TEST PASSED!');
      console.log('The real-time tier recalculation is working correctly.');
    } else {
      console.log('💥 TIER ASSIGNMENT FIX TEST FAILED!');
      console.log('Further debugging needed for tier calculation logic.');
    }
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });