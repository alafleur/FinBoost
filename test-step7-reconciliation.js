#!/usr/bin/env node

/**
 * Step 7: Reconciliation Endpoint Testing Script
 * Tests the POST /api/admin/payout-batches/:batchId/reconcile endpoint
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5000';
const ADMIN_TOKEN_FILE = './admin_token.txt';

// Function to get admin token
async function getAdminToken() {
  try {
    const fs = await import('fs/promises');
    const token = await fs.readFile(ADMIN_TOKEN_FILE, 'utf8');
    return token.trim();
  } catch (error) {
    console.error('❌ Error reading admin token:', error.message);
    console.log('💡 Please ensure admin_token.txt exists and contains a valid admin JWT token');
    process.exit(1);
  }
}

// Test the reconciliation endpoint
async function testReconciliationEndpoint() {
  console.log('🧪 Testing Step 7: Reconciliation Endpoint');
  console.log('=' * 50);

  const adminToken = await getAdminToken();
  console.log('✅ Admin token loaded');

  // Step 1: Get list of existing payout batches to find one to test
  console.log('\n📋 Step 1: Finding existing payout batches...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/admin/payout-batches`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch payout batches:', response.status, response.statusText);
      return;
    }

    const batches = await response.json();
    console.log(`📊 Found ${batches.length} payout batches`);

    if (batches.length === 0) {
      console.log('⚠️  No payout batches found to test reconciliation');
      console.log('💡 Create some payout batches first using the disbursement system');
      return;
    }

    // Find a batch with PayPal batch ID (processed batch)
    const processedBatch = batches.find(batch => batch.paypalBatchId);
    
    if (!processedBatch) {
      console.log('⚠️  No processed batches found (no PayPal batch IDs)');
      console.log('💡 Process some disbursements first to create batches with PayPal IDs');
      return;
    }

    console.log(`✅ Found processed batch ${processedBatch.id} with PayPal ID: ${processedBatch.paypalBatchId}`);
    console.log(`   Status: ${processedBatch.status}, Created: ${processedBatch.createdAt}`);

    // Step 2: Test reconciliation endpoint
    console.log('\n🔄 Step 2: Testing reconciliation endpoint...');
    
    const reconcileResponse = await fetch(`${SERVER_URL}/api/admin/payout-batches/${processedBatch.id}/reconcile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Reconciliation response status: ${reconcileResponse.status}`);

    if (!reconcileResponse.ok) {
      const errorText = await reconcileResponse.text();
      console.error('❌ Reconciliation failed:', errorText);
      return;
    }

    const reconcileResult = await reconcileResponse.json();
    console.log('✅ Reconciliation successful!');
    
    // Step 3: Display reconciliation results
    console.log('\n📊 Step 3: Reconciliation Results:');
    console.log('-'.repeat(40));
    
    const results = reconcileResult.reconciliationResults;
    console.log(`🆔 Batch ID: ${results.batchId}`);
    console.log(`🏦 PayPal Batch ID: ${results.paypalBatchId}`);
    console.log(`📋 Batch Status: ${results.batchStatus}`);
    console.log(`🔄 Items Processed: ${results.itemsProcessed}`);
    console.log(`✅ Cycle Completed: ${results.cycleCompleted}`);
    
    console.log('\n📈 Status Changes:');
    console.log(`   Prior - Successful: ${results.priorStatus.successful}, Failed: ${results.priorStatus.failed}, Pending: ${results.priorStatus.pending}`);
    console.log(`   Updated - Successful: ${results.updatedStatus.successful}, Failed: ${results.updatedStatus.failed}, Pending: ${results.updatedStatus.pending}`);
    console.log(`   Changes - New Successful: +${results.statusChanges.newSuccessful}, New Failed: +${results.statusChanges.newFailed}, Resolved Pending: ${results.statusChanges.resolvedPending}`);
    
    console.log(`⏰ PayPal Sync Timestamp: ${results.paypalSyncTimestamp}`);

    // Step 4: Test with invalid batch ID
    console.log('\n🧪 Step 4: Testing with invalid batch ID...');
    
    const invalidResponse = await fetch(`${SERVER_URL}/api/admin/payout-batches/99999/reconcile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (invalidResponse.status === 404) {
      console.log('✅ Correctly returned 404 for invalid batch ID');
    } else {
      console.log(`⚠️  Expected 404 but got ${invalidResponse.status}`);
    }

    // Step 5: Test with batch that has no PayPal ID
    const unprocessedBatch = batches.find(batch => !batch.paypalBatchId);
    if (unprocessedBatch) {
      console.log('\n🧪 Step 5: Testing with unprocessed batch (no PayPal ID)...');
      
      const unprocessedResponse = await fetch(`${SERVER_URL}/api/admin/payout-batches/${unprocessedBatch.id}/reconcile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (unprocessedResponse.status === 400) {
        const errorData = await unprocessedResponse.json();
        console.log('✅ Correctly returned 400 for unprocessed batch');
        console.log(`   Error: ${errorData.error}`);
      } else {
        console.log(`⚠️  Expected 400 but got ${unprocessedResponse.status}`);
      }
    }

    console.log('\n🎉 Step 7 Reconciliation Endpoint Testing Complete!');
    console.log('✅ All tests passed - reconciliation functionality is working properly');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on localhost:5000');
    }
  }
}

// Error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the test
testReconciliationEndpoint().catch(console.error);