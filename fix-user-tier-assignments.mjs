import { db } from './server/db.ts';
import { users, userCyclePoints, cycleSettings } from './shared/schema.ts';
import { eq, and, gt, desc } from 'drizzle-orm';

async function fixUserTierAssignments() {
  console.log('Starting user tier assignment fix...');

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

    // Get users with points > 0 for percentile calculation
    const usersWithPoints = usersWithCyclePoints
      .filter(user => (user.cyclePoints || 0) > 0)
      .sort((a, b) => (b.cyclePoints || 0) - (a.cyclePoints || 0));

    console.log(`${usersWithPoints.length} users have points > 0`);

    if (usersWithPoints.length === 0) {
      console.log('No users with points found, setting all to tier3');
      // Set all users to tier3 if no one has points
      for (const user of usersWithCyclePoints) {
        await db.update(users).set({ tier: 'tier3' }).where(eq(users.id, user.userId));
      }
      return;
    }

    // Calculate tier assignments using 33%/67% percentiles
    const tier1Threshold = Math.floor(usersWithPoints.length * 0.33);
    const tier2Threshold = Math.floor(usersWithPoints.length * 0.67);

    let tier1Count = 0, tier2Count = 0, tier3Count = 0;

    // Assign tiers to all users
    for (const user of usersWithCyclePoints) {
      const cyclePoints = user.cyclePoints || 0;
      let newTier;

      if (cyclePoints === 0) {
        newTier = 'tier3';
      } else {
        // Find rank among users with points
        const rank = usersWithPoints.findIndex(u => u.userId === user.userId);
        
        if (rank < tier1Threshold) {
          newTier = 'tier1';
        } else if (rank < tier2Threshold) {
          newTier = 'tier2';
        } else {
          newTier = 'tier3';
        }
      }

      // Update tier if it changed
      if (user.currentTier !== newTier) {
        await db.update(users).set({ tier: newTier }).where(eq(users.id, user.userId));
        console.log(`Updated user ${user.username} (${cyclePoints} pts): ${user.currentTier} → ${newTier}`);
      }

      // Count tiers
      if (newTier === 'tier1') tier1Count++;
      else if (newTier === 'tier2') tier2Count++;
      else tier3Count++;
    }

    console.log('\nFinal tier distribution:');
    console.log(`Tier 1: ${tier1Count} users`);
    console.log(`Tier 2: ${tier2Count} users`);
    console.log(`Tier 3: ${tier3Count} users`);
    console.log('Tier assignment fix completed successfully!');

  } catch (error) {
    console.error('Error fixing tier assignments:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixUserTierAssignments();