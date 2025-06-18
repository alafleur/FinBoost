// Quick verification that the API fix is working
const jwt = require('jsonwebtoken');

async function verifyCyclePointsFix() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('🔍 Verifying cycle points API fix...');
    
    // Create a test JWT token for user ID 1 (like the login process does)
    const testToken = jwt.sign({ userId: 1 }, 'finboost-secret-key-2024');
    
    // Test the /api/auth/me endpoint with the fix
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.user) {
      const user = data.user;
      
      console.log('📊 API Response Analysis:');
      console.log(`   User: ${user.username} (ID: ${user.id})`);
      console.log(`   Current Cycle Points: ${user.currentCyclePoints}`);
      console.log(`   Tier: ${user.tier}`);
      console.log(`   Total Points: ${user.totalPoints}`);
      console.log(`   Legacy Month Points: ${user.currentMonthPoints}`);
      
      // Verify the fix worked
      if (user.currentCyclePoints === 40) {
        console.log('✅ SUCCESS: Dashboard will now show 40 cycle points!');
        console.log('✅ FIXED: Resolves "0 current pts but tier 2" inconsistency');
        
        if (user.tier === 'tier2') {
          console.log('✅ CONSISTENT: Tier 2 assignment matches 40 cycle points');
        }
        
        return true;
      } else if (user.currentCyclePoints === 0) {
        console.log('❌ ISSUE: API still returning 0 cycle points');
        console.log('   The fix may need debugging');
        return false;
      } else {
        console.log(`⚠️  UNEXPECTED: Returning ${user.currentCyclePoints} points (expected 40)`);
        return false;
      }
    } else {
      console.log('❌ FAILED: API response unsuccessful');
      console.log('   Response:', data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

// Run the verification
verifyCyclePointsFix().then(success => {
  if (success) {
    console.log('🎉 Dashboard cycle points display issue RESOLVED!');
  } else {
    console.log('🔧 Further debugging needed for cycle points display');
  }
});