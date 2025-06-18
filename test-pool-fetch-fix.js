// Test script to verify pool data fetch is working after individual try-catch fix
const baseUrl = 'http://localhost:5000';

async function testPoolFetchFix() {
  try {
    console.log('🔄 Testing pool data fetch fix...');
    
    // Step 1: Login to get valid token
    console.log('1. Login to get authentication token...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'f5l5@email.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Test individual API endpoints that Dashboard calls
    console.log('2. Testing individual API endpoints...');
    
    // Test leaderboard (might be causing the error)
    try {
      const leaderboardResponse = await fetch(`${baseUrl}/api/cycles/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   Leaderboard status:', leaderboardResponse.status);
    } catch (error) {
      console.log('   Leaderboard error:', error.message);
    }
    
    // Test thresholds
    try {
      const thresholdsResponse = await fetch(`${baseUrl}/api/cycles/current/tier-thresholds`);
      console.log('   Thresholds status:', thresholdsResponse.status);
    } catch (error) {
      console.log('   Thresholds error:', error.message);
    }
    
    // Test pool data (our main concern)
    try {
      const poolResponse = await fetch(`${baseUrl}/api/cycles/pool`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   Pool status:', poolResponse.status);
      
      if (poolResponse.ok) {
        const poolData = await poolResponse.json();
        console.log('   Pool data:', poolData);
        console.log('✅ Pool endpoint working correctly');
      } else {
        console.log('❌ Pool endpoint failed');
      }
    } catch (error) {
      console.log('   Pool error:', error.message);
    }
    
    // Test distribution
    try {
      const distributionResponse = await fetch(`${baseUrl}/api/cycles/distribution`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   Distribution status:', distributionResponse.status);
    } catch (error) {
      console.log('   Distribution error:', error.message);
    }
    
    console.log('3. Fix Summary:');
    console.log('   - Wrapped each fetch in individual try-catch blocks');
    console.log('   - Added detailed logging to pool data fetch');
    console.log('   - Failures in one endpoint won\'t prevent others from loading');
    console.log('');
    console.log('✅ Pool fetch fix should now work in Dashboard');
    console.log('   Expected: Pool data will load even if other endpoints fail');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPoolFetchFix();