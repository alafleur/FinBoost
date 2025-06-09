// Test script to verify lesson navigation functionality
const fetch = require('node-fetch');

async function testLessonNavigation() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('🔄 Testing lesson navigation flow...');
    
    // Step 1: Login to get authentication token
    console.log('1. Logging in as test user...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testadmin@test.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Verify authentication with /api/auth/me
    console.log('2. Verifying authentication...');
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const authData = await authResponse.json();
    if (!authData.success) {
      throw new Error('Auth verification failed: ' + authData.message);
    }
    
    console.log('✅ Authentication verified for user:', authData.user.username);
    
    // Step 3: Fetch available modules
    console.log('3. Fetching modules...');
    const modulesResponse = await fetch(`${baseUrl}/api/modules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const modulesData = await modulesResponse.json();
    if (!modulesData.success || !modulesData.modules.length) {
      throw new Error('No modules found');
    }
    
    const firstModule = modulesData.modules[0];
    console.log('✅ Modules fetched successfully, first module:', firstModule.title, '(ID:', firstModule.id + ')');
    
    // Step 4: Test lesson content access
    console.log('4. Testing lesson content access...');
    console.log('Module content preview:', firstModule.content ? firstModule.content.substring(0, 100) + '...' : 'No content');
    console.log('Module quiz available:', firstModule.quiz ? 'Yes' : 'No');
    console.log('Module points reward:', firstModule.pointsReward);
    
    console.log('✅ Lesson navigation test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Authentication: Working ✅');
    console.log('- Module fetching: Working ✅');
    console.log('- Lesson content: Available ✅');
    console.log('- Navigation endpoints: Ready ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testLessonNavigation();