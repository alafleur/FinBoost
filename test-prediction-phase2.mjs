import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testPredictionPhase2() {
  console.log('🔍 Testing Phase 2: Prediction System API Endpoints');
  
  try {
    // First, login as admin to get token
    console.log('\n1. Admin Authentication...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'lafleur.andrew@gmail.com',
        password: 'admin123456'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Admin login failed, creating admin user...');
      
      // Try to register admin user
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          email: 'lafleur.andrew@gmail.com',
          password: 'password123'
        })
      });
      
      if (!registerResponse.ok) {
        throw new Error('Failed to create admin user');
      }
      
      console.log('✅ Admin user created successfully');
    }

    const loginData = await loginResponse.json();
    const adminToken = loginData.token;
    console.log('✅ Admin authentication successful');

    // Get active cycle for testing
    console.log('\n2. Getting active cycle...');
    const cycleResponse = await fetch(`${API_BASE}/api/admin/cycle-settings`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!cycleResponse.ok) {
      console.log('❌ Could not get cycle settings, creating one...');
      
      // Create a test cycle
      const createCycleResponse = await fetch(`${API_BASE}/api/admin/cycle-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cycleName: 'Test Prediction Cycle',
          cycleType: 'monthly',
          cycleStartDate: '2025-01-01',
          cycleEndDate: '2025-01-31',
          rewardPoolPercentage: 55,
          membershipFee: 2000,
          tier1Percentage: 33,
          tier2Percentage: 67,
          isActive: true
        })
      });

      if (!createCycleResponse.ok) {
        throw new Error('Failed to create test cycle');
      }
      
      console.log('✅ Test cycle created');
    }

    const cycles = await cycleResponse.json();
    const activeCycle = cycles.find(c => c.isActive) || cycles[0];
    
    if (!activeCycle) {
      throw new Error('No active cycle found');
    }
    
    console.log(`✅ Using cycle: ${activeCycle.cycleName} (ID: ${activeCycle.id})`);

    // Test 3: Create prediction question
    console.log('\n3. Creating prediction question...');
    const questionData = {
      cycleSettingId: activeCycle.id,
      questionText: 'What will the S&P 500 do this month?',
      options: ['Rise by 5%+', 'Rise by 1-5%', 'Stay flat (-1% to +1%)', 'Fall by 1-5%', 'Fall by 5%+'],
      submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      resultDeterminationTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      pointAwards: [10, 10, 10, 10, 10] // 10 points for any correct answer
    };

    const createQuestionResponse = await fetch(`${API_BASE}/api/admin/prediction-questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(questionData)
    });

    if (!createQuestionResponse.ok) {
      const errorData = await createQuestionResponse.text();
      throw new Error(`Failed to create prediction question: ${errorData}`);
    }

    const questionResult = await createQuestionResponse.json();
    console.log('✅ Prediction question created:', questionResult.question.id);

    // Test 4: Get prediction questions for cycle
    console.log('\n4. Getting prediction questions...');
    const getQuestionsResponse = await fetch(`${API_BASE}/api/admin/prediction-questions/${activeCycle.id}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!getQuestionsResponse.ok) {
      throw new Error('Failed to get prediction questions');
    }

    const questionsData = await getQuestionsResponse.json();
    console.log(`✅ Retrieved ${questionsData.questions.length} prediction questions`);

    // Test 5: Publish prediction question
    console.log('\n5. Publishing prediction question...');
    const publishResponse = await fetch(`${API_BASE}/api/admin/prediction-questions/${questionResult.question.id}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!publishResponse.ok) {
      throw new Error('Failed to publish prediction question');
    }

    console.log('✅ Prediction question published');

    // Test 6: Get active predictions (user endpoint)
    console.log('\n6. Getting active predictions (user view)...');
    const activeQuestionsResponse = await fetch(`${API_BASE}/api/predictions/active`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!activeQuestionsResponse.ok) {
      throw new Error('Failed to get active predictions');
    }

    const activeQuestions = await activeQuestionsResponse.json();
    console.log(`✅ Retrieved ${activeQuestions.questions.length} active prediction questions`);

    // Test 7: Submit user prediction
    console.log('\n7. Submitting user prediction...');
    const submitPredictionResponse = await fetch(`${API_BASE}/api/predictions/${questionResult.question.id}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selectedOptionIndex: 1 // "Rise by 1-5%"
      })
    });

    if (!submitPredictionResponse.ok) {
      const errorData = await submitPredictionResponse.text();
      throw new Error(`Failed to submit prediction: ${errorData}`);
    }

    const predictionResult = await submitPredictionResponse.json();
    console.log('✅ User prediction submitted:', predictionResult.prediction.id);

    // Test 8: Get question statistics
    console.log('\n8. Getting question statistics...');
    const statsResponse = await fetch(`${API_BASE}/api/admin/prediction-questions/${questionResult.question.id}/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!statsResponse.ok) {
      throw new Error('Failed to get question statistics');
    }

    const stats = await statsResponse.json();
    console.log('✅ Question statistics:', {
      totalSubmissions: stats.stats.totalSubmissions,
      optionCounts: stats.stats.optionCounts
    });

    // Test 9: Get user prediction history
    console.log('\n9. Getting user prediction history...');
    const historyResponse = await fetch(`${API_BASE}/api/predictions/my-predictions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!historyResponse.ok) {
      throw new Error('Failed to get prediction history');
    }

    const history = await historyResponse.json();
    console.log(`✅ Retrieved ${history.predictions.length} user predictions`);

    // Test 10: Get user prediction stats
    console.log('\n10. Getting user prediction stats...');
    const userStatsResponse = await fetch(`${API_BASE}/api/predictions/my-stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!userStatsResponse.ok) {
      throw new Error('Failed to get user prediction stats');
    }

    const userStats = await userStatsResponse.json();
    console.log('✅ User prediction stats:', userStats.stats);

    console.log('\n✅ Phase 2 API Endpoints Test Complete!');
    console.log('📊 Summary:');
    console.log('- Admin authentication: ✅');
    console.log('- Cycle management: ✅');
    console.log('- Question creation: ✅');
    console.log('- Question publishing: ✅');
    console.log('- User predictions: ✅');
    console.log('- Statistics tracking: ✅');
    console.log('- User history: ✅');
    console.log('\n🎯 Ready for Phase 3: Admin UI Components');

  } catch (error) {
    console.error('❌ Phase 2 test failed:', error.message);
    throw error;
  }
}

testPredictionPhase2().catch(console.error);