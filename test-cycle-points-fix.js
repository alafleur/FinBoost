// Test script to verify cycle points data flow fix
const baseUrl = 'http://localhost:5000';

async function testCyclePointsDataFlow() {
  try {
    console.log('🔄 Testing cycle points data flow fix...');
    
    // Step 1: Login with f3l3 user
    console.log('1. Attempting login for f3l3...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'f3l3@email.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Login response:', loginData);
    
    if (!loginData.success) {
      console.log('❌ Login failed, trying alternative credentials...');
      
      // Try with username instead
      const altLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'f3l3',
          password: 'password123'
        })
      });
      
      const altLoginData = await altLoginResponse.json();
      console.log('   Alternative login response:', altLoginData);
      
      if (!altLoginData.success) {
        throw new Error('Both login attempts failed');
      }
      
      loginData.token = altLoginData.token;
      loginData.success = true;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Test /api/auth/me with cycle points
    console.log('2. Testing /api/auth/me for cycle points...');
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const authData = await authResponse.json();
    console.log('   Auth response status:', authResponse.status);
    console.log('   User data received:');
    console.log('   - ID:', authData.user?.id);
    console.log('   - Username:', authData.user?.username);
    console.log('   - Total Points:', authData.user?.totalPoints);
    console.log('   - Current Month Points:', authData.user?.currentMonthPoints);
    console.log('   - Current Cycle Points:', authData.user?.currentCyclePoints);
    
    // Step 3: Verify cycle points data
    if (authData.success && authData.user) {
      const user = authData.user;
      
      if (typeof user.currentCyclePoints !== 'undefined') {
        console.log('✅ SUCCESS: currentCyclePoints is now included in API response');
        console.log(`   Expected: 40 points (2 lessons × 20 points each)`);
        console.log(`   Actual: ${user.currentCyclePoints} points`);
        
        if (user.currentCyclePoints === 40) {
          console.log('✅ PERFECT: Cycle points match expected value!');
        } else {
          console.log('⚠️  WARNING: Cycle points value differs from expected');
        }
      } else {
        console.log('❌ FAILED: currentCyclePoints still missing from API response');
      }
    } else {
      console.log('❌ FAILED: /api/auth/me request failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCyclePointsDataFlow();