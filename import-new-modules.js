import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

async function importNewModules() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Read the JSON data from the file
    const jsonData = JSON.parse(fs.readFileSync('attached_assets/Pasted--fb201-id-fb201-title-How-Interest-Accrues-Daily-and-Why-It-Matters--1754264711398_1754264711399.txt', 'utf8'));
    
    // Get current max order to continue sequence
    const maxOrderResult = await pool.query('SELECT COALESCE(MAX("order"), 0) as max_order FROM learning_modules');
    let currentOrder = maxOrderResult.rows[0].max_order;

    let importedCount = 0;
    let skippedCount = 0;

    for (const [moduleKey, moduleData] of Object.entries(jsonData)) {
      try {
        // Check if module already exists by ID or title
        const existingModule = await pool.query(
          'SELECT id FROM learning_modules WHERE id = $1 OR title = $2',
          [parseInt(moduleData.id.replace('fb', '')), moduleData.title]
        );

        if (existingModule.rows.length > 0) {
          console.log(`⚠️  Skipping existing module: ${moduleData.title}`);
          skippedCount++;
          continue;
        }

        currentOrder++;
        
        // Map your JSON format to database schema
        const insertData = {
          id: parseInt(moduleData.id.replace('fb', '')), // Convert fb201 -> 201
          title: moduleData.title,
          description: moduleData.title, // Use title as description since it's not in your JSON
          content: moduleData.content,
          points_reward: moduleData.points,
          category: moduleData.category,
          difficulty: moduleData.difficulty,
          estimated_minutes: moduleData.estimatedTime,
          is_active: true,
          order: currentOrder,
          is_published: true,
          published_at: new Date().toISOString(),
          quiz: JSON.stringify(moduleData.quiz), // Convert quiz object to JSON string
          access_type: 'premium' // Default to premium, adjust as needed
        };

        const result = await pool.query(`
          INSERT INTO learning_modules (
            id, title, description, content, points_reward, category, 
            difficulty, estimated_minutes, is_active, "order", 
            is_published, published_at, quiz, access_type
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          ) RETURNING id, title
        `, [
          insertData.id, insertData.title, insertData.description, insertData.content,
          insertData.points_reward, insertData.category, insertData.difficulty,
          insertData.estimated_minutes, insertData.is_active, insertData.order,
          insertData.is_published, insertData.published_at, insertData.quiz,
          insertData.access_type
        ]);

        console.log(`✅ Imported: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
        importedCount++;

      } catch (moduleError) {
        console.error(`❌ Error importing ${moduleData.title}:`, moduleError.message);
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} modules`);
    console.log(`⚠️  Skipped existing: ${skippedCount} modules`);
    console.log(`📚 Total modules in database: ${importedCount + skippedCount + (maxOrderResult.rows[0].max_order)}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

importNewModules();