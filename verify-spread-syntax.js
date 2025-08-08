#!/usr/bin/env node

/**
 * Verify Spread Syntax - Look for ChatGPT's specific error patterns
 */

import { readFileSync } from 'fs';

const adminFile = readFileSync('client/src/pages/Admin.tsx', 'utf8');
const lines = adminFile.split('\n');

console.log('🔍 Verifying Spread Syntax Patterns');
console.log('===================================\n');

// Check 1: Bad object spread patterns
console.log('1. Checking for .prev without ... (object spread)');
let badObjectSpread = false;
lines.forEach((line, index) => {
  // Look for {.prev or { .prev but not {...prev
  if ((line.includes('{ .prev') || line.includes('{.prev')) && !line.includes('...prev')) {
    console.log(`   ❌ Line ${index + 1}: ${line.trim()}`);
    badObjectSpread = true;
  }
});

if (!badObjectSpread) {
  console.log('   ✅ No bad object spread patterns found');
}

// Check 2: Bad array spread patterns  
console.log('\n2. Checking for .modules without ... (array spread)');
let badArraySpread = false;
lines.forEach((line, index) => {
  // Look for [.modules or [ .modules but not [...modules
  if ((line.includes('[ .modules') || line.includes('[.modules')) && !line.includes('...modules')) {
    console.log(`   ❌ Line ${index + 1}: ${line.trim()}`);
    badArraySpread = true;
  }
});

if (!badArraySpread) {
  console.log('   ✅ No bad array spread patterns found');
}

// Check 3: Look for specific functions ChatGPT mentioned
console.log('\n3. Checking fetchCurrentPoolSettings function');
const fetchCurrentStart = adminFile.indexOf('const fetchCurrentPoolSettings');
const fetchCurrentEnd = adminFile.indexOf('};', fetchCurrentStart);
const fetchCurrentCode = adminFile.substring(fetchCurrentStart, fetchCurrentEnd + 2);

if (fetchCurrentCode.includes('.prev,') && !fetchCurrentCode.includes('...prev,')) {
  console.log('   ❌ Found .prev without ... in fetchCurrentPoolSettings');
} else {
  console.log('   ✅ fetchCurrentPoolSettings uses correct spread syntax');
}

// Check 4: Look for handleCreateModule
console.log('\n4. Checking handleCreateModule function');
const createModuleStart = adminFile.indexOf('const handleCreateModule');
const createModuleEnd = adminFile.indexOf('};', createModuleStart);
const createModuleCode = adminFile.substring(createModuleStart, createModuleEnd + 2);

if (createModuleCode.includes('.modules,') && !createModuleCode.includes('...modules,')) {
  console.log('   ❌ Found .modules without ... in handleCreateModule');
} else {
  console.log('   ✅ handleCreateModule uses correct spread syntax');
}

console.log('\n🎉 VERIFICATION COMPLETE');
console.log('========================');

if (!badObjectSpread && !badArraySpread) {
  console.log('✅ All spread syntax is correct');
  console.log('🚀 No build-breaking typos found');
} else {
  console.log('❌ Found syntax errors that need fixing');
}