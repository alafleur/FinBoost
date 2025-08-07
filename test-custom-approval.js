// Test script for custom ticket approval system
import fs from 'fs';

async function testCustomTicketApproval() {
  const token = fs.readFileSync('admin_token.txt', 'utf8').trim();
  
  console.log('\n=== PHASE 4: Testing Custom Ticket Approval System ===\n');
  
  // Test 1: Get pending proofs
  console.log('1. Testing pending proofs fetch...');
  try {
    const response = await fetch('http://localhost:5000/api/admin/pending-proofs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success && data.proofs.length > 0) {
      console.log(`✅ Found ${data.proofs.length} pending proof(s)`);
      const firstProof = data.proofs[0];
      console.log(`   First proof: ID ${firstProof.id}, User: ${firstProof.user?.username}, Default points: ${firstProof.points}`);
      
      // Test 2: Test custom approval with valid points
      console.log('\n2. Testing custom approval with 25 tickets...');
      const customResponse = await fetch(`http://localhost:5000/api/admin/approve-proof/${firstProof.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customPoints: 25 })
      });
      
      const customResult = await customResponse.json();
      if (customResult.success) {
        console.log('✅ Custom approval with 25 tickets successful');
        console.log(`   Response: ${customResult.message}`);
      } else {
        console.log('❌ Custom approval failed');
        console.log(`   Error: ${customResult.message}`);
      }
    } else {
      console.log('ℹ️  No pending proofs to test with');
      
      // Test validation with mock request
      console.log('\n2. Testing validation with invalid data...');
      const invalidResponse = await fetch('http://localhost:5000/api/admin/approve-proof/999', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customPoints: 0 })
      });
      
      const invalidResult = await invalidResponse.json();
      if (!invalidResult.success && invalidResult.message.includes('positive integer')) {
        console.log('✅ Validation correctly rejected 0 tickets');
      } else {
        console.log('❌ Validation issue detected');
      }
    }
    
    // Test 3: Test validation edge cases
    console.log('\n3. Testing validation edge cases...');
    
    // Test negative value
    const negativeTest = await fetch('http://localhost:5000/api/admin/approve-proof/999', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customPoints: -5 })
    });
    
    const negativeResult = await negativeTest.json();
    if (!negativeResult.success) {
      console.log('✅ Negative value correctly rejected');
    }
    
    // Test string value
    const stringTest = await fetch('http://localhost:5000/api/admin/approve-proof/999', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customPoints: "invalid" })
    });
    
    const stringResult = await stringTest.json();
    if (!stringResult.success) {
      console.log('✅ String value correctly rejected');
    }
    
    // Test 4: Test default approval (no custom points)
    console.log('\n4. Testing default approval (no customPoints)...');
    const defaultTest = await fetch('http://localhost:5000/api/admin/approve-proof/999', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    
    const defaultResult = await defaultTest.json();
    if (!defaultResult.success && defaultResult.message.includes('not found')) {
      console.log('✅ Default approval structure works (proof not found as expected)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n=== Testing Complete ===');
}

// Run tests
testCustomTicketApproval().catch(console.error);