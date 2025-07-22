import { db } from './server/db.ts';
import { users, userCyclePoints, cycleSettings } from './shared/schema.ts';
import { eq, and, gt, desc } from 'drizzle-orm';

async function fixTierDistribution() {
  console.log('Starting tier distribution fix...');

  try {
    // Get current active cycle
    const [activeCycle] = await db
      .select()
      .from(cycleSettings)
      .where(eq(cycleSettings.isActive, true))
      .limit(1);

    if (!activeCycle) {
      console.log('No active cycle found');
      return;
    }

    console.log(`Using active cycle: ${activeCycle.cycleName} (ID: ${activeCycle.id})`);

    // Get all users with their cycle points
    const usersWithCyclePoints = await db
      .select({
        userId: users.id,
        username: users.username,
        currentTier: users.tier,
        cyclePoints: userCyclePoints.currentCyclePoints
      })
      .from(users)
      .leftJoin(userCyclePoints, and(
        eq(userCyclePoints.userId, users.id),
        eq(userCyclePoints.cycleSettingId, activeCycle.id)
      ))
      .where(and(
        eq(users.isActive, true),
        eq(users.isAdmin, false)
      ));

    console.log(`Found ${usersWithCyclePoints.length} users to process`);

    // Separate users with 0 points (automatic tier3) from users with points
    const usersWithZeroPoints = usersWithCyclePoints.filter(user => (user.cyclePoints || 0) === 0);
    const usersWithPoints = usersWithCyclePoints
      .filter(user => (user.cyclePoints || 0) > 0)
      .sort((a, b) => (b.cyclePoints || 0) - (a.cyclePoints || 0)); // Sort descending by points

    console.log(`${usersWithZeroPoints.length} users have 0 points (automatic tier3)`);
    console.log(`${usersWithPoints.length} users have points > 0`);

    // Calculate equal divisions for users with points
    const totalUsersWithPoints = usersWithPoints.length;
    const usersPerTier = Math.floor(totalUsersWithPoints / 3);
    const remainderUsers = totalUsersWithPoints % 3;

    // Distribute users: top tier gets extra users if there's a remainder
    const tier1Count = usersPerTier + (remainderUsers > 0 ? 1 : 0);
    const tier2Count = usersPerTier + (remainderUsers > 1 ? 1 : 0);
    const tier3CountFromPoints = usersPerTier;

    console.log(`Equal division: ${tier1Count} tier1, ${tier2Count} tier2, ${tier3CountFromPoints} tier3 (from points)`);
    console.log(`Plus ${usersWithZeroPoints.length} zero-point users in tier3`);
    console.log(`Total tier3: ${tier3CountFromPoints + usersWithZeroPoints.length}`);

    let tier1Users = 0, tier2Users = 0, tier3Users = 0;

    // Assign tiers based on ranking
    for (let i = 0; i < usersWithPoints.length; i++) {
      const user = usersWithPoints[i];
      let newTier;

      if (i < tier1Count) {
        newTier = 'tier1';
        tier1Users++;
      } else if (i < tier1Count + tier2Count) {
        newTier = 'tier2';
        tier2Users++;
      } else {
        newTier = 'tier3';
        tier3Users++;
      }

      // Update tier if it changed
      if (user.currentTier !== newTier) {
        await db.update(users).set({ tier: newTier }).where(eq(users.id, user.userId));
        console.log(`Updated user ${user.username} (${user.cyclePoints} pts): ${user.currentTier} → ${newTier}`);
      }
    }

    // Set all zero-point users to tier3
    for (const user of usersWithZeroPoints) {
      if (user.currentTier !== 'tier3') {
        await db.update(users).set({ tier: 'tier3' }).where(eq(users.id, user.userId));
        console.log(`Updated zero-point user ${user.username}: ${user.currentTier} → tier3`);
      }
      tier3Users++;
    }

    console.log('\nFinal tier distribution:');
    console.log(`Tier 1: ${tier1Users} users`);
    console.log(`Tier 2: ${tier2Users} users`);
    console.log(`Tier 3: ${tier3Users} users`);
    console.log('Tier distribution fix completed successfully!');

  } catch (error) {
    console.error('Error fixing tier distribution:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixTierDistribution();