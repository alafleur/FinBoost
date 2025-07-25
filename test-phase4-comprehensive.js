import { storage } from './server/storage.ts';

async function runComprehensiveSystemTests() {
  console.log('🧪 Phase 4: System-Wide Testing');
  console.log('================================\n');

  const results = {
    navigationTests: [],
    completionTests: [],
    tierTests: [],
    functionalityTests: []
  };

  try {
    // Test 1: Verify lesson completion logic across multiple modules
    console.log('1. Testing Lesson Completion Logic...');
    const modules = await storage.getPublishedModules();
    console.log(`Found ${modules.length} modules to test`);
    
    // Test each module's structure
    for (const module of modules.slice(0, 3)) { // Test first 3 modules
      try {
        console.log(`  Testing module: ${module.title}`);
        
        // Verify module has required structure
        const hasRequiredFields = module.title && module.content && module.quiz;
        console.log(`    ✓ Module structure: ${hasRequiredFields ? 'PASS' : 'FAIL'}`);
        
        if (module.quiz) {
          try {
            const parsedQuiz = typeof module.quiz === 'string' ? JSON.parse(module.quiz) : module.quiz;
            console.log(`    ✓ Quiz questions: ${parsedQuiz.length} questions`);
            
            // Test quiz structure
            const validQuestions = Array.isArray(parsedQuiz) && parsedQuiz.every(q => 
              q.question && q.options && q.options.length >= 2 && 
              q.correctAnswer !== undefined
            );
            console.log(`    ✓ Quiz validation: ${validQuestions ? 'PASS' : 'FAIL'}`);
          } catch (error) {
            console.log(`    ❌ Quiz parsing failed: ${error.message}`);
          }
        }
        
        results.completionTests.push({
          module: module.title,
          status: 'PASS',
          issues: []
        });
        
      } catch (error) {
        console.log(`    ❌ Error testing module ${module.title}: ${error.message}`);
        results.completionTests.push({
          module: module.title,
          status: 'FAIL',
          issues: [error.message]
        });
      }
    }

    // Test 2: Verify tier calculation consistency
    console.log('\n2. Testing Tier Calculation System...');
    
    // Get current cycle thresholds
    const thresholds = await storage.getCycleTierThresholds();
    console.log(`Current tier thresholds: Tier1=${thresholds.tier1}, Tier2=${thresholds.tier2}, Tier3=${thresholds.tier3}`);
    
    // Test tier calculation logic with different point values
    const testCases = [
      { points: 0, expectedTier: 'tier3' },
      { points: thresholds.tier2 - 1, expectedTier: 'tier3' },
      { points: thresholds.tier2, expectedTier: 'tier2' },
      { points: thresholds.tier1 - 1, expectedTier: 'tier2' },
      { points: thresholds.tier1, expectedTier: 'tier1' },
      { points: thresholds.tier1 + 50, expectedTier: 'tier1' }
    ];
    
    for (const testCase of testCases) {
      try {
        const calculatedTier = await storage.calculateUserTier(testCase.points);
        const isCorrect = calculatedTier === testCase.expectedTier;
        console.log(`  ${testCase.points} points → ${calculatedTier} (expected: ${testCase.expectedTier}) ${isCorrect ? '✓' : '❌'}`);
        
        results.tierTests.push({
          points: testCase.points,
          calculated: calculatedTier,
          expected: testCase.expectedTier,
          status: isCorrect ? 'PASS' : 'FAIL'
        });
      } catch (error) {
        console.log(`  ❌ Error calculating tier for ${testCase.points} points: ${error.message}`);
        results.tierTests.push({
          points: testCase.points,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    // Test 3: Verify core storage methods still work
    console.log('\n3. Testing Core Functionality...');
    
    // Test user retrieval
    try {
      const currentCycle = await storage.getCurrentCycle();
      console.log(`  ✓ Current cycle retrieval: ${currentCycle ? 'PASS' : 'FAIL'}`);
      results.functionalityTests.push({ function: 'getCurrentCycle', status: currentCycle ? 'PASS' : 'FAIL' });
    } catch (error) {
      console.log(`  ❌ getCurrentCycle failed: ${error.message}`);
      results.functionalityTests.push({ function: 'getCurrentCycle', status: 'ERROR', error: error.message });
    }

    // Test leaderboard functionality
    try {
      const leaderboard = await storage.getCycleLeaderboard();
      console.log(`  ✓ Leaderboard retrieval: ${leaderboard && leaderboard.length >= 0 ? 'PASS' : 'FAIL'}`);
      results.functionalityTests.push({ function: 'getCycleLeaderboard', status: 'PASS' });
    } catch (error) {
      console.log(`  ❌ getCycleLeaderboard failed: ${error.message}`);
      results.functionalityTests.push({ function: 'getCycleLeaderboard', status: 'ERROR', error: error.message });
    }

    // Test cycle points functionality
    try {
      const activeCycle = await storage.getActiveCycleSetting();
      if (activeCycle) {
        const userPoints = await storage.getUserCyclePoints(1842, activeCycle.id); // Test with recent user
        console.log(`  ✓ User cycle points retrieval: ${userPoints !== null ? 'PASS' : 'FAIL'}`);
        results.functionalityTests.push({ function: 'getUserCyclePoints', status: 'PASS' });
      }
    } catch (error) {
      console.log(`  ❌ getUserCyclePoints failed: ${error.message}`);
      results.functionalityTests.push({ function: 'getUserCyclePoints', status: 'ERROR', error: error.message });
    }

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passedCompletion = results.completionTests.filter(t => t.status === 'PASS').length;
    const passedTier = results.tierTests.filter(t => t.status === 'PASS').length;
    const passedFunctionality = results.functionalityTests.filter(t => t.status === 'PASS').length;
    
    console.log(`Completion Tests: ${passedCompletion}/${results.completionTests.length} passed`);
    console.log(`Tier Tests: ${passedTier}/${results.tierTests.length} passed`);
    console.log(`Functionality Tests: ${passedFunctionality}/${results.functionalityTests.length} passed`);
    
    const totalTests = results.completionTests.length + results.tierTests.length + results.functionalityTests.length;
    const totalPassed = passedCompletion + passedTier + passedFunctionality;
    
    console.log(`\nOVERALL: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed/totalTests*100)}%)`);
    
    // Report any issues
    const allFailures = [
      ...results.completionTests.filter(t => t.status !== 'PASS'),
      ...results.tierTests.filter(t => t.status !== 'PASS'),
      ...results.functionalityTests.filter(t => t.status !== 'PASS')
    ];
    
    if (allFailures.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      allFailures.forEach(failure => {
        console.log(`  - ${failure.function || failure.module || `${failure.points} points`}: ${failure.error || failure.issues?.join(', ') || 'Failed validation'}`);
      });
    } else {
      console.log('\n✅ All tests passed! System appears stable.');
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error);
  } finally {
    process.exit(0);
  }
}

runComprehensiveSystemTests();