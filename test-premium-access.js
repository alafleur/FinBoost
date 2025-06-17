import fetch from 'node-fetch';

async function testPremiumAccess() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('🔄 Testing premium module access with user f5l5...');
    
    // Step 1: Login as f5l5 (premium user)
    console.log('1. Attempting login as f5l5...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'f5l5@email.com',
        password: 'testpass123'  // Try common test password
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Login response:', loginData);
    
    if (!loginData.success) {
      // Try with different password
      console.log('   Trying alternative password...');
      const loginResponse2 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'f5l5@email.com',
          password: 'password123'
        })
      });
      
      const loginData2 = await loginResponse2.json();
      console.log('   Second login attempt:', loginData2);
      
      if (!loginData2.success) {
        throw new Error('Could not login as f5l5 with test passwords');
      }
      
      // Use second login data
      loginData.success = true;
      loginData.token = loginData2.token;
      loginData.user = loginData2.user;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful for f5l5, token received');
    
    // Step 2: Check user subscription status
    console.log('2. Checking user subscription status...');
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const authData = await authResponse.json();
    console.log('   User data:', {
      username: authData.user?.username,
      subscriptionStatus: authData.user?.subscriptionStatus,
      totalPoints: authData.user?.totalPoints
    });
    
    // Step 3: Fetch all modules to check premium access
    console.log('3. Fetching all modules...');
    const modulesResponse = await fetch(`${baseUrl}/api/modules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const modulesData = await modulesResponse.json();
    if (modulesData.success && modulesData.modules) {
      console.log('   Total modules found:', modulesData.modules.length);
      
      const freeModules = modulesData.modules.filter(m => m.accessType === 'free');
      const premiumModules = modulesData.modules.filter(m => m.accessType === 'premium');
      
      console.log('   Free modules:', freeModules.length);
      console.log('   Premium modules:', premiumModules.length);
      
      if (premiumModules.length > 0) {
        console.log('4. Testing premium module access...');
        const premiumModule = premiumModules[0];
        console.log('   Testing module:', premiumModule.title, '(ID:', premiumModule.id + ')');
        
        // Try to access premium lesson
        const lessonResponse = await fetch(`${baseUrl}/lesson/${premiumModule.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('   Premium lesson access status:', lessonResponse.status);
        console.log('   Should allow access for premium user');
      }
    } else {
      console.log('   No modules data received');
    }
    
  } catch (error) {
    console.error('❌ Premium access test failed:', error.message);
  }
}

testPremiumAccess();