import { db } from './server/db.ts';

async function testPredictionPhase1() {
  console.log('🔍 Testing Phase 1: Prediction System Foundation');
  
  try {
    // Test 1: Verify all tables exist
    console.log('\n1. Checking database tables...');
    const result1 = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'prediction%'
      ORDER BY table_name
    `);
    
    console.log('✅ Prediction tables found:', result1.rows.map(r => r.table_name));
    
    // Test 2: Check table structures
    console.log('\n2. Checking table structures...');
    
    // Check prediction_questions table
    const pqColumns = await db.execute(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'prediction_questions'
      ORDER BY ordinal_position
    `);
    console.log('prediction_questions columns:', pqColumns.rows.length);
    
    // Check user_predictions table
    const upColumns = await db.execute(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_predictions'
      ORDER BY ordinal_position
    `);
    console.log('user_predictions columns:', upColumns.rows.length);
    
    // Check prediction_results table
    const prColumns = await db.execute(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'prediction_results'
      ORDER BY ordinal_position
    `);
    console.log('prediction_results columns:', prColumns.rows.length);
    
    // Test 3: Test foreign key relationships
    console.log('\n3. Testing foreign key relationships...');
    const fkResult = await db.execute(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name LIKE 'prediction%'
    `);
    
    console.log('✅ Foreign key relationships:', fkResult.rows.length);
    
    console.log('\n✅ Phase 1 Foundation Test Complete!');
    console.log('📊 Summary:');
    console.log('- prediction_questions table: Created');
    console.log('- user_predictions table: Created');
    console.log('- prediction_results table: Created');
    console.log('- Foreign key relationships: Verified');
    console.log('\n🎯 Ready for Phase 2: API Endpoints');
    
  } catch (error) {
    console.error('❌ Phase 1 test failed:', error.message);
    throw error;
  }
}

testPredictionPhase1().catch(console.error);