import { db } from './server/db.ts';
import { learningModules } from './shared/schema.ts';
import { educationContent } from './client/src/data/educationContent.ts';
import { eq } from 'drizzle-orm';

const newModuleIds = [
  // Batch 1
  'budgeting-variable-expenses',
  'saving-windfalls', 
  'investing-dividends',
  'credit-inquiries',
  'debt-secured-vs-unsecured',
  'tax-deductions-vs-credits',
  
  // Batch 2
  'cash-flow-analysis',
  'sinking-funds',
  'roth-vs-traditional-ira',
  'credit-utilization',
  'debt-to-income-ratio',
  'building-wealth-mindset',
  'renters-insurance-basics',
  'real-estate-vs-rent',
  'intro-to-hsas',
  
  // Batch 3
  'tracking-net-worth',
  'high-yield-savings',
  'intro-to-etfs',
  'negotiating-bills',
  'refinancing-debt',
  'tax-brackets',
  'planning-for-major-purchases',
  'renting-vs-leasing',
  'life-insurance-types'
];

async function syncNewModules() {
  console.log('Starting sync of new modules...');
  
  for (const moduleId of newModuleIds) {
    const lessonData = educationContent[moduleId];
    
    if (!lessonData) {
      console.log(`Module ${moduleId} not found in education content`);
      continue;
    }
    
    // Check if module already exists in database
    const existingModule = await db.select().from(learningModules).where(eq(learningModules.contentId, moduleId)).limit(1);
    
    if (existingModule.length > 0) {
      console.log(`Module ${moduleId} already exists, skipping`);
      continue;
    }
    
    console.log(`Adding module: ${lessonData.title}`);
    
    await db.insert(learningModules).values({
      title: lessonData.title,
      contentId: moduleId,
      category: lessonData.category,
      difficulty: lessonData.difficulty,
      points: lessonData.points,
      estimatedTime: lessonData.estimatedTime,
      isPublished: true,
      isActive: true,
      accessLevel: 'free'
    });
  }
  
  console.log('Sync completed!');
  process.exit(0);
}

syncNewModules().catch(console.error);