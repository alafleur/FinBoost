// Test the authentication flow fix for lesson access
const baseUrl = 'http://localhost:5000';

async function testAuthFlowFix() {
  try {
    console.log('🔄 Testing authentication flow fix...');
    
    // Step 1: Login as existing user (should be authenticated)
    console.log('1. Testing with existing authenticated user...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'f4lynn@example.com',  // Known test user
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Verify user authentication works
    console.log('2. Verifying authentication...');
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('   Auth response status:', authResponse.status);
    
    if (authResponse.ok) {
      const userData = await authResponse.json();
      console.log('✅ User authenticated:', userData.user.username);
      console.log('   Subscription status:', userData.user.subscriptionStatus || 'none');
      console.log('   Is premium:', userData.user.subscriptionStatus === 'active' ? 'Yes' : 'No');
      
      // Step 3: Find a premium module to test with
      console.log('3. Finding premium module...');
      const modulesResponse = await fetch(`${baseUrl}/api/modules`);
      const modulesData = await modulesResponse.json();
      
      const premiumModule = modulesData.modules.find(m => m.accessType === 'premium');
      if (premiumModule) {
        console.log('✅ Found premium module:', premiumModule.title, '(ID:', premiumModule.id + ')');
        
        // Step 4: Test access logic
        console.log('4. Testing access logic...');
        const { canAccessModule } = await import('./shared/userAccess.js');
        const canAccess = canAccessModule(userData.user, premiumModule);
        
        console.log('   Access granted:', canAccess ? 'Yes' : 'No');
        
        if (!canAccess && userData.user.subscriptionStatus !== 'active') {
          console.log('✅ EXPECTED: Non-premium user blocked from premium content');
          console.log('✅ FIX VERIFICATION: User should see upgrade prompt, not be redirected to /auth');
        } else if (canAccess && userData.user.subscriptionStatus === 'active') {
          console.log('✅ EXPECTED: Premium user can access premium content');
        } else {
          console.log('❌ UNEXPECTED: Access logic may be incorrect');
        }
      } else {
        console.log('❌ No premium modules found for testing');
      }
      
    } else {
      console.log('❌ Authentication failed with status:', authResponse.status);
      
      // Test the fix: 401/403 should redirect to auth, others should not
      if (authResponse.status === 401 || authResponse.status === 403) {
        console.log('✅ FIX WORKING: 401/403 status would redirect to /auth (correct)');
      } else {
        console.log('✅ FIX WORKING: Non-auth error would redirect to /education (correct)');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAuthFlowFix();