/**
 * Step 2 Unit Tests: Enhanced PayPal Response Parsing
 * Tests the pure parsing functions without database operations
 */

import assert from 'assert';
import { parseEnhancedPayoutResponse } from './server/paypal.ts';
import { 
  successfulPayoutResponse,
  mixedStatusPayoutResponse, 
  failedPayoutResponse,
  pendingOnlyResponse
} from './server/__fixtures__/paypal/sample-responses.ts';

// Helper function to run tests
function runTest(testName, testFunction) {
  try {
    testFunction();
    console.log(`✅ ${testName}`);
    return true;
  } catch (error) {
    console.error(`❌ ${testName}: ${error.message}`);
    return false;
  }
}

// Test Suite: Step 2 Enhanced PayPal Parsing
console.log('\n🧪 Step 2 Unit Tests: Enhanced PayPal Response Parsing\n');

let passedTests = 0;
let totalTests = 0;

// Test 1: Successful Payout Response Parsing
totalTests++;
passedTests += runTest('Test 1: Parse Successful Payout Response', () => {
  const result = parseEnhancedPayoutResponse(successfulPayoutResponse);
  
  // Verify batch-level parsing
  assert.strictEqual(result.batchStatus, 'SUCCESS');
  assert.strictEqual(result.paypalBatchId, '5FNCS4PRQYB3E');
  assert.strictEqual(result.senderBatchId, 'cycle-18-20250112-abcd1234');
  assert.strictEqual(result.totalAmount, 15000); // $150.00 in cents
  assert.strictEqual(result.totalFees, 350); // $3.50 in cents
  assert.strictEqual(result.itemCount, 3);
  assert(result.processedAt instanceof Date);
  
  // Verify individual item parsing
  assert.strictEqual(result.individualResults.length, 3);
  
  const firstItem = result.individualResults[0];
  assert.strictEqual(firstItem.cycleWinnerSelectionId, 123);
  assert.strictEqual(firstItem.userId, 456);
  assert.strictEqual(firstItem.paypalItemId, 'ACFTK5Q7WQLP4');
  assert.strictEqual(firstItem.status, 'success');
  assert.strictEqual(firstItem.amount, 5000); // $50.00 in cents
  assert.strictEqual(firstItem.email, 'winner1@example.com');
  assert.strictEqual(firstItem.fees, 100); // $1.00 in cents
  assert(firstItem.processedAt instanceof Date);
  
  const secondItem = result.individualResults[1];
  assert.strictEqual(secondItem.amount, 7500); // $75.00 in cents
  assert.strictEqual(secondItem.fees, 125); // $1.25 in cents
  
  console.log('   ✓ Batch status parsed correctly');
  console.log('   ✓ Amount conversions (dollars to cents) working');
  console.log('   ✓ Individual item results parsed correctly');
  console.log('   ✓ Winner ID extraction working');
});

// Test 2: Mixed Status Response Parsing  
totalTests++;
passedTests += runTest('Test 2: Parse Mixed Status Response', () => {
  const result = parseEnhancedPayoutResponse(mixedStatusPayoutResponse);
  
  // Verify batch status
  assert.strictEqual(result.batchStatus, 'COMPLETED');
  assert.strictEqual(result.paypalBatchId, '6GODB5QS8ZC4F');
  assert.strictEqual(result.itemCount, 4);
  
  // Verify status mapping for different item statuses
  const statuses = result.individualResults.map(item => item.status);
  assert(statuses.includes('success'));
  assert(statuses.includes('pending'));
  assert(statuses.includes('unclaimed'));
  assert(statuses.includes('failed'));
  
  // Verify error handling for failed item
  const failedItem = result.individualResults.find(item => item.status === 'failed');
  assert.strictEqual(failedItem.errorCode, 'RECEIVER_UNREGISTERED');
  assert.strictEqual(failedItem.errorMessage, 'Receiver is not registered with PayPal');
  
  // Verify pending item (no error fields)
  const pendingItem = result.individualResults.find(item => item.status === 'pending');
  assert.strictEqual(pendingItem.errorCode, undefined);
  assert.strictEqual(pendingItem.errorMessage, undefined);
  
  console.log('   ✓ Mixed statuses parsed correctly');
  console.log('   ✓ Error information extracted for failed items');
  console.log('   ✓ Status mapping working for all PayPal statuses');
});

