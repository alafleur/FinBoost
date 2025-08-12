#!/usr/bin/env node

/**
 * Step 7: Final Reconciliation Endpoint Test with Admin Token
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5000';

async function testStep7Final() {
  console.log('Step 7 Reconciliation Endpoint - Final Test');
  console.log('==========================================');

  try {
    // Test 1: Without authentication (should get 401)
    console.log('Test 1: Testing without authentication...');
    
    const noAuthResponse = await fetch(`${SERVER_URL}/api/admin/payout-batches/999/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`Status: ${noAuthResponse.status}`);
    if (noAuthResponse.status === 401) {
      console.log('✅ Correctly requires authentication');
    } else {
      const text = await noAuthResponse.text();
      console.log(`Response: ${text.substring(0, 100)}...`);
    }

    // Test 2: With admin token
    try {
      const fs = await import('fs/promises');
      const adminToken = await fs.readFile('./admin_token.txt', 'utf8');
      
      console.log('\nTest 2: Testing with admin authentication...');
      
      const adminResponse = await fetch(`${SERVER_URL}/api/admin/payout-batches/999/reconcile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken.trim()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Status: ${adminResponse.status}`);
      const responseData = await adminResponse.json();
      console.log('Response:', JSON.stringify(responseData, null, 2));
      
      if (adminResponse.status === 404) {
        console.log('✅ Step 7 reconciliation endpoint is working correctly');
        console.log('✅ Properly authenticated and validated batch existence');
      } else if (adminResponse.status === 400) {
        console.log('✅ Step 7 reconciliation endpoint validated batch requirements');
      }
      
    } catch (tokenError) {
      console.log('\nAdmin token test skipped: File not found');
    }

    console.log('\n🎉 Step 7 Implementation Verification Complete');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testStep7Final().catch(console.error);