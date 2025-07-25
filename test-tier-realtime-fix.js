import { storage } from './server/storage.ts';

async function testRealTimeTierUpdate() {
  console.log('Testing real-time tier update fix...');

  try {
    // Test with user661@test.com who should have 196 points and be Tier 1
    const user = await storage.getUserByEmail('user661@test.com');
    if (!user) {
      console.log('User661 not found');
      return;
    }

    console.log(`\nUser: ${user.username} (ID: ${user.id})`);
    console.log(`Current database tier: ${user.tier}`);

    // Get current cycle and their cycle points
    const currentCycle = await storage.getCurrentCycle();
    if (!currentCycle) {
      console.log('No active cycle found');
      return;
    }

    const userCycleData = await storage.getUserCyclePoints(user.id, currentCycle.id);
    const actualPoints = userCycleData?.currentCyclePoints || 0;
    console.log(`Actual cycle points: ${actualPoints}`);

    // Calculate what tier should be based on points
    const calculatedTier = await storage.calculateUserTier(actualPoints);
    console.log(`Calculated tier based on points: ${calculatedTier}`);

    // Get tier thresholds for reference
    const thresholds = await storage.getCycleTierThresholds();
    console.log(`\nTier thresholds:`);
    console.log(`Tier 1: ${thresholds.tier1}+ points`);
    console.log(`Tier 2: ${thresholds.tier2}+ points`);
    console.log(`Tier 3: 0+ points`);

    // Check if tier matches what it should be
    if (calculatedTier === user.tier) {
      console.log(`✅ PASS: Database tier matches calculated tier (${calculatedTier})`);
    } else {
      console.log(`❌ FAIL: Database tier (${user.tier}) doesn't match calculated tier (${calculatedTier})`);
      console.log('This should now be fixed by the real-time tier updates');
    }

  } catch (error) {
    console.error('Error testing tier update:', error);
  } finally {
    process.exit(0);
  }
}

testRealTimeTierUpdate();