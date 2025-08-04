const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function importStudentLoanModule() {
  try {
    const moduleData = {
      "fb227": {
        "id": "fb227",
        "title": "Student Loan Forgiveness: What's Changed and Who Qualifies",
        "category": "Debt",
        "difficulty": "Intermediate",
        "points": 20,
        "estimatedTime": 5,
        "completed": false,
        "content": "<h2>Student Loan Forgiveness: What's Changed and Who Qualifies</h2><p>The landscape of student loan forgiveness has shifted significantly in 2024–2025. Several programs introduced in recent years have been rolled back or restructured under new policy guidance. Understanding what remains, what's been eliminated, and what may still qualify for forgiveness is essential to financial planning.</p><h3>Recent Policy Changes</h3><ul><li><strong>End of broad forgiveness programs:</strong> Mass student loan cancellation initiatives have been discontinued. The focus has shifted to targeted, qualification-based relief.</li><li><strong>Stricter income-driven repayment (IDR) requirements:</strong> New verification processes require annual income documentation and employment certification.</li><li><strong>SAVE Plan elimination:</strong> The Saving on a Valuable Education (SAVE) Plan has been discontinued. Existing SAVE borrowers are being transitioned to alternative repayment options.</li></ul><h3>What Still Qualifies for Forgiveness</h3><p><strong>Public Service Loan Forgiveness (PSLF)</strong></p><ul><li>Available for borrowers working full-time for qualifying government organizations or eligible non-profits</li><li>Requires 120 qualifying monthly payments under a qualifying repayment plan</li><li>Recent changes have narrowed the definition of qualifying employment, particularly for contractors and certain non-profit roles</li></ul><p><strong>Income-Driven Repayment (IDR) Forgiveness</strong></p><ul><li>Forgiveness after 20-25 years of qualifying payments, depending on the plan</li><li>New Repayment Assistance Plan (RAP) will replace current IDR plans, extending forgiveness timelines to 30 years for new borrowers</li><li>Existing IDR borrowers may benefit from the IDR account adjustment, which provides retroactive credit for past time in repayment or forbearance</li></ul><p><strong>Targeted Professional Programs</strong></p><ul><li>Teacher Loan Forgiveness (up to $17,500 for qualifying teachers)</li><li>Health professional loan forgiveness for certain medical fields in underserved areas</li><li>Military service-related forgiveness programs</li></ul><h3>Action Steps</h3><ol><li><strong>Review your current repayment status:</strong> Contact your loan servicer to understand how recent changes affect your specific situation.</li><li><strong>Verify employment eligibility:</strong> If pursuing PSLF, ensure your employer still qualifies under the updated guidelines.</li><li><strong>Consider consolidation strategically:</strong> Direct Consolidation may reset your payment count for PSLF, but could be beneficial for IDR account adjustment eligibility.</li><li><strong>Stay informed:</strong> Policy changes continue to evolve. Monitor official Department of Education communications for updates.</li></ol><p>The key to navigating student loan forgiveness is understanding that blanket relief programs have ended, but targeted, qualification-based forgiveness remains available for those who meet specific criteria.</p>",
        "quiz": [
          {
            "id": "q1",
            "question": "What is the IDR account adjustment benefit?",
            "options": ["A new type of loan", "A refund for interest", "Retroactive credit toward forgiveness for past time in repayment or forbearance"],
            "correctAnswer": 2,
            "explanation": "This adjustment may count years that previously didn't qualify toward IDR or PSLF forgiveness."
          },
          {
            "id": "q2",
            "question": "What's the new repayment system being implemented?",
            "options": ["Extended SAVE", "PAYE rollover", "Repayment Assistance Plan (RAP)"],
            "correctAnswer": 2,
            "explanation": "RAP will replace current IDR plans and extend forgiveness timelines to 30 years."
          },
          {
            "id": "q3",
            "question": "How has Public Service Loan Forgiveness (PSLF) eligibility changed?",
            "options": ["It's available to everyone", "It no longer requires certification", "The definition of qualifying employment has narrowed"],
            "correctAnswer": 2,
            "explanation": "Recent changes restrict the types of public service employment that qualify for PSLF."
          }
        ]
      }
    };

    const module = moduleData.fb227;
    
    console.log('Importing student loan forgiveness module...');
    
    // Insert the learning module
    const result = await sql`
      INSERT INTO learning_modules (
        id, title, category, difficulty, points_reward, estimated_time, 
        content, quiz_questions, is_published, created_at, updated_at
      ) VALUES (
        ${module.id},
        ${module.title},
        ${module.category},
        ${module.difficulty},
        ${module.points},
        ${module.estimatedTime},
        ${module.content},
        ${JSON.stringify(module.quiz)},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        difficulty = EXCLUDED.difficulty,
        points_reward = EXCLUDED.points_reward,
        estimated_time = EXCLUDED.estimated_time,
        content = EXCLUDED.content,
        quiz_questions = EXCLUDED.quiz_questions,
        is_published = EXCLUDED.is_published,
        updated_at = NOW()
      RETURNING id, title
    `;
    
    console.log(`✅ Successfully imported module: ${result[0].title} (ID: ${result[0].id})`);
    
    // Show updated module count by category
    const categoryStats = await sql`
      SELECT category, COUNT(*) as count 
      FROM learning_modules 
      WHERE is_published = true 
      GROUP BY category 
      ORDER BY category
    `;
    
    console.log('\n📊 Updated module distribution:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.count} modules`);
    });
    
    const totalModules = await sql`SELECT COUNT(*) as total FROM learning_modules WHERE is_published = true`;
    console.log(`\n🎯 Total published modules: ${totalModules[0].total}`);
    
  } catch (error) {
    console.error('❌ Error importing student loan module:', error);
    process.exit(1);
  }
}

importStudentLoanModule();