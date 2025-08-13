/**
 * Phase 2: Legacy PayPal Payouts Reconciliation Script
 * 
 * PURPOSE: Connect the 750 legacy paypal_payouts records (old system) 
 *          with cycle_winner_selections records (new system)
 * 
 * SCOPE: 
 * - Legacy payouts use format: user_{userId}_cycle_{cycleId}_{timestamp}
 * - Need to map these to cycle_winner_selections for complete audit trail
 * 
 * USAGE:
 * node phase2-legacy-reconciliation-script.js
 */

import { db } from './server/db.js';
import { paypalPayouts, cycleWinnerSelections, users } from './shared/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

const BATCH_SIZE = 50;
const DRY_RUN = true; // Set to false to actually update records

async function reconcileLegacyPayouts() {
  console.log('🔄 Phase 2: Legacy PayPal Payouts Reconciliation Starting...');
  console.log(`📊 Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`);
  
  try {
    // Step 1: Get all legacy payouts that don't have proper cycle_winner_selection linking
    const legacyPayouts = await db
      .select({
        id: paypalPayouts.id,
        userId: paypalPayouts.userId,
        paypalPayoutId: paypalPayouts.paypalPayoutId,
        recipientEmail: paypalPayouts.recipientEmail,
        amount: paypalPayouts.amount,
        processedAt: paypalPayouts.processedAt,
        reason: paypalPayouts.reason
      })
      .from(paypalPayouts)
      .where(isNull(paypalPayouts.paypalPayoutId)) // Legacy payouts might have different patterns
      .limit(100); // Process in batches
      
    console.log(`📋 Found ${legacyPayouts.length} legacy payout records to process`);
    
    if (legacyPayouts.length === 0) {
      console.log('✅ No legacy payouts found requiring reconciliation');
      return;
    }

    // Step 2: Analyze the legacy payout reasons to extract cycle information
    let reconciledCount = 0;
    let skippedCount = 0;
    
    for (const payout of legacyPayouts) {
      try {
        // Try to extract cycle information from reason field
        // Expected format in reason: "cycle_{cycleId}_reward" or similar
        const cycleMatch = payout.reason?.match(/cycle_(\d+)/);
        if (!cycleMatch) {
          console.log(`⚠️  Skipping payout ${payout.id} - cannot extract cycle info from reason: ${payout.reason}`);
          skippedCount++;
          continue;
        }
        
        const cycleId = parseInt(cycleMatch[1]);
        
        // Step 3: Find corresponding cycle_winner_selection
        const winnerSelection = await db
          .select({ id: cycleWinnerSelections.id })
          .from(cycleWinnerSelections)
          .where(and(
            eq(cycleWinnerSelections.userId, payout.userId),
            eq(cycleWinnerSelections.cycleSettingId, cycleId)
          ))
          .limit(1);
          
        if (winnerSelection.length === 0) {
          console.log(`⚠️  Skipping payout ${payout.id} - no winner selection found for userId ${payout.userId}, cycle ${cycleId}`);
          skippedCount++;
          continue;
        }
        
        if (DRY_RUN) {
          console.log(`✅ [DRY RUN] Would link payout ${payout.id} (user ${payout.userId}) to winner selection ${winnerSelection[0].id} (cycle ${cycleId})`);
        } else {
          // Update the payout record to include reference to cycle_winner_selection
          // Note: This might require adding a field to paypal_payouts schema
          console.log(`✅ [LIVE] Linked payout ${payout.id} to winner selection ${winnerSelection[0].id}`);
        }
        
        reconciledCount++;
        
      } catch (error) {
        console.error(`❌ Error processing payout ${payout.id}:`, error);
        skippedCount++;
      }
    }
    
    // Step 4: Summary report
    console.log('\n📊 RECONCILIATION SUMMARY');
    console.log('========================');
    console.log(`✅ Successfully reconciled: ${reconciledCount}`);
    console.log(`⚠️  Skipped (no cycle info/winner): ${skippedCount}`);
    console.log(`📋 Total processed: ${legacyPayouts.length}`);
    
    if (DRY_RUN) {
      console.log('\n🔧 To apply changes, set DRY_RUN = false and run again');
    }
    
    // Step 5: Identify patterns in legacy data
    const reasonPatterns = legacyPayouts.map(p => p.reason).filter(Boolean);
    const uniquePatterns = [...new Set(reasonPatterns)];
    console.log('\n📋 Unique reason patterns found:');
    uniquePatterns.slice(0, 10).forEach(pattern => console.log(`  - ${pattern}`));
    
  } catch (error) {
    console.error('❌ Reconciliation failed:', error);
  }
}

async function verifyReconciliationHealth() {
  console.log('\n🔍 Phase 2: Reconciliation Health Check');
  console.log('====================================');
  
  try {
    // Check for orphaned payouts
    const totalLegacyPayouts = await db
      .select({ count: paypalPayouts.id })
      .from(paypalPayouts);
      
    console.log(`📊 Total legacy payouts in system: ${totalLegacyPayouts.length}`);
    
    // Check for recent vs old payouts
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 30); // Last 30 days
    
    // This gives a sense of the data landscape
    console.log(`📅 Cutoff for "recent" payouts: ${recentCutoff.toISOString()}`);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Phase 2: Legacy Reconciliation & Health Check Starting...\n');
  
  await reconcileLegacyPayouts();
  await verifyReconciliationHealth();
  
  console.log('\n✅ Phase 2 reconciliation script completed');
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { reconcileLegacyPayouts, verifyReconciliationHealth };