// Test 3: Failed Payout Response Parsing
totalTests++;
passedTests += runTest('Test 3: Parse Failed Payout Response', () => {
  const result = parseEnhancedPayoutResponse(failedPayoutResponse);
  
  // Verify batch status
  assert.strictEqual(result.batchStatus, 'DENIED');
  assert.strictEqual(result.paypalBatchId, '7HPEC6RT0AD5G');
  assert.strictEqual(result.itemCount, 1);
  assert.strictEqual(result.processedAt, undefined); // No completion time for denied batch
  
  // Verify failed item details
  const failedItem = result.individualResults[0];
  assert.strictEqual(failedItem.status, 'failed'); // DENIED maps to failed
  assert.strictEqual(failedItem.errorCode, 'INSUFFICIENT_FUNDS');
  assert.strictEqual(failedItem.errorMessage, 'Insufficient funds in the account');
  
  console.log('   ✓ Failed batch status parsed correctly');
  console.log('   ✓ Insufficient funds error captured');
});

// Test 4: Pending Only Response Parsing
totalTests++;
passedTests += runTest('Test 4: Parse Pending Only Response', () => {
  const result = parseEnhancedPayoutResponse(pendingOnlyResponse);
  
  // Verify batch status
  assert.strictEqual(result.batchStatus, 'PENDING');
  assert.strictEqual(result.paypalBatchId, '8IQFD7SU1BE6H');
  assert.strictEqual(result.itemCount, 2);
  
  // Verify both items are in pending state
  const statuses = result.individualResults.map(item => item.status);
  assert.strictEqual(statuses.filter(s => s === 'pending').length, 2);
  
  // Verify ONHOLD maps to pending
  const onholdItem = result.individualResults.find(item => 
    item.email === 'onhold@example.com'
  );
  assert.strictEqual(onholdItem.status, 'pending');
  
  console.log('   ✓ Pending batch status parsed correctly');
  console.log('   ✓ ONHOLD status maps to pending');
});

// Test 5: Winner ID Extraction Edge Cases
totalTests++;
passedTests += runTest('Test 5: Winner ID Extraction Edge Cases', () => {
  // Test with malformed sender_item_id
  const malformedResponse = {
    batch_header: {
      payout_batch_id: 'TEST_BATCH',
      batch_status: 'SUCCESS',
      sender_batch_header: { sender_batch_id: 'test-batch' },
      amount: { value: '50.00' },
      fees: { value: '1.00' }
    },
    items: [
      {
        payout_item_id: 'VALID_ITEM',
        transaction_status: 'SUCCESS',
        payout_item: {
          sender_item_id: 'winner-123-456',  // Valid format
          amount: { value: '25.00' },
          receiver: 'valid@example.com'
        }
      },
      {
        payout_item_id: 'INVALID_ITEM',
        transaction_status: 'SUCCESS', 
        payout_item: {
          sender_item_id: 'invalid-format', // Invalid format
          amount: { value: '25.00' },
          receiver: 'invalid@example.com'
        }
      }
    ]
  };
  
  const result = parseEnhancedPayoutResponse(malformedResponse);
  
  // Should only include valid item, skip invalid one
  assert.strictEqual(result.individualResults.length, 1);
  assert.strictEqual(result.individualResults[0].cycleWinnerSelectionId, 123);
  assert.strictEqual(result.individualResults[0].userId, 456);
  
  console.log('   ✓ Invalid sender_item_id formats filtered out');
  console.log('   ✓ Valid items still processed correctly');
});

// Test 6: Amount and Fee Conversion Accuracy
totalTests++;
passedTests += runTest('Test 6: Amount and Fee Conversion Accuracy', () => {
  const result = parseEnhancedPayoutResponse(successfulPayoutResponse);
  
  // Test precise cent conversion for different amounts
  const firstItem = result.individualResults[0]; // $50.00
  const secondItem = result.individualResults[1]; // $75.00  
  const thirdItem = result.individualResults[2]; // $25.00
  
  assert.strictEqual(firstItem.amount, 5000);  // $50.00 = 5000 cents
  assert.strictEqual(firstItem.fees, 100);     // $1.00 = 100 cents
  assert.strictEqual(secondItem.amount, 7500); // $75.00 = 7500 cents
  assert.strictEqual(secondItem.fees, 125);    // $1.25 = 125 cents
  assert.strictEqual(thirdItem.amount, 2500);  // $25.00 = 2500 cents
  assert.strictEqual(thirdItem.fees, 125);     // $1.25 = 125 cents
  
  // Test batch total
  assert.strictEqual(result.totalAmount, 15000); // $150.00 = 15000 cents
  assert.strictEqual(result.totalFees, 350);     // $3.50 = 350 cents
  
  console.log('   ✓ Dollar to cent conversion accurate');
  console.log('   ✓ Fee calculations correct');
  console.log('   ✓ Batch totals match individual items');
});

