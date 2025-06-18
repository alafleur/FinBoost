// Test to reproduce the member-only content access issue
// User t1u1 (authenticated but not premium) should see upgrade prompt, not be redirected to /auth

const baseUrl = 'http://localhost:5000';

async function testMemberOnlyAccess() {
  try {
    console.log('🔄 Testing member-only content access flow...');
    
    // Step 1: Create test user t1u1 (non-premium)
    console.log('1. Creating test user t1u1...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 't1u1',
        email: 't1u1@test.com',
        password: 'password123'
      })
    });
    
    let token;
    if (registerResponse.status === 409) {
      // User already exists, try login
      console.log('   User exists, logging in...');
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 't1u1@test.com',
          password: 'password123'
        })
      });
      const loginData = await loginResponse.json();
      token = loginData.token;
    } else {
      const registerData = await registerResponse.json();
      token = registerData.token;
    }
    
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    console.log('✅ User t1u1 authenticated');
    
    // Step 2: Verify user is authenticated but not premium
    console.log('2. Verifying user status...');
    const userResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userResponse.ok) {
      throw new Error('User authentication failed');
    }
    
    const userData = await userResponse.json();
    console.log('   User subscription status:', userData.user.subscriptionStatus || 'none');
    console.log('   Is premium:', userData.user.subscriptionStatus === 'active');
    
    // Step 3: Get premium modules to test with
    console.log('3. Fetching modules to find premium content...');
    const modulesResponse = await fetch(`${baseUrl}/api/modules`);
    const modulesData = await modulesResponse.json();
    
    if (!modulesData.success) {
      throw new Error('Failed to fetch modules');
    }
    
    const premiumModule = modulesData.modules.find(m => m.accessType === 'premium');
    if (!premiumModule) {
      throw new Error('No premium modules found for testing');
    }
    
    console.log('   Found premium module:', premiumModule.title, '(ID:', premiumModule.id + ')');
    
    // Step 4: Test access to premium module
    console.log('4. Testing access to premium module...');
    
    // Simulate what happens when user clicks on premium lesson
    // This should trigger the lesson page logic
    console.log('   Simulating lesson page access...');
    console.log('   Expected behavior: Show upgrade prompt, NOT redirect to /auth');
    console.log('   Actual behavior: Will be determined by examining the lesson component logic');
    
    // Step 5: Test the canAccessModule function directly
    console.log('5. Testing canAccessModule function...');
    
    // Import the function to test directly
    const { canAccessModule } = await import('./shared/userAccess.js');
    const canAccess = canAccessModule(userData.user, premiumModule);
    console.log('   canAccessModule result:', canAccess);
    console.log('   Expected: false (should be blocked for non-premium user)');
    
    if (!canAccess) {
      console.log('✅ Access correctly blocked by canAccessModule function');
      console.log('🔍 Issue is likely in the lesson page authentication flow');
      console.log('   Problem: Lesson page redirects to /auth instead of showing upgrade prompt');
    } else {
      console.log('❌ Unexpected: canAccessModule allowed access');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMemberOnlyAccess();