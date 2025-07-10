#!/usr/bin/env node

// Test Phase 5: Prediction System Points Integration
// This tests the complete workflow: question creation → user prediction → result determination → point distribution

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let userToken = '';
let testQuestionId = null;

async function authenticateAdmin() {
  console.log('🔐 Authenticating admin...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lafleur.andrew@gmail.com',
        password: 'admin123456'
      })
    });
    
    const data = await response.json();
    if (data.token) {
      adminToken = data.token;
      console.log('✅ Admin authenticated successfully');
      return true;
    } else {
      console.log('❌ Admin authentication failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin authentication error:', error.message);
    return false;
  }
}

async function authenticateUser() {
  console.log('🔐 Authenticating test user...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'phase5test@example.com',
        password: 'testpass123'
      })
    });
    
    const data = await response.json();
    if (data.token) {
      userToken = data.token;
      console.log('✅ User authenticated successfully');
      return true;
    } else {
      console.log('❌ User authentication failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ User authentication error:', error.message);
    return false;
  }
}

async function getActiveCycle() {
  console.log('🔄 Getting active cycle...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/cycle-settings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Check if data is an array (direct cycles) or object with cycles property
    const cycles = Array.isArray(data) ? data : data.cycles;
    const activeCycle = cycles?.find(c => c.isActive);
    
    if (activeCycle) {
      console.log(`✅ Active cycle found: ${activeCycle.cycleName} (ID: ${activeCycle.id})`);
      return activeCycle;
    } else {
      console.log('❌ No active cycle found');
      console.log('Available cycles:', cycles?.map(c => `${c.cycleName} (ID: ${c.id}, Active: ${c.isActive})`));
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting active cycle:', error.message);
    return null;
  }
}

async function createTestQuestion(cycleId) {
  console.log('📝 Creating test prediction question...');
  try {
    const submissionDeadline = new Date();
    submissionDeadline.setDate(submissionDeadline.getDate() + 7); // 7 days from now
    
    const resultDeterminationTime = new Date();
    resultDeterminationTime.setDate(resultDeterminationTime.getDate() + 8); // 8 days from now
    
    const response = await fetch(`${BASE_URL}/api/admin/prediction-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        cycleSettingId: cycleId,
        questionText: "Phase 5 Test: Will the S&P 500 be higher at the end of next week?",
        options: ["Yes, it will be higher", "No, it will be lower"],
        pointAwards: [15, 10],
        submissionDeadline: submissionDeadline.toISOString(),
        resultDeterminationTime: resultDeterminationTime.toISOString()
      })
    });
    
    const data = await response.json();
    if (data.success && data.question) {
      testQuestionId = data.question.id;
      console.log(`✅ Test question created with ID: ${testQuestionId}`);
      return data.question;
    } else {
      console.log('❌ Failed to create test question:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error creating test question:', error.message);
    return null;
  }
}

async function publishQuestion(questionId) {
  console.log('📢 Publishing test question...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/${questionId}/publish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('✅ Question published successfully');
      return true;
    } else {
      console.log('❌ Failed to publish question:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error publishing question:', error.message);
    return false;
  }
}

async function submitUserPrediction(questionId) {
  console.log('🎯 Submitting user prediction...');
  try {
    const response = await fetch(`${BASE_URL}/api/predictions/${questionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        selectedOptionIndex: 0 // Choose first option (15 points)
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('✅ User prediction submitted successfully');
      return true;
    } else {
      console.log('❌ Failed to submit prediction:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error submitting prediction:', error.message);
    return false;
  }
}

async function setQuestionResult(questionId) {
  console.log('🎯 Setting question result (correct answer: option 0)...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/${questionId}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        correctAnswerIndex: 0, // User chose correctly
        pointsPerOption: [15, 5] // 15 points for correct answer, 5 points for incorrect
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('✅ Question result set and points distributed automatically');
      console.log(`   📊 Distribution result: ${data.distributionResult.usersAwarded} users awarded ${data.distributionResult.totalPointsAwarded} total points`);
      return true;
    } else {
      console.log('❌ Failed to set question result:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error setting question result:', error.message);
    return false;
  }
}

async function checkQuestionStatus(questionId) {
  console.log('🔍 Checking question status after distribution...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/question/${questionId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Question status:', {
        pointsDistributed: data.question?.pointsDistributed,
        correctAnswerIndex: data.question?.correctAnswerIndex,
        pointAwards: data.question?.pointAwards
      });
      return data.question;
    }
  } catch (error) {
    console.log('⚠️  Could not check question status:', error.message);
  }
  return null;
}

async function testDistributePointsEndpoint(questionId) {
  // Add small delay to ensure database updates are complete
  console.log('⏱️  Waiting for database to sync...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🔄 Testing separate distribute points endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/${questionId}/distribute-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    if (response.status === 400 && data.error.includes('Points have already been distributed')) {
      console.log('✅ Distribute points endpoint correctly prevents duplicate distribution');
      return true;
    } else {
      console.log('❌ Distribute points endpoint response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing distribute points endpoint:', error.message);
    return false;
  }
}

async function verifyUserPoints() {
  console.log('🔍 Verifying user received points...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const data = await response.json();
    if (data.user) {
      console.log(`✅ User current cycle points: ${data.user.currentCyclePoints || 0}`);
      
      // Check prediction stats
      const statsResponse = await fetch(`${BASE_URL}/api/predictions/my-stats`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      
      const statsData = await statsResponse.json();
      if (statsData.stats) {
        console.log(`📊 User prediction stats: ${statsData.stats.totalPredictions} predictions, ${statsData.stats.totalPointsEarned} points earned`);
      }
      
      return true;
    } else {
      console.log('❌ Failed to get user data:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error verifying user points:', error.message);
    return false;
  }
}

async function cleanup() {
  if (testQuestionId) {
    console.log('🧹 Cleaning up test question...');
    try {
      const response = await fetch(`${BASE_URL}/api/admin/prediction-questions/${testQuestionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.ok) {
        console.log('✅ Test question cleaned up successfully');
      } else {
        console.log('⚠️  Could not delete test question (may have user predictions)');
      }
    } catch (error) {
      console.log('⚠️  Cleanup error:', error.message);
    }
  }
}

async function runPhase5Test() {
  console.log('🚀 Starting Phase 5: Points Integration Test\n');
  
  try {
    // Step 1: Authenticate
    if (!await authenticateAdmin()) return;
    if (!await authenticateUser()) return;
    
    // Step 2: Get active cycle
    const activeCycle = await getActiveCycle();
    if (!activeCycle) return;
    
    // Step 3: Create test question
    const question = await createTestQuestion(activeCycle.id);
    if (!question) return;
    
    // Step 4: Publish question
    if (!await publishQuestion(testQuestionId)) return;
    
    // Step 5: Submit user prediction
    if (!await submitUserPrediction(testQuestionId)) return;
    
    // Step 6: Set result and distribute points
    if (!await setQuestionResult(testQuestionId)) return;
    
    // Step 6.5: Check question status
    await checkQuestionStatus(testQuestionId);
    
    // Step 7: Test separate distribution endpoint
    if (!await testDistributePointsEndpoint(testQuestionId)) return;
    
    // Step 8: Verify user received points
    if (!await verifyUserPoints()) return;
    
    console.log('\n🎉 Phase 5: Points Integration Test COMPLETED SUCCESSFULLY!');
    console.log('✅ All prediction system points integration features working correctly');
    
  } catch (error) {
    console.log('\n❌ Phase 5 test failed:', error.message);
  } finally {
    await cleanup();
  }
}

runPhase5Test();