// Test 7: Status Mapping Comprehensive Coverage
totalTests++;
passedTests += runTest('Test 7: Status Mapping Comprehensive Coverage', () => {
  // Test all PayPal statuses we need to handle
  const testResponse = {
    batch_header: {
      payout_batch_id: 'STATUS_TEST',
      batch_status: 'SUCCESS',
      sender_batch_header: { sender_batch_id: 'test' },
      amount: { value: '100.00' }
    },
    items: [
      { payout_item_id: 'ITEM1', transaction_status: 'SUCCESS', payout_item: { sender_item_id: 'winner-1-1', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM2', transaction_status: 'COMPLETED', payout_item: { sender_item_id: 'winner-2-2', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM3', transaction_status: 'PENDING', payout_item: { sender_item_id: 'winner-3-3', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM4', transaction_status: 'ONHOLD', payout_item: { sender_item_id: 'winner-4-4', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM5', transaction_status: 'RETURNED', payout_item: { sender_item_id: 'winner-5-5', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM6', transaction_status: 'UNCLAIMED', payout_item: { sender_item_id: 'winner-6-6', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM7', transaction_status: 'FAILED', payout_item: { sender_item_id: 'winner-7-7', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM8', transaction_status: 'DENIED', payout_item: { sender_item_id: 'winner-8-8', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM9', transaction_status: 'BLOCKED', payout_item: { sender_item_id: 'winner-9-9', amount: { value: '10.00' }, receiver: 'test@example.com' }},
      { payout_item_id: 'ITEM10', transaction_status: 'REFUNDED', payout_item: { sender_item_id: 'winner-10-10', amount: { value: '10.00' }, receiver: 'test@example.com' }}
    ]
  };
  
  const result = parseEnhancedPayoutResponse(testResponse);
  const statuses = result.individualResults.map(item => item.status);
  
  // Verify status mappings
  assert(statuses.includes('success'));  // SUCCESS, COMPLETED
  assert(statuses.includes('pending'));  // PENDING, ONHOLD, RETURNED  
  assert(statuses.includes('unclaimed')); // UNCLAIMED
  assert(statuses.includes('failed'));   // FAILED, DENIED, BLOCKED, REFUNDED
  
  // Count expected mappings
  const successCount = statuses.filter(s => s === 'success').length;
  const pendingCount = statuses.filter(s => s === 'pending').length;
  const unclaimedCount = statuses.filter(s => s === 'unclaimed').length;
  const failedCount = statuses.filter(s => s === 'failed').length;
  
  assert.strictEqual(successCount, 2);   // SUCCESS, COMPLETED
  assert.strictEqual(pendingCount, 3);   // PENDING, ONHOLD, RETURNED
  assert.strictEqual(unclaimedCount, 1); // UNCLAIMED
  assert.strictEqual(failedCount, 4);    // FAILED, DENIED, BLOCKED, REFUNDED
  
  console.log('   ✓ All PayPal statuses mapped correctly');
  console.log(`   ✓ Status distribution: ${successCount} success, ${pendingCount} pending, ${unclaimedCount} unclaimed, ${failedCount} failed`);
});

// Summary
console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All Step 2 unit tests passed! The enhanced PayPal parsing is ready.');
  console.log('\n✅ Step 2 Verification Complete:');
  console.log('   • PayPal response parsing works correctly');
  console.log('   • Status mapping handles all PayPal statuses');
  console.log('   • Amount conversion (dollars to cents) accurate');
  console.log('   • Winner ID extraction robust with error handling');
  console.log('   • Error information captured for failed items');
  console.log('   • No database calls - pure parsing layer');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}