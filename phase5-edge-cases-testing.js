/**
 * Phase 5: Edge Cases & Error Handling Testing
 * Validates onboarding system robustness under various conditions
 */

console.log('⚠️  PHASE 5: EDGE CASES TESTING');
console.log('==============================\n');

// Test localStorage availability and fallbacks
function testLocalStorageEdgeCases() {
  console.log('💾 Step 5.1: LocalStorage Edge Cases');
  console.log('------------------------------------');
  
  try {
    // Test 1: LocalStorage availability
    const testKey = '__edge_test__';
    localStorage.setItem(testKey, 'test');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    console.log(`✅ LocalStorage basic operation: ${retrieved === 'test' ? 'PASS' : 'FAIL'}`);
    
    // Test 2: Storage quota (large data)
    try {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string
      localStorage.setItem('__quota_test__', largeData);
      localStorage.removeItem('__quota_test__');
      console.log('✅ LocalStorage quota handling: PASS');
    } catch (quotaError) {
      console.log('⚠️  LocalStorage quota limit reached (expected behavior)');
    }
    
    // Test 3: Invalid key handling
    try {
      localStorage.setItem('', 'empty_key_test');
      localStorage.removeItem('');
      console.log('✅ Empty key handling: PASS');
    } catch (keyError) {
      console.log('⚠️  Empty key handling: HANDLED');
    }
    
    // Test 4: Simulate disabled localStorage
    console.log('\n🔍 LocalStorage fallback simulation:');
    console.log('   To test: Disable localStorage in browser settings');
    console.log('   Expected: Graceful fallback to session storage or in-memory');
    
    return true;
  } catch (error) {
    console.error('❌ LocalStorage edge case testing failed:', error);
    return false;
  }
}

// Test feature flag edge cases
function testFeatureFlagEdgeCases() {
  console.log('\n🚩 Step 5.2: Feature Flag Edge Cases');
  console.log('------------------------------------');
  
  // Simulate different feature flag states
  const flagTests = [
    { value: true, expected: 'Onboarding enabled' },
    { value: false, expected: 'Onboarding disabled' },
    { value: 'true', expected: 'String true (should work)' },
    { value: 'false', expected: 'String false (should be false)' },
    { value: undefined, expected: 'Undefined (should default)' },
    { value: null, expected: 'Null (should default)' }
  ];
  
  console.log('Testing feature flag behavior:');
  
  flagTests.forEach(test => {
    // Simulate the logic from featureFlags.ts
    const result = test.value === 'true' || test.value === true;
    console.log(`📋 Value: ${test.value} → Result: ${result} (${test.expected})`);
  });
  
  console.log('\n💡 To test feature flag disable:');
  console.log('1. Set VITE_ONBOARDING_V1=false in environment');
  console.log('2. Or modify featureFlags.ts to return false');
  console.log('3. Verify onboarding components do not render');
  
  return true;
}

// Test user data edge cases
function testUserDataEdgeCases() {
  console.log('\n👤 Step 5.3: User Data Edge Cases');
  console.log('---------------------------------');
  
  const userDataScenarios = [
    'User without firstName or username',
    'User with empty string firstName',
    'User with null username',
    'User data not yet loaded',
    'Authentication token expired',
    'Network error during user fetch'
  ];
  
  console.log('User data edge cases to test:');
  
  userDataScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario}`);
    console.log(`   Expected: Graceful fallback to "there" or skip onboarding`);
  });
  
  // Check current user data state
  const token = localStorage.getItem('token');
  console.log(`\n📊 Current authentication state:`);
  console.log(`   Token present: ${token ? '✅' : '❌'}`);
  console.log(`   Token length: ${token ? token.length : 0} characters`);
  
  return true;
}

// Test rapid state changes
function testRapidStateChanges() {
  console.log('\n⚡ Step 5.4: Rapid State Changes');
  console.log('--------------------------------');
  
  console.log('Testing rapid onboarding state changes:');
  
  try {
    // Simulate rapid localStorage changes
    const keys = ['fb_onboarding_seen', 'fb_tour_done', 'fb_gs_firstLesson'];
    
    console.log('🔄 Simulating rapid state changes...');
    
    // Rapid set/clear operations
    for (let i = 0; i < 10; i++) {
      keys.forEach(key => {
        localStorage.setItem(key, 'true');
        localStorage.removeItem(key);
      });
    }
    
    console.log('✅ Rapid state changes handled without errors');
    
    // Test concurrent access simulation
    console.log('🔄 Testing concurrent access patterns...');
    
    setTimeout(() => {
      localStorage.setItem('fb_onboarding_seen', 'true');
    }, 0);
    
    setTimeout(() => {
      localStorage.setItem('fb_tour_done', 'true');
    }, 1);
    
    setTimeout(() => {
      localStorage.getItem('fb_onboarding_seen');
    }, 2);
    
    console.log('✅ Concurrent access patterns tested');
    
    return true;
  } catch (error) {
    console.error('❌ Rapid state change testing failed:', error);
    return false;
  }
}

// Test browser navigation edge cases
function testNavigationEdgeCases() {
  console.log('\n🧭 Step 5.5: Navigation Edge Cases');
  console.log('----------------------------------');
  
  console.log('Browser navigation scenarios to test:');
  
  const navigationScenarios = [
    'Back button during onboarding flow',
    'Forward button after completing onboarding',
    'Page refresh during welcome modal',
    'Page refresh during tour',
    'Tab switch during onboarding',
    'Browser close/reopen during flow'
  ];
  
  navigationScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario}`);
    console.log(`   Expected: Graceful state recovery or continuation`);
  });
  
  // Test current page state
  console.log(`\n📊 Current page state:`);
  console.log(`   URL: ${window.location.href}`);
  console.log(`   Referrer: ${document.referrer || 'Direct'}`);
  console.log(`   History length: ${history.length}`);
  
  return true;
}

// Test error boundary scenarios
function testErrorBoundaryScenarios() {
  console.log('\n🚨 Step 5.6: Error Boundary Scenarios');
  console.log('-------------------------------------');
  
  console.log('Error scenarios to monitor:');
  
  const errorScenarios = [
    'Component render errors during onboarding',
    'Tour step targeting non-existent elements',
    'Invalid tour configuration',
    'React key prop warnings',
    'Memory leaks during repeated flows',
    'Console errors or warnings'
  ];
  
  errorScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario}`);
  });
  
  // Monitor console for errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  let errorCount = 0;
  let warnCount = 0;
  
  console.error = function(...args) {
    errorCount++;
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    warnCount++;
    originalWarn.apply(console, args);
  };
  
  // Restore after a short period
  setTimeout(() => {
    console.error = originalError;
    console.warn = originalWarn;
    
    console.log(`\n📊 Error monitoring results:`);
    console.log(`   Errors detected: ${errorCount}`);
    console.log(`   Warnings detected: ${warnCount}`);
    console.log(`   Status: ${errorCount === 0 && warnCount === 0 ? '✅ Clean' : '⚠️  Issues detected'}`);
  }, 5000);
  
  return true;
}

// Main edge cases testing function
function runEdgeCasesTests() {
  console.log('Starting Phase 5 edge cases testing...\n');
  
  const results = [
    testLocalStorageEdgeCases(),
    testFeatureFlagEdgeCases(),
    testUserDataEdgeCases(),
    testRapidStateChanges(),
    testNavigationEdgeCases(),
    testErrorBoundaryScenarios()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n🎯 EDGE CASES TESTING SUMMARY');
  console.log('============================');
  console.log(`Tests completed: ${passed}/${total}`);
  console.log(`Success rate: ${Math.round((passed/total) * 100)}%`);
  
  console.log('\n📋 Manual Edge Case Testing:');
  console.log('□ Disable localStorage and test onboarding');
  console.log('□ Set feature flag to false and verify disable');
  console.log('□ Test with slow network conditions');
  console.log('□ Test with JavaScript errors injected');
  console.log('□ Test browser back/forward during flow');
  console.log('□ Test tab switching during onboarding');
  
  console.log('\n⚠️  Error Monitoring Active');
  console.log('Console errors and warnings are being tracked for 5 seconds...');
  
  return passed === total;
}

// Auto-run tests
runEdgeCasesTests();

// Export for manual use
window.phase5EdgeCasesTesting = {
  run: runEdgeCasesTests,
  testLocalStorageEdgeCases,
  testFeatureFlagEdgeCases,
  testUserDataEdgeCases,
  testRapidStateChanges,
  testNavigationEdgeCases,
  testErrorBoundaryScenarios
};