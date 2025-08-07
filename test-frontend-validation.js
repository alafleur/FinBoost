import fs from 'fs';

async function testFrontendValidation() {
  const token = fs.readFileSync('admin_token.txt', 'utf8').trim();
  
  console.log('\n=== Phase 4: Frontend Validation Testing ===\n');
  
  // Step 1: Create a test user
  console.log('1. Creating test user with proof submission...');
  
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    username: `testuser_${Date.now()}`,
    password: 'TestPass123!'
  };
  
  try {
    // Register test user
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      console.log('❌ Failed to create test user');
      return;
    }
    
    const registerResult = await registerResponse.json();
    console.log('✅ Test user created successfully');
    
    // Login to get user token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const loginResult = await loginResponse.json();
    const userToken = loginResult.token;
    
    // Step 2: Submit a proof that requires custom approval
    console.log('2. Submitting proof for debt paydown...');
    
    const proofResponse = await fetch('http://localhost:5000/api/proof/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        actionId: 1, // Debt paydown action
        description: 'Made a $1,500 payment toward my credit card debt',
        proofText: 'Test proof submission for validation'
      })
    });
    
    if (proofResponse.ok) {
      console.log('✅ Proof submitted successfully');
      
      // Step 3: Verify proof appears in pending list
      console.log('3. Verifying proof appears in admin pending list...');
      
      const pendingResponse = await fetch('http://localhost:5000/api/admin/pending-proofs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const pendingData = await pendingResponse.json();
      const testProof = pendingData.proofs.find(p => p.user?.email === testUser.email);
      
      if (testProof) {
        console.log('✅ Test proof found in pending list');
        console.log(`   Proof ID: ${testProof.id}, User: ${testProof.user.username}, Points: ${testProof.points}`);
        
        // Step 4: Test validation scenarios
        console.log('4. Testing frontend validation scenarios...');
        
        // Test minimum validation (should be 5 minimum)
        console.log('   Testing minimum ticket validation...');
        const minTestResult = await testCustomApproval(testProof.id, 1, token);
        if (!minTestResult.success && minTestResult.message.includes('positive')) {
          console.log('   ✅ Minimum validation working (1 ticket rejected)');
        } else {
          console.log('   ❌ Minimum validation issue');
        }
        
        // Test successful custom approval
        console.log('   Testing successful custom approval...');
        const successResult = await testCustomApproval(testProof.id, 75, token);
        if (successResult.success) {
          console.log('   ✅ Custom approval successful (75 tickets)');
        } else {
          console.log('   ❌ Custom approval failed');
        }
        
      } else {
        console.log('❌ Test proof not found in pending list');
      }
      
    } else {
      console.log('❌ Failed to submit proof');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n=== Frontend Validation Complete ===');
}

async function testCustomApproval(proofId, customPoints, token) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/approve-proof/${proofId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customPoints })
    });
    
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

testFrontendValidation().catch(console.error);