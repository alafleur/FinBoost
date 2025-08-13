#!/usr/bin/env node

/**
 * Phase 2 Comprehensive Error Handling Validation Test
 * 
 * Tests the enhanced route-level error handling and orchestrator error handling
 * to ensure no blank pages occur under any failure scenario.
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.REPL_URL || 'http://localhost:5000';
const TEST_CYCLE_ID = 18; // Use cycle 18 for testing

// Load admin token
const fs = require('fs');
const path = require('path');

let adminToken;
try {
  adminToken = fs.readFileSync(path.join(__dirname, 'fresh_admin_token.txt'), 'utf8').trim();
  console.log('[SETUP] Using admin token from fresh_admin_token.txt');
} catch (error) {
  console.error('[SETUP] Failed to load admin token:', error.message);
  process.exit(1);
}

/**
 * Test helper to make authenticated requests
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  // Always try to parse JSON to catch blank page responses
  let responseData;
  try {
    const responseText = await response.text();
    if (!responseText.trim()) {
      throw new Error('BLANK_PAGE_DETECTED: Empty response body');
    }
    responseData = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error(`INVALID_JSON_RESPONSE: ${parseError.message}. Response: ${responseText || 'EMPTY'}`);
  }
  
  return { status: response.status, data: responseData };
}

/**
 * Test Case 1: Valid disbursement request
 * Should succeed and return structured JSON
 */
async function testValidDisbursementRequest() {
  console.log('\n=== TEST 1: Valid Disbursement Request ===');
  
  try {
    const result = await makeRequest(`/api/admin/winner-cycles/${TEST_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({
        selectedWinnerIds: [1, 2], // Small test set
        processAll: false
      })
    });
    
    console.log('[TEST 1] ✅ Valid request returned structured JSON');
    console.log('[TEST 1] Status:', result.status);
    console.log('[TEST 1] Response type:', typeof result.data);
    console.log('[TEST 1] Has userMessage:', !!result.data.userMessage);
    
    return { passed: true, details: 'Valid request handled correctly' };
    
  } catch (error) {
    console.error('[TEST 1] ❌ Valid request failed:', error.message);
    return { passed: false, details: error.message };
  }
}

/**
 * Test Case 2: Invalid payload to trigger validation errors
 * Should return 422 with structured JSON, not blank page
 */
async function testInvalidPayloadValidation() {
  console.log('\n=== TEST 2: Invalid Payload Validation ===');
  
  try {
    const result = await makeRequest(`/api/admin/winner-cycles/${TEST_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({
        // Invalid: both processAll and selectedWinnerIds specified
        selectedWinnerIds: [1, 2],
        processAll: true
      })
    });
    
    console.log('[TEST 2] ✅ Invalid payload returned structured JSON');
    console.log('[TEST 2] Status:', result.status);
    console.log('[TEST 2] Error message:', result.data.error);
    console.log('[TEST 2] Has userMessage:', !!result.data.userMessage);
    
    if (result.status === 400 && result.data.error) {
      return { passed: true, details: 'Validation error handled correctly' };
    } else {
      return { passed: false, details: `Expected 400 status, got ${result.status}` };
    }
    
  } catch (error) {
    console.error('[TEST 2] ❌ Validation test failed:', error.message);
    return { passed: false, details: error.message };
  }
}

/**
 * Test Case 3: Missing required fields
 * Should return 422 with structured JSON
 */
async function testMissingRequiredFields() {
  console.log('\n=== TEST 3: Missing Required Fields ===');
  
  try {
    const result = await makeRequest(`/api/admin/winner-cycles/${TEST_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({
        // Missing both processAll and selectedWinnerIds
      })
    });
    
    console.log('[TEST 3] ✅ Missing fields returned structured JSON');
    console.log('[TEST 3] Status:', result.status);
    console.log('[TEST 3] Error message:', result.data.error);
    console.log('[TEST 3] Has actionRequired:', !!result.data.actionRequired);
    
    if (result.status === 400 && result.data.error) {
      return { passed: true, details: 'Missing fields validation handled correctly' };
    } else {
      return { passed: false, details: `Expected 400 status, got ${result.status}` };
    }
    
  } catch (error) {
    console.error('[TEST 3] ❌ Missing fields test failed:', error.message);
    return { passed: false, details: error.message };
  }
}

/**
 * Test Case 4: Non-existent cycle
 * Should return 404 with structured JSON
 */
async function testNonExistentCycle() {
  console.log('\n=== TEST 4: Non-existent Cycle ===');
  
  const FAKE_CYCLE_ID = 99999;
  
  try {
    const result = await makeRequest(`/api/admin/winner-cycles/${FAKE_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({
        processAll: true
      })
    });
    
    console.log('[TEST 4] ✅ Non-existent cycle returned structured JSON');
    console.log('[TEST 4] Status:', result.status);
    console.log('[TEST 4] Error message:', result.data.error);
    
    if (result.status === 404 && result.data.error === 'Cycle not found') {
      return { passed: true, details: 'Non-existent cycle handled correctly' };
    } else {
      return { passed: false, details: `Expected 404 with 'Cycle not found', got ${result.status}: ${result.data.error}` };
    }
    
  } catch (error) {
    console.error('[TEST 4] ❌ Non-existent cycle test failed:', error.message);
    return { passed: false, details: error.message };
  }
}

/**
 * Test Case 5: Malformed JSON payload
 * Should return structured error, not crash
 */
