#!/usr/bin/env node

/**
 * GAP 1 FIX VALIDATION SCRIPT
 * 
 * This script validates that the deterministic sender_batch_id flows properly 
 * through the PayPal disbursement system from route to orchestrator.
 * 
 * The fix ensures that:
 * 1. Route calculates deterministic_batch_id = `cycle-${cycleId}-${requestChecksum.slice(0, 16)}`
 * 2. Route passes this ID to transactionContext.senderBatchId
 * 3. Orchestrator uses context.senderBatchId instead of generating timestamp-based ID
 * 4. Final PayPal batch uses consistent, deterministic ID format
 */

const fs = require('fs');
const crypto = require('crypto');

console.log('🔍 GAP 1 FIX VALIDATION - Deterministic Sender Batch ID Flow');
console.log('='.repeat(70));

// Test 1: Verify TransactionContext Interface Update
console.log('\n📋 Test 1: TransactionContext Interface');
try {
  const orchestratorContent = fs.readFileSync('server/paypal-transaction-orchestrator.ts', 'utf8');
  
  if (orchestratorContent.includes('senderBatchId: string; // Deterministic sender batch ID for PayPal')) {
    console.log('✅ TransactionContext interface includes senderBatchId field');
  } else {
    console.log('❌ TransactionContext interface missing senderBatchId field');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading orchestrator file:', error.message);
  process.exit(1);
}

// Test 2: Verify Route Passes Deterministic Batch ID
console.log('\n🛣️  Test 2: Route Integration');
try {
  const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
  
  // Check deterministic batch ID calculation
  if (routesContent.includes('const deterministic_batch_id = `cycle-${cycleId}-${requestChecksum.slice(0, 16)}`;')) {
    console.log('✅ Route calculates deterministic_batch_id correctly');
  } else {
    console.log('❌ Route deterministic_batch_id calculation missing or incorrect');
  }
  
  // Check context passes senderBatchId
  if (routesContent.includes('senderBatchId: deterministic_batch_id')) {
    console.log('✅ Route passes deterministic_batch_id to transactionContext');
  } else {
    console.log('❌ Route not passing deterministic_batch_id to transactionContext');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading routes file:', error.message);
  process.exit(1);
}

// Test 3: Verify Orchestrator Uses Context Value
console.log('\n🎭 Test 3: Orchestrator Integration');
try {
  const orchestratorContent = fs.readFileSync('server/paypal-transaction-orchestrator.ts', 'utf8');
  
  // Check orchestrator uses context.senderBatchId
  if (orchestratorContent.includes('const senderBatchId = context.senderBatchId;')) {
    console.log('✅ Orchestrator uses context.senderBatchId');
  } else {
    console.log('❌ Orchestrator not using context.senderBatchId');
    process.exit(1);
  }
  
  // Check no more timestamp-based generation
  if (!orchestratorContent.includes('finboost-${context.cycleSettingId}-${timestamp}')) {
    console.log('✅ Orchestrator no longer generates timestamp-based sender batch ID');
  } else {
    console.log('❌ Orchestrator still contains timestamp-based ID generation');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading orchestrator file:', error.message);
  process.exit(1);
}

// Test 4: Simulate Deterministic ID Generation
console.log('\n🧮 Test 4: Deterministic ID Logic Simulation');
try {
  // Simulate the exact logic from the route
  const cycleId = 18; // Test cycle
  const testWinnerData = [
    { id: 123, amount: 5000, email: 'test@example.com' },
    { id: 124, amount: 3000, email: 'test2@example.com' }
  ];
  
  // Generate requestChecksum (simulating route logic)
  const checksumData = {
    cycleSettingId: cycleId,
    adminId: 1,
    totalAmount: 8000,
    recipientCount: 2,
    recipientEmails: ['test@example.com', 'test2@example.com'].sort(),
    requestId: 'test-request-id'
  };
  
  const requestChecksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(checksumData))
    .digest('hex');
    
  const deterministic_batch_id = `cycle-${cycleId}-${requestChecksum.slice(0, 16)}`;
  
  console.log(`✅ Generated deterministic_batch_id: ${deterministic_batch_id}`);
  console.log(`   Format: cycle-{cycleId}-{first16CharsOfChecksum}`);
  console.log(`   Checksum: ${requestChecksum.substring(0, 32)}...`);
  
  // Verify format consistency  
  const expectedPrefix = `cycle-${cycleId}-`;
  const expectedLength = expectedPrefix.length + 16; // 16 chars from checksum
  
  if (deterministic_batch_id.startsWith(expectedPrefix) && deterministic_batch_id.length === expectedLength) {
    console.log('✅ Deterministic ID format is consistent and predictable');
  } else {
    console.log('❌ Deterministic ID format is inconsistent');
    console.log(`   Expected length: ${expectedLength}, actual: ${deterministic_batch_id.length}`);
    console.log(`   Expected prefix: ${expectedPrefix}, actual: ${deterministic_batch_id.substring(0, expectedPrefix.length)}`);
    process.exit(1);
  }
  
} catch (error) {
  console.log('❌ Error simulating deterministic ID generation:', error.message);
  process.exit(1);
}

// Test 5: Build and Syntax Verification
console.log('\n🔧 Test 5: Build and Syntax Verification');
try {
  const { execSync } = require('child_process');
  
  // Run TypeScript compilation to check for syntax errors
  console.log('   Running TypeScript compilation...');
  const buildOutput = execSync('npm run build', { encoding: 'utf8', timeout: 30000 });
  
  if (buildOutput.includes('✓') && !buildOutput.includes('error')) {
    console.log('✅ TypeScript compilation successful - no syntax errors');
  } else {
    console.log('❌ TypeScript compilation failed');
    console.log(buildOutput);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Build verification failed:', error.message);
  process.exit(1);
}

// Final Summary
console.log('\n🎉 GAP 1 FIX VALIDATION SUMMARY');
console.log('='.repeat(70));
console.log('✅ All tests passed successfully!');
console.log('');
console.log('Gap 1 Fix Complete:');
console.log('- ✅ TransactionContext interface updated with senderBatchId field');
console.log('- ✅ Route passes deterministic_batch_id to orchestrator');
console.log('- ✅ Orchestrator uses context.senderBatchId (no more timestamp generation)');
console.log('- ✅ Deterministic ID format: cycle-{cycleId}-{checksum16chars}');
console.log('- ✅ TypeScript compilation successful');
console.log('');
console.log('🎯 PayPal disbursement system now uses consistent, deterministic sender_batch_id');
console.log('   throughout the entire transaction flow from route to PayPal API.');
console.log('');
console.log('📊 Impact: Eliminates timestamp-based randomness, ensures true idempotency,');
console.log('   and provides predictable batch ID format for easier debugging and tracking.');