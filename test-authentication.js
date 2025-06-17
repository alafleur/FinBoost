import fetch from 'node-fetch';

async function testAuthenticationFlow() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('🔄 Testing authentication flow for user f5l5...');
    
    // Step 1: Login
    console.log('1. Attempting login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'f5l5@email.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Login response:', loginData);
    
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful, token received:', token ? 'YES' : 'NO');
    
    // Step 2: Test /api/auth/me
    console.log('2. Testing /api/auth/me...');
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const authData = await authResponse.json();
    console.log('   Auth response status:', authResponse.status);
    console.log('   Auth response:', authData);
    
    // Step 3: Test /api/user/progress
    console.log('3. Testing /api/user/progress...');
    const progressResponse = await fetch(`${baseUrl}/api/user/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const progressData = await progressResponse.json();
    console.log('   Progress response status:', progressResponse.status);
    console.log('   Progress response:', progressData);
    
    // Step 4: Test lesson completion
    console.log('4. Testing lesson completion...');
    const lessonResponse = await fetch(`${baseUrl}/api/lessons/52/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const lessonData = await lessonResponse.json();
    console.log('   Lesson completion status:', lessonResponse.status);
    console.log('   Lesson completion response:', lessonData);
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

testAuthenticationFlow();