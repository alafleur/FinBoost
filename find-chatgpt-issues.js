/**
 * Script to systematically find ChatGPT's specific issues
 */

const fs = require('fs');

console.log('=== FINDING CHATGPT CRITICAL ISSUES ===');

// Read both files
const adminContent = fs.readFileSync('client/src/pages/Admin.tsx', 'utf8');
const cycleOpsContent = fs.readFileSync('client/src/components/admin/CycleOperationsTab.tsx', 'utf8');

console.log('\n1. SEARCHING FOR SPREAD SYNTAX TYPOS:');
console.log('Looking for: { .prev, ... } and {.editingUser, ...}');

// Check for bad spread syntax
const badSpreadRegex = /{\s*\.(\w+)/g;
let matches = [];

let match;
while ((match = badSpreadRegex.exec(adminContent)) !== null) {
    matches.push({
        file: 'Admin.tsx',
        line: adminContent.substring(0, match.index).split('\n').length,
        match: match[0],
        context: adminContent.substring(match.index - 50, match.index + 50)
    });
}

while ((match = badSpreadRegex.exec(cycleOpsContent)) !== null) {
    matches.push({
        file: 'CycleOperationsTab.tsx', 
        line: cycleOpsContent.substring(0, match.index).split('\n').length,
        match: match[0],
        context: cycleOpsContent.substring(match.index - 50, match.index + 50)
    });
}

if (matches.length > 0) {
    console.log('FOUND BAD SPREAD SYNTAX:');
    matches.forEach(m => {
        console.log(`${m.file}:${m.line} - ${m.match}`);
        console.log(`Context: ...${m.context}...`);
    });
} else {
    console.log('✅ No bad spread syntax found');
}

console.log('\n2. SEARCHING FOR PAGINATION ISSUES:');
console.log('Looking for: currentPoolSettings.id usage');

const paginationRegex = /currentPoolSettings\.id/g;
let paginationMatches = [];

while ((match = paginationRegex.exec(cycleOpsContent)) !== null) {
    paginationMatches.push({
        file: 'CycleOperationsTab.tsx',
        line: cycleOpsContent.substring(0, match.index).split('\n').length,
        context: cycleOpsContent.substring(match.index - 100, match.index + 100)
    });
}

if (paginationMatches.length > 0) {
    console.log('FOUND PAGINATION ISSUES:');
    paginationMatches.forEach(m => {
        console.log(`${m.file}:${m.line}`);
        console.log(`Context: ...${m.context}...`);
    });
} else {
    console.log('✅ No currentPoolSettings.id usage found');
}

console.log('\n3. SEARCHING FOR PAYPAL BUTTON LOGIC:');
console.log('Looking for: Process PayPal Disbursements button');

const buttonRegex = /Process PayPal Disbursements/g;
let buttonMatches = [];

while ((match = buttonRegex.exec(cycleOpsContent)) !== null) {
    buttonMatches.push({
        line: cycleOpsContent.substring(0, match.index).split('\n').length,
        context: cycleOpsContent.substring(match.index - 200, match.index + 200)
    });
}

if (buttonMatches.length > 0) {
    console.log('FOUND PAYPAL BUTTON:');
    buttonMatches.forEach(m => {
        console.log(`Line ${m.line}`);
        console.log(`Context: ...${m.context}...`);
    });
} else {
    console.log('❌ PayPal button not found - need to locate it');
}

console.log('\n=== SEARCH COMPLETE ===');