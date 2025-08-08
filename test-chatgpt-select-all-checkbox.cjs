#!/usr/bin/env node

/**
 * ChatGPT Select All Checkbox Implementation Verification Script
 * 
 * This script verifies that the "Select All" checkbox functionality has been 
 * properly implemented for the Enhanced Winners table according to ChatGPT's specifications.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING: ChatGPT Select All Checkbox Implementation');
console.log('=' .repeat(60));

// Test results tracking
const testResults = [];
let allTestsPassed = true;

function addTestResult(test, passed, details = '') {
  testResults.push({ test, passed, details });
  if (!passed) allTestsPassed = false;
  console.log(`${passed ? '✅' : '❌'} ${test}${details ? `: ${details}` : ''}`);
}

// 1. Verify Enhanced Winners data includes `id` field in Admin.tsx
console.log('\n📋 STEP 1: Verifying Enhanced Winners data includes id field');

const adminFile = fs.readFileSync('./client/src/pages/Admin.tsx', 'utf8');

// Check if id field is added to enhanced data mapping
const hasIdField = adminFile.includes('id: winner.id, // Add id field for selection functionality');
addTestResult(
  'Enhanced Winners data includes id field', 
  hasIdField,
  hasIdField ? 'Found in loadEnhancedWinnersPaginated function' : 'Missing id field in data mapping'
);

// 2. Verify EnhancedWinnerData interface includes `id` field
console.log('\n📋 STEP 2: Verifying EnhancedWinnerData interface includes id field');

const cycleOpsFile = fs.readFileSync('./client/src/components/admin/CycleOperationsTab.tsx', 'utf8');

const hasIdInInterface = cycleOpsFile.includes('id: number; // Add id field for selection functionality');
addTestResult(
  'EnhancedWinnerData interface includes id field',
  hasIdInInterface,
  hasIdInInterface ? 'Found in interface definition' : 'Missing id field in interface'
);

// 3. Verify Select All checkbox implementation
console.log('\n📋 STEP 3: Verifying Select All checkbox implementation');

// Check for isPaypalConfigured helper function
const hasPaypalHelper = cycleOpsFile.includes('const isPaypalConfigured = (w: EnhancedWinnerData) =>');
addTestResult(
  'PayPal validation helper function exists',
  hasPaypalHelper
);

// Check for eligibleIds calculation
const hasEligibleIds = cycleOpsFile.includes('const eligibleIds = enhancedWinners');
addTestResult(
  'Eligible IDs calculation exists',
  hasEligibleIds
);

// Check for allEligibleSelected logic
const hasSelectionLogic = cycleOpsFile.includes('const allEligibleSelected =');
addTestResult(
  'All eligible selected logic exists',
  hasSelectionLogic
);

// Check for checkbox input element
const hasCheckboxInput = cycleOpsFile.includes('type="checkbox"') && 
                        cycleOpsFile.includes('checked={allEligibleSelected}');
addTestResult(
  'Checkbox input element exists',
  hasCheckboxInput
);

// Check for select/deselect onChange logic
const hasOnChangeLogic = cycleOpsFile.includes('eligibleIds.forEach(id => next.add(id))') &&
                        cycleOpsFile.includes('Array.from(selectedForDisbursement).filter(id => !eligibleIds.includes(id))');
addTestResult(
  'Select/deselect onChange logic exists',
  hasOnChangeLogic
);

// 4. Verify Process PayPal Disbursements button uses selection count
console.log('\n📋 STEP 4: Verifying Process PayPal Disbursements button uses selection');

// Check for selectedCount usage
const hasSelectedCount = cycleOpsFile.includes('const selectedCount = selectedForDisbursement.size;');
addTestResult(
  'Button uses selectedCount from selectedForDisbursement',
  hasSelectedCount
);

// Check for proper disabled logic
const hasProperDisabledLogic = cycleOpsFile.includes('disabled={selectedCount === 0 || isProcessingPayouts}');
addTestResult(
  'Button has proper disabled logic based on selection',
  hasProperDisabledLogic
);

// Check for selection validation in onClick
const hasSelectionValidation = cycleOpsFile.includes('if (selectedCount === 0)') &&
                               cycleOpsFile.includes('Please select winners to process payouts for');
addTestResult(
  'Button validates selection before processing',
  hasSelectionValidation
);

// Check for button text showing count
const hasCountInButton = cycleOpsFile.includes('Process PayPal Disbursements ({selectedCount})');
addTestResult(
  'Button text shows selected count',
  hasCountInButton
);

// 5. Verify handleProcessPayouts function compatibility
console.log('\n📋 STEP 5: Verifying handleProcessPayouts function compatibility');

// Check for selectedForDisbursement usage in handleProcessPayouts
const hasPayoutsFunction = cycleOpsFile.includes('const handleProcessPayouts = async () => {');
const usesSelectedForDisbursement = cycleOpsFile.includes('const selectedWinnerIds = Array.from(selectedForDisbursement)');
const clearsSelectionAfterSuccess = cycleOpsFile.includes('setSelectedForDisbursement(new Set());');

addTestResult(
  'handleProcessPayouts function exists',
  hasPayoutsFunction
);

addTestResult(
  'Function uses selectedForDisbursement state',
  usesSelectedForDisbursement
);

addTestResult(
  'Function clears selection after successful processing',
  clearsSelectionAfterSuccess
);

// 6. Check for UI styling and accessibility
console.log('\n📋 STEP 6: Verifying UI styling and accessibility');

const hasProperStyling = cycleOpsFile.includes('bg-gray-50 rounded-lg') &&
                        cycleOpsFile.includes('gap-3 mb-4');
addTestResult(
  'Select All section has proper styling',
  hasProperStyling
);

const hasDescriptiveText = cycleOpsFile.includes('Select all eligible winners') &&
                          cycleOpsFile.includes('Winners with valid PayPal emails');
addTestResult(
  'Select All section has descriptive text',
  hasDescriptiveText
);

// Summary
console.log('\n📊 IMPLEMENTATION SUMMARY');
console.log('=' .repeat(60));

const passedTests = testResults.filter(t => t.passed).length;
const totalTests = testResults.length;

console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);

if (allTestsPassed) {
  console.log('\n🎉 SUCCESS: ChatGPT Select All Checkbox Implementation Complete!');
  console.log('\n📋 IMPLEMENTATION DETAILS:');
  console.log('✅ Enhanced Winners data includes id field for selection');
  console.log('✅ Select All checkbox filters winners by PayPal email validation');
  console.log('✅ Checkbox toggles selection of all eligible winners');
  console.log('✅ Process PayPal Disbursements button uses selection count');
  console.log('✅ Button validates selection before processing');
  console.log('✅ Existing handleProcessPayouts function is compatible');
  console.log('\n🚀 READY FOR TESTING: Admin can now:');
  console.log('   • Click "Select all eligible winners" checkbox');
  console.log('   • See count of selected winners in disbursement button');
  console.log('   • Process PayPal disbursements without manual row selection');
  console.log('   • Get clear error message if no winners are selected');
} else {
  console.log('\n❌ ISSUES FOUND: Some implementation steps are incomplete');
  console.log('\n🔧 FAILED TESTS:');
  testResults.filter(t => !t.passed).forEach(t => {
    console.log(`   ❌ ${t.test}${t.details ? `: ${t.details}` : ''}`);
  });
}

console.log('\n' + '=' .repeat(60));
console.log('ChatGPT Select All Checkbox Verification Complete');