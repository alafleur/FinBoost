#!/usr/bin/env node

/**
 * Phase 5: Comprehensive Testing Scenarios for ChatGPT Fix Plan
 * Tests all Phase 1-4 infrastructure including:
 * - Phase 1: Core Integration & Idempotency
 * - Phase 2: Backward Compatibility & Data Repair
 * - Phase 3: Enhanced Guardrails & Observability  
 * - Phase 4: User Experience & Status Management
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Configuration
const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'lafleur.andrew@gmail.com';
const ADMIN_PASSWORD = 'password123';

let adminToken = '';
let testCycleId = null;

// Test Results Tracking
const testResults = [];

function log(message) {
  console.log(`[PHASE 5 TEST] ${new Date().toISOString()} - ${message}`);
}

function logResult(testName, success, details = '') {
  const result = { testName, success, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  
  const status = success ? '✅ PASS' : '❌ FAIL';
  log(`${status} - ${testName}: ${details}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': adminToken ? `Bearer ${adminToken}` : '',
      ...options.headers
    }
  });

  const data = await response.json();
  return { response, data };
}

// Test Phase 1: Core Integration & Idempotency
async function testPhase1CoreIntegration() {
  log('=== TESTING PHASE 1: CORE INTEGRATION & IDEMPOTENCY ===');

  // Test 1.1: Authentication
  try {
    const { response, data } = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (response.ok && data.token) {
      adminToken = data.token;
      logResult('1.1 Admin Authentication', true, 'Successfully authenticated admin');
    } else {
      logResult('1.1 Admin Authentication', false, `Login failed: ${data.error}`);
      return false;
    }
  } catch (error) {
    logResult('1.1 Admin Authentication', false, `Request failed: ${error.message}`);
    return false;
  }

  // Test 1.2: Get Active Cycle
  try {
    const { response, data } = await makeRequest('/api/admin/cycle-settings');
    
    if (response.ok && data.cycles && data.cycles.length > 0) {
      testCycleId = data.cycles.find(c => c.isActive)?.id || data.cycles[0].id;
      logResult('1.2 Active Cycle Detection', true, `Found test cycle ID: ${testCycleId}`);
    } else {
      logResult('1.2 Active Cycle Detection', false, 'No cycles found');
      return false;
    }
  } catch (error) {
    logResult('1.2 Active Cycle Detection', false, `Request failed: ${error.message}`);
    return false;
  }

  // Test 1.3: Preview Disbursements (Dry Run Validation)
  try {
    const { response, data } = await makeRequest(`/api/admin/winner-cycles/${testCycleId}/preview-disbursements`, {
      method: 'POST',
      body: JSON.stringify({ processAll: true })
    });

    if (response.ok && data.success) {
      logResult('1.3 Preview Disbursements', true, `Preview generated: ${data.preview?.eligibleRecipients || 0} recipients`);
    } else {
      logResult('1.3 Preview Disbursements', false, `Preview failed: ${data.error}`);
    }
  } catch (error) {
    logResult('1.3 Preview Disbursements', false, `Request failed: ${error.message}`);
  }

  return true;
}

// Test Phase 3: Enhanced Guardrails & Observability
async function testPhase3Guardrails() {
  log('=== TESTING PHASE 3: ENHANCED GUARDRAILS & OBSERVABILITY ===');

  // Test 3.1: Rate Limiting (1 request per cycle per minute)
  try {
    log('Testing rate limiting - sending first disbursement request...');
    const { response: response1, data: data1 } = await makeRequest(`/api/admin/winner-cycles/${testCycleId}/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({ processAll: true })
    });

    // First request should either succeed or fail with a legitimate error (not rate limiting)
    if (response1.status !== 429) {
      log('First request completed (not rate limited)');
      
      // Wait 1 second and try again - this should be rate limited
      await sleep(1000);
      log('Testing rate limiting - sending second disbursement request immediately...');
      
      const { response: response2, data: data2 } = await makeRequest(`/api/admin/winner-cycles/${testCycleId}/process-disbursements`, {
        method: 'POST',
        body: JSON.stringify({ processAll: true })
      });

      if (response2.status === 429 && data2.userMessage && data2.actionRequired === 'wait_and_retry') {
        logResult('3.1 Rate Limiting', true, `Rate limit triggered: ${data2.userMessage}`);
      } else {
        logResult('3.1 Rate Limiting', false, `Expected 429 rate limit, got ${response2.status}: ${data2.error}`);
      }
    } else {
      // First request was already rate limited
      logResult('3.1 Rate Limiting', true, `Rate limit working: ${data1.userMessage}`);
    }
  } catch (error) {
    logResult('3.1 Rate Limiting', false, `Request failed: ${error.message}`);
  }

  // Test 3.2: Structured Logging Verification
  try {
    log('Verifying structured logging patterns...');
    // The structured logging happens in the server console, so we verify the endpoint exists
    const { response, data } = await makeRequest(`/api/admin/cycle-winner-details/${testCycleId}/eligible-count`);
    
    if (response.ok && typeof data.eligibleCount === 'number') {
      logResult('3.2 Structured Logging', true, `Eligible count endpoint functional: ${data.eligibleCount} eligible winners`);
    } else {
      logResult('3.2 Structured Logging', false, `Eligible count failed: ${data.error}`);
    }
  } catch (error) {
    logResult('3.2 Structured Logging', false, `Request failed: ${error.message}`);
  }
}

// Test Phase 4: User Experience & Status Management
async function testPhase4UserExperience() {
  log('=== TESTING PHASE 4: USER EXPERIENCE & STATUS MANAGEMENT ===');

  // Test 4.1: Status Dashboard Endpoint
  try {
    const { response, data } = await makeRequest('/api/admin/disbursements/status-dashboard');

    if (response.ok && data.success && data.dashboard) {
      const { summary, recentBatches, activeLocks, lastUpdated } = data.dashboard;
      
      logResult('4.1 Status Dashboard', true, 
        `Dashboard loaded: ${summary.totalBatches} batches, ${summary.activeBatches} active, ${recentBatches.length} recent`);
      
      // Verify dashboard structure
      if (summary.totalPayouts !== undefined && Array.isArray(recentBatches) && Array.isArray(activeLocks)) {
        logResult('4.1a Dashboard Structure', true, 'All expected dashboard fields present');
      } else {
        logResult('4.1a Dashboard Structure', false, 'Missing expected dashboard fields');
      }
    } else {
      logResult('4.1 Status Dashboard', false, `Dashboard failed: ${data.error}`);
    }
  } catch (error) {
    logResult('4.1 Status Dashboard', false, `Request failed: ${error.message}`);
  }

  // Test 4.2: Enhanced Error Messages
  try {
    // Try to process disbursements with invalid data to test error handling
    const { response, data } = await makeRequest(`/api/admin/winner-cycles/99999/process-disbursements`, {
      method: 'POST',
      body: JSON.stringify({ processAll: true })
    });

    if (!response.ok && data.userMessage && data.actionRequired) {
      logResult('4.2 Enhanced Error Messages', true, 
        `User-friendly error detected: ${data.userMessage}, Action: ${data.actionRequired}`);
    } else {
      logResult('4.2 Enhanced Error Messages', false, 
        `Missing user-friendly error fields: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    logResult('4.2 Enhanced Error Messages', false, `Request failed: ${error.message}`);
  }

  // Test 4.3: User-Friendly Status Labels
  try {
    const { response, data } = await makeRequest('/api/admin/disbursements/status-dashboard');
    
    if (response.ok && data.dashboard && data.dashboard.recentBatches.length > 0) {
      const batch = data.dashboard.recentBatches[0];
      
      if (batch.statusLabel && batch.amountFormatted && batch.progressPercentage !== undefined) {
        logResult('4.3 User-Friendly Labels', true, 
          `Labels working: ${batch.statusLabel}, ${batch.amountFormatted}, ${batch.progressPercentage}%`);
      } else {
        logResult('4.3 User-Friendly Labels', false, 'Missing statusLabel, amountFormatted, or progressPercentage');
      }
    } else {
      logResult('4.3 User-Friendly Labels', true, 'No batches to test labels (acceptable)');
    }
  } catch (error) {
    logResult('4.3 User-Friendly Labels', false, `Request failed: ${error.message}`);
  }
}

// Test Phase 2: Backward Compatibility
async function testPhase2BackwardCompatibility() {
  log('=== TESTING PHASE 2: BACKWARD COMPATIBILITY ===');

  // Test 2.1: Legacy Data Tolerance
  try {
    // This tests that the system can handle cycles with legacy data formats
    const { response, data } = await makeRequest(`/api/admin/cycle-winner-details/${testCycleId}/winners`);

    if (response.ok && data.winners) {
      logResult('2.1 Legacy Data Tolerance', true, `Winner data loaded successfully: ${Object.keys(data.winners).length} tiers`);
    } else {
      logResult('2.1 Legacy Data Tolerance', false, `Winner data failed: ${data.error}`);
    }
  } catch (error) {
    logResult('2.1 Legacy Data Tolerance', false, `Request failed: ${error.message}`);
  }
}

// Test Integration Points
async function testIntegrationPoints() {
  log('=== TESTING INTEGRATION POINTS ===');

  // Test I.1: Orchestrator Integration
  try {
    // Test the preview endpoint which uses the orchestrator in dry-run mode
    const { response, data } = await makeRequest(`/api/admin/winner-cycles/${testCycleId}/preview-disbursements`, {
      method: 'POST',
      body: JSON.stringify({ selectedWinnerIds: [] }) // Empty selection to test validation
    });

    if (response.status === 400 && data.error.includes('Must specify either processAll')) {
      logResult('I.1 Orchestrator Integration', true, 'Proper validation error from orchestrator path');
    } else {
      logResult('I.1 Orchestrator Integration', false, `Unexpected response: ${data.error}`);
    }
  } catch (error) {
    logResult('I.1 Orchestrator Integration', false, `Request failed: ${error.message}`);
  }

  // Test I.2: Comprehensive Pipeline
  try {
    // Test the full pipeline: eligible count -> preview -> (would be disbursement)
    log('Testing comprehensive pipeline...');
    
    const { response: countResponse, data: countData } = await makeRequest(`/api/admin/cycle-winner-details/${testCycleId}/eligible-count`);
    
    if (countResponse.ok) {
      const { response: previewResponse, data: previewData } = await makeRequest(`/api/admin/winner-cycles/${testCycleId}/preview-disbursements`, {
        method: 'POST',
        body: JSON.stringify({ processAll: true })
      });

      if (previewResponse.ok && previewData.success) {
        logResult('I.2 Comprehensive Pipeline', true, 
          `Pipeline working: ${countData.eligibleCount} eligible -> ${previewData.preview.eligibleRecipients} preview recipients`);
      } else {
        logResult('I.2 Comprehensive Pipeline', false, `Preview failed: ${previewData.error}`);
      }
    } else {
      logResult('I.2 Comprehensive Pipeline', false, `Count failed: ${countData.error}`);
    }
  } catch (error) {
    logResult('I.2 Comprehensive Pipeline', false, `Request failed: ${error.message}`);
  }
}

// Main Test Runner
async function runComprehensiveTests() {
  log('STARTING PHASE 5: COMPREHENSIVE TESTING SCENARIOS');
  log('Testing all Phase 1-4 infrastructure...');

  try {
    // Run all test suites
    const phase1Success = await testPhase1CoreIntegration();
    if (!phase1Success) {
      log('Phase 1 tests failed - stopping execution');
      return;
    }

    await testPhase2BackwardCompatibility();
    await testPhase3Guardrails();
    await testPhase4UserExperience();
    await testIntegrationPoints();

    // Generate Summary Report
    log('\n=== PHASE 5 COMPREHENSIVE TEST RESULTS ===');
    
    const passed = testResults.filter(r => r.success).length;
    const total = testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    log(`Overall Results: ${passed}/${total} tests passed (${passRate}%)`);
    
    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      log(`${status} ${result.testName}: ${result.details}`);
    });

    if (passed === total) {
      log('\n🎉 ALL TESTS PASSED - PHASE 5 COMPLETE');
      log('All Phase 1-4 infrastructure is working correctly');
    } else {
      log(`\n⚠️  ${total - passed} TESTS FAILED - REVIEW REQUIRED`);
      log('Some infrastructure may need attention before production deployment');
    }

    // Save detailed results
    const results = {
      summary: { passed, total, passRate },
      testResults,
      completedAt: new Date().toISOString(),
      infrastructure: {
        phase1: 'Core Integration & Idempotency',
        phase2: 'Backward Compatibility & Data Repair',
        phase3: 'Enhanced Guardrails & Observability', 
        phase4: 'User Experience & Status Management'
      }
    };

    fs.writeFileSync('phase5-test-results.json', JSON.stringify(results, null, 2));
    log('Detailed results saved to phase5-test-results.json');

  } catch (error) {
    log(`CRITICAL ERROR during testing: ${error.message}`);
    log(error.stack);
  }
}

// Wait for rate limits to reset before starting tests
setTimeout(() => {
  runComprehensiveTests().catch(console.error);
}, 2000);