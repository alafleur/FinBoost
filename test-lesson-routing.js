// Test lesson routing to debug the 404 issue
const baseUrl = 'http://localhost:5000';

async function testLessonRouting() {
  try {
    console.log('🔄 Testing lesson routing...');
    
    // Step 1: Get available modules
    console.log('1. Fetching available modules...');
    const modulesResponse = await fetch(`${baseUrl}/api/modules`);
    const modulesData = await modulesResponse.json();
    
    if (!modulesData.success) {
      throw new Error('Failed to fetch modules');
    }
    
    console.log('   Total modules:', modulesData.modules.length);
    
    // Find first available module
    const firstModule = modulesData.modules[0];
    if (!firstModule) {
      throw new Error('No modules available');
    }
    
    console.log('   Testing with module:', firstModule.title, '(ID:', firstModule.id + ')');
    console.log('   Module access type:', firstModule.accessType);
    
    // Step 2: Test direct lesson API access
    console.log('2. Testing direct lesson page access...');
    const lessonUrl = `${baseUrl}/lesson/${firstModule.id}`;
    console.log('   Lesson URL:', lessonUrl);
    
    // Try to fetch the lesson page directly
    const lessonPageResponse = await fetch(lessonUrl);
    console.log('   Lesson page status:', lessonPageResponse.status);
    
    if (lessonPageResponse.status === 404) {
      console.log('❌ 404 Error confirmed - lesson route not found');
      
      // Check if it's a client-side routing issue
      console.log('   This suggests either:');
      console.log('   - Client-side routing is not properly configured');
      console.log('   - Server-side routing is missing the lesson route');
      console.log('   - There\'s a mismatch between frontend and backend routing');
    } else if (lessonPageResponse.ok) {
      console.log('✅ Lesson page accessible');
    } else {
      console.log('⚠️ Lesson page returned status:', lessonPageResponse.status);
    }
    
    // Step 3: Test with authentication
    console.log('3. Testing authenticated lesson access...');
    
    // Try to login first
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testadmin@test.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;
      console.log('   Authenticated successfully');
      
      // Try lesson access with auth
      const authLessonResponse = await fetch(lessonUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('   Authenticated lesson access status:', authLessonResponse.status);
    } else {
      console.log('   Authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Routing test failed:', error.message);
  }
}

testLessonRouting();