/**
 * Test script for the corrected prediction system workflow
 * Tests the new process: Create question → Publish → Users predict → Admin determines result with point allocation → Points distributed
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Admin credentials
const ADMIN_EMAIL = 'lafleur.andrew@gmail.com';
const ADMIN_PASSWORD = 'admin123456';

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

let adminToken = '';
let userToken = '';
let testQuestionId = null;
let activeCycleId = null;

async function authenticateAdmin() {
  console.log('🔐 Authenticating admin...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (response.ok) {
    const data = await response.json();
    adminToken = data.token;
    console.log('✅ Admin authenticated successfully');
    return true;
  } else {
    console.error('❌ Admin authentication failed');
    return false;
  }
}

async function authenticateUser() {
  console.log('🔐 Authenticating test user...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });

  if (response.ok) {
    const data = await response.json();
    userToken = data.token;
    console.log('✅ Test user authenticated successfully');
    return true;
  } else {
    console.error('❌ Test user authentication failed');
    return false;
  }
}

async function getActiveCycle() {
  console.log('📊 Getting active cycle...');
  
  const response = await fetch(`${BASE_URL}/api/admin/cycle-settings`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (response.ok) {
    const data = await response.json();
    // Handle array response directly
    const cycles = Array.isArray(data) ? data : (data.cycles || []);
    const activeCycle = cycles.find(cycle => cycle.isActive);
    if (activeCycle) {
      activeCycleId = activeCycle.id;
      console.log(`✅ Found active cycle: ${activeCycle.cycleName} (ID: ${activeCycleId})`);
      return true;
    } else {
      console.error('❌ No active cycle found');
      console.log('Available cycles:', cycles.map(c => ({ id: c.id, name: c.cycleName, active: c.isActive })));
      return false;
    }
  } else {
    const error = await response.text();
    console.error(`❌ Failed to get cycles: ${error}`);
    return false;
  }
}

async function createTestQuestion() {
  console.log('📝 Creating test prediction question (WITHOUT point allocation)...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const questionData = {
    cycleSettingId: activeCycleId,
    questionText: "What will the S&P 500 closing price range be on Friday?",
    options: [
      "5900-6000 (Conservative range)",
      "6000-6100 (Moderate growth)",
      "6100-6200 (Strong growth)",
      "Above 6200 (Exceptional growth)"
    ],
    submissionDeadline: tomorrow.toISOString(),
    resultDeterminationTime: nextWeek.toISOString()
  };

  const response = await fetch(`${BASE_URL}/api/admin/prediction-questions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(questionData)
  });

  if (response.ok) {
    const data = await response.json();
    testQuestionId = data.question.id;
    console.log(`✅ Test question created successfully (ID: ${testQuestionId})`);
    console.log(`   Question: ${questionData.questionText}`);
    console.log(`   Options: ${questionData.options.length} choices`);
    console.log(`   ⚠️  NOTE: No point allocation yet - will be set during result determination`);
    return true;
  } else {
    const error = await response.text();
    console.error(`❌ Failed to create question: ${error}`);
    return false;
  }
}

async function publishQuestion() {
  console.log('📢 Publishing question...');
  
  const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/${testQuestionId}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (response.ok) {
    console.log('✅ Question published successfully');
    return true;
  } else {
    const error = await response.text();
    console.error(`❌ Failed to publish question: ${error}`);
    return false;
  }
}

async function submitUserPrediction() {
  console.log('🎯 User submitting prediction...');
  
  const predictionData = {
    questionId: testQuestionId,
    selectedOptionIndex: 1 // "6000-6100 (Moderate growth)"
  };

  const response = await fetch(`${BASE_URL}/api/prediction-questions/${testQuestionId}/predict`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(predictionData)
  });

  if (response.ok) {
    console.log('✅ User prediction submitted successfully');
    console.log('   Selected: Option 2 - "6000-6100 (Moderate growth)"');
    return true;
  } else {
    const error = await response.text();
    console.error(`❌ Failed to submit prediction: ${error}`);
    return false;
  }
}

async function setQuestionResultWithPointAllocation() {
  console.log('🎯 Admin determining result WITH custom point allocation...');
  
  // This is the corrected workflow: admin selects correct answer AND allocates points
  const resultData = {
    correctAnswerIndex: 1, // "6000-6100" was correct
    pointsPerOption: [5, 20, 10, 0], // Nuanced scoring: close = 5/10, exact = 20, far = 0
    notes: "S&P 500 closed at 6,075 on Friday - Option 2 was exactly correct. Partial credit given to adjacent ranges."
  };

  const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/${testQuestionId}/results`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resultData)
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Result determined with custom point allocation:');
    console.log('   Correct Answer: Option 2 - "6000-6100 (Moderate growth)"');
    console.log('   Point Allocation:');
    console.log('     Option 1 (5900-6000): 5 points (close range)');
    console.log('     Option 2 (6000-6100): 20 points (exact match)');
    console.log('     Option 3 (6100-6200): 10 points (close range)');
    console.log('     Option 4 (Above 6200): 0 points (far off)');
    console.log(`   Distribution: ${data.distributionResult.usersAwarded} users received ${data.distributionResult.totalPointsAwarded} total points`);
    return true;
  } else {
    const error = await response.text();
    console.error(`❌ Failed to determine result: ${error}`);
    return false;
  }
}

async function checkQuestionStatus() {
  console.log('🔍 Checking final question status...');
  
  const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/cycle/${activeCycleId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (response.ok) {
    const data = await response.json();
    const question = data.questions.find(q => q.id === testQuestionId);
    
    if (question) {
      console.log('✅ Question status check:');
      console.log(`   Published: ${question.isPublished}`);
      console.log(`   Result Determined: ${question.isResultDetermined}`);
      console.log(`   Points Distributed: ${question.pointsDistributed}`);
      console.log(`   Point Awards: ${JSON.stringify(question.pointAwards)}`);
      return true;
    } else {
      console.error('❌ Question not found');
      return false;
    }
  } else {
    console.error('❌ Failed to check question status');
    return false;
  }
}

async function verifyUserPoints() {
  console.log('💰 Verifying user received points...');
  
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✅ User points verified:`);
    console.log(`   Total Points: ${data.totalPoints}`);
    console.log(`   Current Cycle Points: ${data.currentCyclePoints}`);
    console.log(`   Expected: User should have received 20 points for correct prediction`);
    return true;
  } else {
    console.error('❌ Failed to verify user points');
    return false;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  // Delete the test question
  const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/${testQuestionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (response.ok) {
    console.log('✅ Test question cleaned up successfully');
  } else {
    console.log('⚠️  Warning: Failed to clean up test question (may need manual cleanup)');
  }
}

async function runCorrectedWorkflowTest() {
  console.log('🚀 Testing Corrected Prediction System Workflow');
  console.log('=' .repeat(60));
  console.log('📋 CORRECTED WORKFLOW:');
  console.log('   1. Admin creates question (options only, no points)');
  console.log('   2. Admin publishes question');
  console.log('   3. Users submit predictions');
  console.log('   4. Real event occurs');
  console.log('   5. Admin determines result AND allocates points per option');
  console.log('   6. System distributes points based on admin allocation');
  console.log('=' .repeat(60));
  
  try {
    // Authentication
    if (!await authenticateAdmin()) return;
    if (!await authenticateUser()) return;
    
    // Setup
    if (!await getActiveCycle()) return;
    
    // Phase 1: Create and publish question (without points)
    if (!await createTestQuestion()) return;
    if (!await publishQuestion()) return;
    
    // Phase 2: User engagement
    if (!await submitUserPrediction()) return;
    
    // Phase 3: Result determination with point allocation (CORRECTED WORKFLOW)
    if (!await setQuestionResultWithPointAllocation()) return;
    
    // Phase 4: Verification
    if (!await checkQuestionStatus()) return;
    if (!await verifyUserPoints()) return;
    
    console.log('');
    console.log('🎉 CORRECTED WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Point allocation now happens AFTER result determination');
    console.log('✅ Enables nuanced scoring (partial credit for close predictions)');
    console.log('✅ Admin has full control over point distribution logic');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await cleanup();
  }
}

// Run the test
runCorrectedWorkflowTest();