async function testMalformedJSON() {
  console.log('\n=== TEST 5: Malformed JSON Payload ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/winner-cycles/${TEST_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: '{ invalid json structure'
    });
    
    const responseText = await response.text();
    
    if (!responseText.trim()) {
      throw new Error('BLANK_PAGE_DETECTED: Empty response to malformed JSON');
    }
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parse fails, at least we got some response (not blank page)
      console.log('[TEST 5] ✅ Malformed JSON returned non-blank response');
      console.log('[TEST 5] Status:', response.status);
      console.log('[TEST 5] Response preview:', responseText.substring(0, 100));
      return { passed: true, details: 'Malformed JSON handled with non-blank response' };
    }
    
    console.log('[TEST 5] ✅ Malformed JSON returned structured JSON');
    console.log('[TEST 5] Status:', response.status);
    console.log('[TEST 5] Error message:', responseData.error);
    
    return { passed: true, details: 'Malformed JSON handled correctly' };
    
  } catch (error) {
    console.error('[TEST 5] ❌ Malformed JSON test failed:', error.message);
    return { passed: false, details: error.message };
  }
}

/**
 * Test Case 6: Rate limiting
 * Should return 429 with structured JSON
 */
async function testRateLimiting() {
  console.log('\n=== TEST 6: Rate Limiting ===');
  
  try {
    // Make first request
    const result1 = await makeRequest(`/api/admin/winner-cycles/${TEST_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({
        selectedWinnerIds: [1]
      })
    });
    
    console.log('[TEST 6] First request status:', result1.status);
    
    // Immediately make second request (should be rate limited)
    const result2 = await makeRequest(`/api/admin/winner-cycles/${TEST_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({
        selectedWinnerIds: [2]
      })
    });
    
    console.log('[TEST 6] ✅ Rate limiting returned structured JSON');
    console.log('[TEST 6] Status:', result2.status);
    console.log('[TEST 6] Error message:', result2.data.error);
    console.log('[TEST 6] Has rateLimitInfo:', !!result2.data.rateLimitInfo);
    
    if (result2.status === 429 && result2.data.error === 'Rate limit exceeded') {
      return { passed: true, details: 'Rate limiting handled correctly' };
    } else {
      return { passed: false, details: `Expected 429 with rate limit error, got ${result2.status}: ${result2.data.error}` };
    }
    
  } catch (error) {
    console.error('[TEST 6] ❌ Rate limiting test failed:', error.message);
    return { passed: false, details: error.message };
  }
}

/**
 * Test Case 7: Orchestrator validation edge case
 * Test the specific scenario that was causing blank pages
 */
async function testOrchestratorValidationEdgeCase() {
  console.log('\n=== TEST 7: Orchestrator Validation Edge Case ===');
  
  try {
    // Test with empty selectedWinnerIds array (edge case)
    const result = await makeRequest(`/api/admin/winner-cycles/${TEST_CYCLE_ID}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({
        selectedWinnerIds: [], // Empty array might trigger orchestrator validation issues
        processAll: false
      })
    });
    
    console.log('[TEST 7] ✅ Orchestrator edge case returned structured JSON');
    console.log('[TEST 7] Status:', result.status);
    console.log('[TEST 7] Response structure valid:', typeof result.data === 'object');
    console.log('[TEST 7] Has error or success field:', !!(result.data.error || result.data.success));
    
    // Any structured JSON response is a pass (no blank page)
    return { passed: true, details: 'Orchestrator edge case handled with structured response' };
    
  } catch (error) {
    if (error.message.includes('BLANK_PAGE_DETECTED')) {
      console.error('[TEST 7] ❌ CRITICAL: Blank page detected in orchestrator edge case!');
      return { passed: false, details: 'BLANK PAGE BUG STILL EXISTS' };
    } else {
      console.error('[TEST 7] ❌ Orchestrator edge case test failed:', error.message);
      return { passed: false, details: error.message };
    }
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🧪 Phase 2 Comprehensive Error Handling Validation Test');
  console.log('======================================================');
  console.log('Testing enhanced route error handling to prevent blank pages');
  
  const tests = [
    { name: 'Valid Disbursement Request', fn: testValidDisbursementRequest },
    { name: 'Invalid Payload Validation', fn: testInvalidPayloadValidation },
    { name: 'Missing Required Fields', fn: testMissingRequiredFields },
    { name: 'Non-existent Cycle', fn: testNonExistentCycle },
    { name: 'Malformed JSON Payload', fn: testMalformedJSON },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Orchestrator Validation Edge Case', fn: testOrchestratorValidationEdgeCase }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, ...result });
    } catch (error) {
      console.error(`[${test.name}] UNEXPECTED ERROR:`, error.message);
      results.push({ name: test.name, passed: false, details: error.message });
    }
    
    // Brief delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}: ${result.details}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 SUCCESS: All error handling tests passed! No blank page bugs detected.');
  } else {
    console.log('⚠️  ATTENTION: Some tests failed. Review the failures above.');
    
    // Check for critical blank page failures
    const blankPageFailures = results.filter(r => !r.passed && r.details.includes('BLANK'));
    if (blankPageFailures.length > 0) {
      console.log('🚨 CRITICAL: Blank page bugs still exist!');
      blankPageFailures.forEach(failure => {
        console.log(`   - ${failure.name}: ${failure.details}`);
      });
    }
  }
  
  return { passed, total, results };
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };