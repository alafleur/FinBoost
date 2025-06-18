async function testDashboardCyclePoints() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('🔄 Testing dashboard cycle points display fix...');
    
    // Step 1: Login as user with 40 cycle points
    console.log('1. Logging in as alafleur...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lafleur.andrew@gmail.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Test /api/auth/me endpoint
    console.log('2. Testing /api/auth/me with fixed cycle points...');
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!authResponse.ok) {
      throw new Error(`API request failed: ${authResponse.status}`);
    }
    
    const authData = await authResponse.json();
    console.log('   Response status:', authResponse.status);
    
    if (authData.success && authData.user) {
      const user = authData.user;
      
      console.log('📊 User Data Summary:');
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Total Points: ${user.totalPoints}`);
      console.log(`   - Legacy Month Points: ${user.currentMonthPoints}`);
      console.log(`   - Current Cycle Points: ${user.currentCyclePoints}`);
      console.log(`   - Tier: ${user.tier}`);
      
      // Verify the fix
      if (user.currentCyclePoints === 40) {
        console.log('✅ SUCCESS: Dashboard will now show 40 cycle points instead of 0!');
        console.log('✅ SUCCESS: Tier 2 assignment matches the 40 points earned!');
        console.log('✅ FIXED: Dashboard data consistency issue resolved!');
      } else if (user.currentCyclePoints === 0) {
        console.log('❌ ISSUE: Still showing 0 cycle points - API fix may not be working');
      } else {
        console.log(`⚠️  UNEXPECTED: Shows ${user.currentCyclePoints} points (expected 40)`);
      }
      
      // Verify tier consistency
      if (user.tier === 'tier2' && user.currentCyclePoints > 0) {
        console.log('✅ CONSISTENCY: Tier 2 assignment now matches non-zero cycle points');
      } else if (user.tier === 'tier2' && user.currentCyclePoints === 0) {
        console.log('❌ INCONSISTENCY: Still shows Tier 2 with 0 cycle points');
      }
      
    } else {
      console.log('❌ FAILED: /api/auth/me request unsuccessful');
      console.log('   Response:', authData);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Run the test
testDashboardCyclePoints();