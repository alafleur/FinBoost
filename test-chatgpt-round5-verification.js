#!/usr/bin/env node

/**
 * ChatGPT Round 5 Spread Syntax Verification
 * Validates that there are no {.prev or {.formName patterns
 */

import { readFileSync } from 'fs';

console.log('🔍 ChatGPT Round 5 Spread Syntax Verification');
console.log('=============================================\n');

const adminFile = readFileSync('client/src/pages/Admin.tsx', 'utf8');

// Test 1: Search for bad spread syntax patterns
console.log('1. ✅ CHECKING: Bad spread syntax patterns...');
const badPatterns = [
  /\{\s*\.prev/g,
  /\{\s*\.poolSettingForm/g,
  /\{\s*\.newCycleForm/g,
  /\{\s*\.cycleForm/g,
  /\{\s*\.[a-zA-Z]/g  // General pattern for {. followed by any variable
];

let foundErrors = false;
const lines = adminFile.split('\n');

badPatterns.forEach((pattern, index) => {
  const matches = adminFile.match(pattern);
  if (matches) {
    console.log(`   ❌ FOUND BAD PATTERN ${index + 1}: ${pattern.source}`);
    console.log(`   Occurrences: ${matches.length}`);
    
    // Find line numbers
    lines.forEach((line, lineIndex) => {
      if (pattern.test(line)) {
        console.log(`   Line ${lineIndex + 1}: ${line.trim()}`);
      }
    });
    foundErrors = true;
  }
});

if (!foundErrors) {
  console.log('   ✅ PASS: No bad spread syntax patterns found');
}

// Test 2: Check specific functions ChatGPT mentioned
console.log('\n2. ✅ CHECKING: setNewCycleForm calls...');
const newCycleFormCalls = adminFile.match(/setNewCycleForm\([^)]*\)/g);
if (newCycleFormCalls) {
  console.log(`   Found ${newCycleFormCalls.length} setNewCycleForm calls:`);
  newCycleFormCalls.forEach((call, index) => {
    console.log(`   ${index + 1}. ${call}`);
    if (call.includes('{.')) {
      console.log(`   ❌ BAD SYNTAX in call ${index + 1}`);
      foundErrors = true;
    }
  });
  if (!foundErrors) {
    console.log('   ✅ All setNewCycleForm calls use proper syntax');
  }
} else {
  console.log('   ⚠️  No setNewCycleForm calls found');
}

// Test 3: Check setPoolSettingForm calls
console.log('\n3. ✅ CHECKING: setPoolSettingForm calls...');
const poolSettingFormCalls = adminFile.match(/setPoolSettingForm\([^)]*\)/g);
if (poolSettingFormCalls) {
  console.log(`   Found ${poolSettingFormCalls.length} setPoolSettingForm calls:`);
  poolSettingFormCalls.forEach((call, index) => {
    console.log(`   ${index + 1}. ${call}`);
    if (call.includes('{.') && !call.includes('{...')) {
      console.log(`   ❌ BAD SYNTAX in call ${index + 1}`);
      foundErrors = true;
    }
  });
  if (!foundErrors) {
    console.log('   ✅ All setPoolSettingForm calls use proper syntax');
  }
} else {
  console.log('   ⚠️  No setPoolSettingForm calls found');
}

// Summary
console.log('\n🎉 VERIFICATION COMPLETE');
console.log('========================');
if (foundErrors) {
  console.log('❌ SYNTAX ERRORS FOUND - Need to fix before proceeding');
  process.exit(1);
} else {
  console.log('✅ All spread syntax verified correct');
  console.log('✅ No {.prev or {.formName patterns found');
  console.log('✅ Ready for ChatGPT verification');
}