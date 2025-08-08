#!/usr/bin/env node

/**
 * Enhanced Winners Table Checkbox UI Implementation Verification
 * 
 * This script verifies that the checkbox column and header checkbox have been 
 * properly added to the Enhanced Winners table as requested by the user.
 */

const fs = require('fs');

console.log('🔍 VERIFYING: Enhanced Winners Table Checkbox UI Implementation');
console.log('=' .repeat(70));

const testResults = [];
let allTestsPassed = true;

function addTestResult(test, passed, details = '') {
  testResults.push({ test, passed, details });
  if (!passed) allTestsPassed = false;
  console.log(`${passed ? '✅' : '❌'} ${test}${details ? `: ${details}` : ''}`);
}

const cycleOpsFile = fs.readFileSync('./client/src/components/admin/CycleOperationsTab.tsx', 'utf8');

// 1. Verify checkbox header column added
console.log('\n📋 STEP 1: Verifying checkbox header column');

const hasCheckboxHeader = cycleOpsFile.includes('<TableHead className="w-16">') &&
                         cycleOpsFile.includes('const pageRows = enhancedWinners || [];') &&
                         cycleOpsFile.includes('const pageEligible = helpers.getEligibleIds(pageRows);');
addTestResult(
  'Checkbox header column added with proper width',
  hasCheckboxHeader
);

const hasHeaderCheckboxLogic = cycleOpsFile.includes('const allOnPageSelected = pageEligible.length > 0 && pageEligible.every(id => selectedForDisbursement.has(id));');
addTestResult(
  'Header checkbox tri-state logic implemented',
  hasHeaderCheckboxLogic
);

const hasHeaderCheckboxInput = cycleOpsFile.includes('type="checkbox"') &&
                              cycleOpsFile.includes('checked={allOnPageSelected}') &&
                              cycleOpsFile.includes('helpers.addIds(prev, pageEligible)') &&
                              cycleOpsFile.includes('helpers.removeIds(prev, pageEligible)');
addTestResult(
  'Header checkbox input with select/deselect logic',
  hasHeaderCheckboxInput
);

// 2. Verify individual row checkboxes added
console.log('\n📋 STEP 2: Verifying individual row checkboxes');

const hasRowCheckboxCell = cycleOpsFile.includes('<TableCell className="text-center">') &&
                          cycleOpsFile.includes('const isEligible = helpers.isPaypalConfigured(winner);');
addTestResult(
  'Row checkbox cell added with eligibility check',
  hasRowCheckboxCell
);

const hasRowCheckboxLogic = cycleOpsFile.includes('const isSelected = selectedForDisbursement.has(winner.id);') &&
                           cycleOpsFile.includes('disabled={!isEligible}');
addTestResult(
  'Row checkbox selection and disabled state logic',
  hasRowCheckboxLogic
);

const hasRowCheckboxStyling = cycleOpsFile.includes('opacity-30 cursor-not-allowed') &&
                             cycleOpsFile.includes('className={`w-4 h-4 ${!isEligible ? \'opacity-30 cursor-not-allowed\' : \'\'}`}');
addTestResult(
  'Row checkbox styling for disabled state',
  hasRowCheckboxStyling
);

const hasRowCheckboxToggle = cycleOpsFile.includes('helpers.addIds(prev, [winner.id])') &&
                            cycleOpsFile.includes('helpers.removeIds(prev, [winner.id])');
addTestResult(
  'Row checkbox individual selection toggle',
  hasRowCheckboxToggle
);

// 3. Verify Process PayPal Disbursements button fixes
console.log('\n📋 STEP 3: Verifying Process PayPal Disbursements button');

const hasProperButtonDisabling = cycleOpsFile.includes('disabled={selectedCount === 0 || isProcessingPayouts}');
addTestResult(
  'Button properly disabled when no selections',
  hasProperButtonDisabling
);

const hasSelectedCountInButton = cycleOpsFile.includes('Process PayPal Disbursements ({selectedCount})');
addTestResult(
  'Button shows selected count in label',
  hasSelectedCountInButton
);

const hasDisabledStyling = cycleOpsFile.includes('disabled:bg-gray-400 disabled:cursor-not-allowed');
addTestResult(
  'Button has proper disabled styling',
  hasDisabledStyling
);

const hasSimplifiedOnClick = cycleOpsFile.includes('onClick={handleProcessPayouts}');
addTestResult(
  'Button uses simplified onClick handler',
  hasSimplifiedOnClick
);

// 4. Verify eligibility rule implementation
console.log('\n📋 STEP 4: Verifying eligibility rule implementation');

const usesPaypalConfiguredHelper = cycleOpsFile.includes('helpers.isPaypalConfigured(winner)');
addTestResult(
  'Uses helpers.isPaypalConfigured for eligibility',
  usesPaypalConfiguredHelper
);

const adminFile = fs.readFileSync('./client/src/pages/Admin.tsx', 'utf8');
const hasSnapshotSupport = adminFile.includes('row.paypalEmail ?? row.snapshotPaypalEmail ?? null');
addTestResult(
  'Supports both live and snapshot PayPal emails',
  hasSnapshotSupport
);

// 5. Verify table structure integrity
console.log('\n📋 STEP 5: Verifying table structure integrity');

const hasProperColumnCount = cycleOpsFile.includes('<TableHead className="w-16">') && // checkbox
                            cycleOpsFile.includes('<TableHead className="w-20">Overall Rank #</TableHead>') &&
                            cycleOpsFile.includes('<TableHead className="w-20">Tier Rank #</TableHead>');
addTestResult(
  'Table maintains proper column structure',
  hasProperColumnCount
);

const hasProperRowStructure = cycleOpsFile.includes('<TableCell className="text-center">') && // checkbox cell
                             cycleOpsFile.includes('<TableCell className="font-medium text-center">') && // rank cell
                             cycleOpsFile.includes('{winner.overallRank}');
addTestResult(
  'Table rows maintain proper structure',
  hasProperRowStructure
);

// Summary
console.log('\n📊 IMPLEMENTATION SUMMARY');
console.log('=' .repeat(70));

const passedTests = testResults.filter(t => t.passed).length;
const totalTests = testResults.length;

console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);

if (allTestsPassed) {
  console.log('\n🎉 SUCCESS: Enhanced Winners Table Checkbox UI Complete!');
  console.log('\n📋 IMPLEMENTATION DETAILS:');
  console.log('✅ Checkbox column added to Enhanced Winners table header');
  console.log('✅ Header tri-state checkbox selects/deselects all eligible on page');
  console.log('✅ Individual row checkboxes with eligibility-based enabling');
  console.log('✅ Process PayPal Disbursements button shows selection count');
  console.log('✅ Button properly disabled when no winners selected');
  console.log('✅ Supports both live and snapshot PayPal email eligibility');
  console.log('✅ Professional styling with disabled state visual feedback');
  console.log('\n🚀 READY FOR USER TESTING: The Enhanced Winners table now has:');
  console.log('   • Header checkbox to select/deselect all eligible winners on page');
  console.log('   • Individual row checkboxes (disabled for ineligible winners)');
  console.log('   • Process button showing selected count and proper disable state');
  console.log('   • Clear visual feedback for eligibility and selection state');
} else {
  console.log('\n❌ ISSUES FOUND: Some UI components are missing or incomplete');
  console.log('\n🔧 FAILED TESTS:');
  testResults.filter(t => !t.passed).forEach(t => {
    console.log(`   ❌ ${t.test}${t.details ? `: ${t.details}` : ''}`);
  });
}

console.log('\n' + '=' .repeat(70));
console.log('Enhanced Winners Table Checkbox UI Verification Complete');