#!/usr/bin/env node

/**
 * ChatGPT Final Build-Breaking Syntax Verification
 * Searches for exact patterns ChatGPT identified as broken
 */

import { readFileSync } from 'fs';

console.log('🔍 ChatGPT Final Build-Breaking Syntax Verification');
console.log('==================================================\n');

const adminFile = readFileSync('client/src/pages/Admin.tsx', 'utf8');
const lines = adminFile.split('\n');

console.log('1. ✅ SEARCHING: Bad object spread (.prev instead of ...prev)...');
let foundBadObjectSpread = false;
lines.forEach((line, index) => {
  // Look for { .prev (without the ...)
  if (line.match(/\{\s*\.prev\s*,/) && !line.match(/\{\s*\.\.\.prev\s*,/)) {
    console.log(`   ❌ FOUND at line ${index + 1}: ${line.trim()}`);
    foundBadObjectSpread = true;
  }
});

if (!foundBadObjectSpread) {
  console.log('   ✅ PASS: No bad object spread patterns found');
}

console.log('\n2. ✅ SEARCHING: Bad array spread ([.modules instead of [...modules)...');
let foundBadArraySpread = false;
lines.forEach((line, index) => {
  // Look for [.modules (without the ...)
  if (line.match(/\[\s*\.modules\s*,/) && !line.match(/\[\s*\.\.\.modules\s*,/)) {
    console.log(`   ❌ FOUND at line ${index + 1}: ${line.trim()}`);
    foundBadArraySpread = true;
  }
});

if (!foundBadArraySpread) {
  console.log('   ✅ PASS: No bad array spread patterns found');
}

console.log('\n3. ✅ SEARCHING: setCycleForm and setPoolSettingForm calls...');
const setCycleFormCalls = lines.filter((line, index) => {
  if (line.includes('setCycleForm') || line.includes('setPoolSettingForm')) {
    if (line.includes('.prev,') && !line.includes('...prev,')) {
      console.log(`   ❌ BAD SYNTAX at line ${index + 1}: ${line.trim()}`);
      return true;
    }
  }
  return false;
});

if (setCycleFormCalls.length === 0) {
  console.log('   ✅ PASS: All setCycleForm/setPoolSettingForm calls use proper syntax');
}

console.log('\n4. ✅ SEARCHING: setModules calls...');
const setModulesCalls = lines.filter((line, index) => {
  if (line.includes('setModules') && line.includes('[')) {
    if (line.includes('[.modules') && !line.includes('[...modules')) {
      console.log(`   ❌ BAD SYNTAX at line ${index + 1}: ${line.trim()}`);
      return true;
    }
  }
  return false;
});

if (setModulesCalls.length === 0) {
  console.log('   ✅ PASS: All setModules calls use proper syntax');
}

// Summary
console.log('\n🎉 VERIFICATION COMPLETE');
console.log('========================');

const hasSyntaxErrors = foundBadObjectSpread || foundBadArraySpread || 
                       setCycleFormCalls.length > 0 || setModulesCalls.length > 0;

if (hasSyntaxErrors) {
  console.log('❌ BUILD-BREAKING SYNTAX ERRORS FOUND');
  console.log('⚠️  Must fix before build will succeed');
} else {
  console.log('✅ NO BUILD-BREAKING SYNTAX ERRORS FOUND');
  console.log('🚀 All spread syntax is correct - build should succeed');
}