import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { learningModules } from './shared/schema.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function resetModulePoints() {
  try {
    console.log('Starting points reset for all learning modules...');
    
    // Update all modules to 20 points
    await db.update(learningModules)
      .set({ points: 20 });
    
    // Get count of all modules to confirm
    const allModules = await db.select().from(learningModules);
    
    console.log(`✅ Updated all ${allModules.length} modules to 20 points`);
    
    // Show sample of modules with their points
    console.log('\nSample of updated modules:');
    allModules.slice(0, 10).forEach(module => {
      console.log(`- ID ${module.id}: ${module.title} → ${module.points} pts`);
    });
    
    if (allModules.length > 10) {
      console.log(`... and ${allModules.length - 10} more modules`);
    }
    
    console.log('\n🎉 All learning modules now set to 20 points!');
    
  } catch (error) {
    console.error('Error resetting module points:', error);
  } finally {
    await client.end();
  }
}

resetModulePoints();