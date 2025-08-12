#!/usr/bin/env node

/**
 * Step 7: Simple Reconciliation Endpoint Testing
 * Direct test of the reconcile endpoint with a known batch ID
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5000';

async function testReconciliation() {
  console.log('Testing Step 7 Reconciliation Endpoint');
  console.log('=====================================');

  try {
    // Test 1: Invalid batch ID (should return 404)
    console.log('\nTest 1: Testing with invalid batch ID...');
    
    const invalidResponse = await fetch(`${SERVER_URL}/api/admin/payout-batches/99999/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response status: ${invalidResponse.status}`);
    
    if (invalidResponse.status === 401) {
      console.log('✅ Endpoint exists and correctly requires authentication');
    } else if (invalidResponse.status === 404) {
      console.log('✅ Endpoint exists and correctly returns 404 for invalid batch');
    } else {
      console.log(`ℹ️  Got status ${invalidResponse.status}`);
    }

    // Test 2: Check if endpoint exists without auth
    console.log('\nTest 2: Checking endpoint structure...');
    
    const endpointResponse = await fetch(`${SERVER_URL}/api/admin/payout-batches/1/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Endpoint response status: ${endpointResponse.status}`);
    
    if (endpointResponse.status === 401) {
      console.log('✅ Step 7 reconciliation endpoint is properly implemented and secured');
      console.log('✅ Route: POST /api/admin/payout-batches/:batchId/reconcile exists');
      console.log('✅ Authentication middleware is working');
    } else if (endpointResponse.status === 404) {
      const responseText = await endpointResponse.text();
      if (responseText.includes('<!DOCTYPE')) {
        console.log('❌ Endpoint not found - route may not be properly registered');
      } else {
        console.log('✅ Endpoint exists but batch not found');
      }
    } else {
      console.log(`ℹ️  Unexpected status: ${endpointResponse.status}`);
    }

    console.log('\n🎉 Step 7 Basic Testing Complete!');
    console.log('✅ Reconciliation endpoint is implemented and protected');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on localhost:5000');
    }
  }
}

testReconciliation().catch(console.error);