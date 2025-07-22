import { db } from './server/db.ts';
import { users, userCyclePoints, cycleSettings } from './shared/schema.ts';
import { eq, and, gt, desc } from 'drizzle-orm';

async function testTierCalculation() {
  console.log('Testing corrected tier calculation logic...');

  try {
    // Test the logic manually with current data
    const [activeCycle] = await db
      .select()
      .from(cycleSettings)
      .where(eq(cycleSettings.isActive, true))
      .limit(1);

    if (!activeCycle) {
      console.log('No active cycle found');
      return;
    }

    // Get all users with points > 0, sorted by points descending
    const usersWithPoints = await db
      .select({
        userId: users.id,
        username: users.username,
        cyclePoints: userCyclePoints.currentCyclePoints
      })
      .from(users)
      .leftJoin(userCyclePoints, and(
        eq(userCyclePoints.userId, users.id),
        eq(userCyclePoints.cycleSettingId, activeCycle.id)
      ))
      .where(and(
        eq(users.isActive, true),
        eq(users.isAdmin, false),
        gt(userCyclePoints.currentCyclePoints, 0)
      ))
      .orderBy(desc(userCyclePoints.currentCyclePoints));

    console.log(`Found ${usersWithPoints.length} users with points > 0`);

    // Calculate equal divisions
    const totalUsersWithPoints = usersWithPoints.length;
    const usersPerTier = Math.floor(totalUsersWithPoints / 3);
    const remainderUsers = totalUsersWithPoints % 3;

    const tier1Count = usersPerTier + (remainderUsers > 0 ? 1 : 0);
    const tier2Count = usersPerTier + (remainderUsers > 1 ? 1 : 0);
    const tier3CountFromPoints = usersPerTier;

    console.log(`Calculated equal division:`);
    console.log(`- Tier 1: ${tier1Count} users (ranks 0 to ${tier1Count - 1})`);
    console.log(`- Tier 2: ${tier2Count} users (ranks ${tier1Count} to ${tier1Count + tier2Count - 1})`);
    console.log(`- Tier 3: ${tier3CountFromPoints} users (ranks ${tier1Count + tier2Count} to ${totalUsersWithPoints - 1})`);

    // Test a few specific users to see their tier assignment
    const testUsers = [
      usersWithPoints[0], // Top user
      usersWithPoints[Math.floor(tier1Count / 2)], // Middle of tier 1
      usersWithPoints[tier1Count - 1], // Last user in tier 1
      usersWithPoints[tier1Count], // First user in tier 2
      usersWithPoints[tier1Count + tier2Count - 1], // Last user in tier 2
      usersWithPoints[tier1Count + tier2Count], // First user in tier 3
      usersWithPoints[totalUsersWithPoints - 1] // Last user
    ].filter(Boolean);

    console.log('\nSample tier assignments:');
    testUsers.forEach((user, index) => {
      const rank = usersWithPoints.findIndex(u => u.userId === user.userId);
      let expectedTier;
      
      if (rank < tier1Count) {
        expectedTier = 'tier1';
      } else if (rank < tier1Count + tier2Count) {
        expectedTier = 'tier2';
      } else {
        expectedTier = 'tier3';
      }

      console.log(`Rank ${rank}: ${user.username} (${user.cyclePoints} pts) → ${expectedTier}`);
    });

    console.log('\nTier calculation logic test completed successfully!');

  } catch (error) {
    console.error('Error testing tier calculation:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testTierCalculation();