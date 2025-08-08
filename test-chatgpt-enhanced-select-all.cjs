#!/usr/bin/env node

/**
 * ChatGPT Enhanced Select All Implementation Verification Script
 * 
 * This script verifies that the enhanced "Select All Eligible" controls have been 
 * properly implemented according to ChatGPT's detailed specification.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING: ChatGPT Enhanced Select All Implementation');
console.log('=' .repeat(65));

// Test results tracking
const testResults = [];
let allTestsPassed = true;

function addTestResult(test, passed, details = '') {
  testResults.push({ test, passed, details });
  if (!passed) allTestsPassed = false;
  console.log(`${passed ? '✅' : '❌'} ${test}${details ? `: ${details}` : ''}`);
}

// 1. Verify centralized selection helpers in Admin.tsx
console.log('\n📋 STEP 1: Verifying centralized selection helpers in Admin.tsx');

const adminFile = fs.readFileSync('./client/src/pages/Admin.tsx', 'utf8');

// Check for SelectScope type
const hasSelectScope = adminFile.includes('type SelectScope = \'page\' | \'tier\' | \'all\';');
addTestResult(
  'SelectScope type defined',
  hasSelectScope
);

// Check for getEligibleIds helper
const hasGetEligibleIds = adminFile.includes('const getEligibleIds = (rows: any[]) =>') &&
                         adminFile.includes('.filter(isPaypalConfigured)');
addTestResult(
  'getEligibleIds helper function exists',
  hasGetEligibleIds
);

// Check for addIds helper
const hasAddIds = adminFile.includes('const addIds = (current: Set<number>, ids: number[]) => {');
addTestResult(
  'addIds helper function exists',
  hasAddIds
);

// Check for removeIds helper
const hasRemoveIds = adminFile.includes('const removeIds = (current: Set<number>, ids: number[]) => {');
addTestResult(
  'removeIds helper function exists',
  hasRemoveIds
);

// 2. Verify helper functions passed to CycleOperationsTab
console.log('\n📋 STEP 2: Verifying helpers passed to CycleOperationsTab');

const helpersPassedCorrectly = adminFile.includes('helpers={{') &&
                              adminFile.includes('getPaypalDisplay,') &&
                              adminFile.includes('isPaypalConfigured,') &&
                              adminFile.includes('getEligibleIds,') &&
                              adminFile.includes('addIds,') &&
                              adminFile.includes('removeIds');
addTestResult(
  'All helper functions passed to CycleOperationsTab',
  helpersPassedCorrectly
);

// 3. Verify CycleOperationsTab interface and props updated
console.log('\n📋 STEP 3: Verifying CycleOperationsTab interface updated');

const cycleOpsFile = fs.readFileSync('./client/src/components/admin/CycleOperationsTab.tsx', 'utf8');

// Check for helpers in interface
const hasHelpersInterface = cycleOpsFile.includes('helpers: {') &&
                           cycleOpsFile.includes('getPaypalDisplay: (row: any) => string | null;') &&
                           cycleOpsFile.includes('isPaypalConfigured: (row: any) => boolean;') &&
                           cycleOpsFile.includes('getEligibleIds: (rows: any[]) => number[];');
addTestResult(
  'CycleOperationsTabProps interface includes helpers',
  hasHelpersInterface
);

// Check for helpers parameter in function
const hasHelpersParam = cycleOpsFile.includes('{ cycleSettings, onRefresh, helpers }: CycleOperationsTabProps');
addTestResult(
  'CycleOperationsTab function accepts helpers parameter',
  hasHelpersParam
);

// 4. Verify enhanced Select All controls implementation
console.log('\n📋 STEP 4: Verifying enhanced Select All controls');

// Check for enhanced controls comment
const hasEnhancedComment = cycleOpsFile.includes('Enhanced Select All Eligible Winners Controls (ChatGPT Implementation)');
addTestResult(
  'Enhanced controls section marked with ChatGPT comment',
  hasEnhancedComment
);

// Check for pageRows data source
const hasPageRows = cycleOpsFile.includes('const pageRows = enhancedWinners || [];');
addTestResult(
  'pageRows data source defined',
  hasPageRows
);

// Check for helpers.getEligibleIds usage
const usesGetEligibleIds = cycleOpsFile.includes('const pageEligible = helpers.getEligibleIds(pageRows);');
addTestResult(
  'Uses helpers.getEligibleIds for eligible calculation',
  usesGetEligibleIds
);

// Check for allOnPageSelected logic
const hasAllOnPageSelected = cycleOpsFile.includes('const allOnPageSelected =') &&
                            cycleOpsFile.includes('pageEligible.every(id => selectedForDisbursement.has(id))');
addTestResult(
  'allOnPageSelected logic implemented',
  hasAllOnPageSelected
);

// Check for helpers.addIds and helpers.removeIds usage
const usesHelperFunctions = cycleOpsFile.includes('helpers.addIds(prev, pageEligible)') &&
                           cycleOpsFile.includes('helpers.removeIds(prev, pageEligible)');
addTestResult(
  'Uses helpers.addIds and helpers.removeIds in onChange',
  usesHelperFunctions
);

// Check for Clear selection button
const hasClearButton = cycleOpsFile.includes('Clear selection') &&
                      cycleOpsFile.includes('setSelectedForDisbursement(new Set())');
addTestResult(
  'Clear selection button implemented',
  hasClearButton
);

// 5. Verify button text and messaging
console.log('\n📋 STEP 5: Verifying UI text and messaging');

// Check for "Select all eligible on this page" text
const hasPageSpecificText = cycleOpsFile.includes('Select all eligible on this page ({pageEligible.length})');
addTestResult(
  'Page-specific selection text implemented',
  hasPageSpecificText
);

// Check for PayPal email description
const hasPaypalDescription = cycleOpsFile.includes('Winners with valid PayPal emails');
addTestResult(
  'PayPal email description included',
  hasPaypalDescription
);

// Check for selected count in button (should already exist)
const hasSelectedCount = cycleOpsFile.includes('const selectedCount = selectedForDisbursement.size;');
addTestResult(
  'Button uses selectedCount from selectedForDisbursement',
  hasSelectedCount
);

// 6. Verify button styling and layout
console.log('\n📋 STEP 6: Verifying styling and layout');

const hasProperStyling = cycleOpsFile.includes('bg-gray-50 rounded-lg') &&
                        cycleOpsFile.includes('gap-3 mb-3');
addTestResult(
  'Enhanced controls have proper styling',
  hasProperStyling
);

const hasClearButtonLayout = cycleOpsFile.includes('ml-auto') &&
                            cycleOpsFile.includes('variant="outline"');
addTestResult(
  'Clear button has proper layout styling',
  hasClearButtonLayout
);

// 7. Verify data integrity (snapshot PayPal support)
console.log('\n📋 STEP 7: Verifying snapshot PayPal email support');

// Check that getPaypalDisplay includes snapshot support
const hasSnapshotSupport = adminFile.includes('row.paypalEmail ?? row.snapshotPaypalEmail ?? null');
addTestResult(
  'getPaypalDisplay includes snapshot PayPal email support',
  hasSnapshotSupport
);

// Check that loadEnhancedWinnersPaginated includes id field
const hasIdFieldInMapping = adminFile.includes('id: winner.id, // Add id field for selection functionality');
addTestResult(
  'Enhanced winners data mapping includes id field',
  hasIdFieldInMapping
);

// Summary
console.log('\n📊 IMPLEMENTATION SUMMARY');
console.log('=' .repeat(65));

const passedTests = testResults.filter(t => t.passed).length;
const totalTests = testResults.length;

console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);

if (allTestsPassed) {
  console.log('\n🎉 SUCCESS: ChatGPT Enhanced Select All Implementation Complete!');
  console.log('\n📋 IMPLEMENTATION DETAILS:');
  console.log('✅ Centralized selection helpers added to Admin.tsx');
  console.log('✅ Helper functions passed to CycleOperationsTab component');
  console.log('✅ Enhanced "Select all eligible on this page" checkbox');
  console.log('✅ Clear selection button with proper styling');
  console.log('✅ Uses existing PayPal helpers for eligibility');
  console.log('✅ Supports both live and snapshot PayPal emails');
  console.log('✅ Page-specific selection with accurate count display');
  console.log('\n🚀 READY FOR TESTING: Enhanced admin controls now provide:');
  console.log('   • One-click selection of all eligible winners on current page');
  console.log('   • Clear selection button to reset all selections');
  console.log('   • Proper eligibility filtering using centralized helpers');
  console.log('   • Support for both live and snapshot PayPal emails');
  console.log('   • Professional UI with clear messaging and counts');
} else {
  console.log('\n❌ ISSUES FOUND: Some implementation steps are incomplete');
  console.log('\n🔧 FAILED TESTS:');
  testResults.filter(t => !t.passed).forEach(t => {
    console.log(`   ❌ ${t.test}${t.details ? `: ${t.details}` : ''}`);
  });
}

console.log('\n' + '=' .repeat(65));
console.log('ChatGPT Enhanced Select All Verification Complete');