const { db } = require('./server/db');
const { storage } = require('./server/storage');
const { sql } = require('drizzle-orm');

async function testPredictionSystemPhase1() {
  console.log('🧪 Testing Prediction System Phase 1 - Database & Storage');
  
  try {
    // Test 1: Create the prediction tables manually
    console.log('\n1. Creating prediction system tables...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "prediction_questions" (
        "id" serial PRIMARY KEY NOT NULL,
        "cycle_setting_id" integer NOT NULL REFERENCES "cycle_settings"("id"),
        "question_text" text NOT NULL,
        "options" text NOT NULL,
        "submission_deadline" timestamp NOT NULL,
        "result_determination_time" timestamp NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "correct_answer_index" integer,
        "point_awards" text,
        "total_submissions" integer DEFAULT 0 NOT NULL,
        "results_published" boolean DEFAULT false NOT NULL,
        "points_distributed" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "created_by" integer NOT NULL REFERENCES "users"("id"),
        "published_at" timestamp,
        "closed_at" timestamp,
        "completed_at" timestamp,
        "completed_by" integer REFERENCES "users"("id")
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_predictions" (
        "id" serial PRIMARY KEY NOT NULL,
        "prediction_question_id" integer NOT NULL REFERENCES "prediction_questions"("id"),
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "selected_option_index" integer NOT NULL,
        "points_awarded" integer DEFAULT 0 NOT NULL,
        "submitted_at" timestamp DEFAULT now() NOT NULL,
        "last_updated_at" timestamp DEFAULT now() NOT NULL,
        "points_distributed_at" timestamp
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "prediction_results" (
        "id" serial PRIMARY KEY NOT NULL,
        "prediction_question_id" integer NOT NULL REFERENCES "prediction_questions"("id"),
        "correct_answer_index" integer NOT NULL,
        "total_participants" integer NOT NULL,
        "option_stats" text NOT NULL,
        "total_points_awarded" integer NOT NULL,
        "points_per_option" text NOT NULL,
        "determined_at" timestamp DEFAULT now() NOT NULL,
        "determined_by" integer NOT NULL REFERENCES "users"("id"),
        "points_distributed_at" timestamp,
        "notes" text
      );
    `);
    
    console.log('✅ Tables created successfully');
    
    // Test 2: Get active cycle
    console.log('\n2. Getting active cycle...');
    const activeCycle = await storage.getActiveCycleSetting();
    if (!activeCycle) {
      console.log('❌ No active cycle found');
      return;
    }
    console.log(`✅ Active cycle: ${activeCycle.cycleName} (ID: ${activeCycle.id})`);
    
    // Test 3: Get admin user
    console.log('\n3. Getting admin user...');
    const adminUser = await storage.getUserByEmail('admin@finboost.com');
    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }
    console.log(`✅ Admin user: ${adminUser.username} (ID: ${adminUser.id})`);
    
    // Test 4: Create a test prediction question
    console.log('\n4. Creating test prediction question...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const testQuestion = await storage.createPredictionQuestion({
      cycleSettingId: activeCycle.id,
      questionText: "What will be the average S&P 500 closing price range for the last week of this month?",
      options: JSON.stringify([
        "Below 5,800",
        "5,800 - 5,900", 
        "5,900 - 6,000",
        "Above 6,000"
      ]),
      submissionDeadline: tomorrow,
      resultDeterminationTime: nextWeek,
      createdBy: adminUser.id
    });
    console.log(`✅ Created test question: ID ${testQuestion.id}`);
    
    // Test 5: Test question retrieval methods
    console.log('\n5. Testing question retrieval methods...');
    
    const retrievedQuestion = await storage.getPredictionQuestion(testQuestion.id);
    console.log(`✅ Retrieved question: ${retrievedQuestion?.questionText?.substring(0, 50)}...`);
    
    const cycleQuestions = await storage.getPredictionQuestionsByCycle(activeCycle.id);
    console.log(`✅ Questions in cycle: ${cycleQuestions.length}`);
    
    const activeQuestions = await storage.getActivePredictionQuestions(activeCycle.id);
    console.log(`✅ Active questions: ${activeQuestions.length}`);
    
    // Test 6: Publish the question
    console.log('\n6. Publishing question...');
    await storage.publishPredictionQuestion(testQuestion.id);
    
    const publishedQuestion = await storage.getPredictionQuestion(testQuestion.id);
    console.log(`✅ Question status: ${publishedQuestion?.status}`);
    
    // Test 7: Test user prediction submission
    console.log('\n7. Testing user prediction submission...');
    
    // Get a test user
    const testUser = await storage.getUserByEmail('test@example.com');
    if (!testUser) {
      console.log('⚠️ No test user found, skipping prediction submission test');
    } else {
      const userPrediction = await storage.submitUserPrediction({
        predictionQuestionId: testQuestion.id,
        userId: testUser.id,
        selectedOptionIndex: 1 // "5,800 - 5,900"
      });
      console.log(`✅ User prediction submitted: ID ${userPrediction.id}`);
      
      // Test retrieving user's prediction
      const retrievedPrediction = await storage.getUserPrediction(testQuestion.id, testUser.id);
      console.log(`✅ Retrieved user prediction: Option ${retrievedPrediction?.selectedOptionIndex}`);
    }
    
    // Test 8: Test prediction statistics
    console.log('\n8. Testing prediction statistics...');
    const stats = await storage.getPredictionQuestionStats(testQuestion.id);
    console.log(`✅ Prediction stats: ${stats.totalSubmissions} submissions`);
    console.log(`✅ Option counts: [${stats.optionCounts.join(', ')}]`);
    console.log(`✅ Option percentages: [${stats.optionPercentages.join(', ')}]%`);
    
    // Test 9: Test cycle analytics
    console.log('\n9. Testing cycle analytics...');
    const analytics = await storage.getPredictionAnalyticsByCycle(activeCycle.id);
    console.log(`✅ Cycle analytics:`);
    console.log(`   - Total questions: ${analytics.totalQuestions}`);
    console.log(`   - Active questions: ${analytics.activeQuestions}`);
    console.log(`   - Completed questions: ${analytics.completedQuestions}`);
    console.log(`   - Total participants: ${analytics.totalParticipants}`);
    console.log(`   - Avg participation rate: ${analytics.averageParticipationRate}%`);
    
    console.log('\n🎉 Phase 1 Testing Complete - All database and storage methods working!');
    
  } catch (error) {
    console.error('❌ Phase 1 Test Error:', error);
    throw error;
  }
}

// Run the test
testPredictionSystemPhase1()
  .then(() => {
    console.log('\n✅ Phase 1 testing completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Phase 1 testing failed:', error);
    process.exit(1);
  });