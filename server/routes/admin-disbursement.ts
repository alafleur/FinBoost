/**
 * Step 4: Admin Disbursement Route with Two-Phase Transaction Pattern
 * 
 * This module integrates the PayPal transaction orchestrator with the admin
 * disbursement endpoint to provide robust transaction processing.
 */

import type { Request, Response } from 'express';
import { 
  executePaypalDisbursementTransaction, 
  PayoutRecipient,
  TransactionResult 
} from '../paypal-transaction-orchestrator.js';
import { storage } from '../storage.js';
import crypto from 'crypto';

/**
 * Step 4: Enhanced admin disbursement endpoint using two-phase transaction pattern
 * 
 * Replaces the previous direct PayPal integration with a robust two-phase
 * transaction pattern that ensures atomicity and consistency.
 */
export async function processWinnerDisbursements(req: Request, res: Response) {
  const { cycleSettingId } = req.params;
  const adminId = (req as any).user?.id;

  if (!adminId) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  if (!cycleSettingId || isNaN(Number(cycleSettingId))) {
    return res.status(400).json({ error: 'Valid cycle setting ID required' });
  }

  console.log(`[STEP 4 ADMIN] Starting disbursement process for cycle ${cycleSettingId} by admin ${adminId}`);

  try {
    // Step 1: Get cycle winner details
    const winnerData = await storage.getCycleWinnerDetails(Number(cycleSettingId));
    
    if (!winnerData.winners || winnerData.winners.length === 0) {
      return res.status(404).json({ 
        error: 'No winners found for this cycle',
        cycleSettingId: cycleSettingId
      });
    }

    // Step 2: Validate winners have PayPal emails configured
    const invalidWinners = winnerData.winners.filter((winner: any) => !winner.paypalEmail);
    if (invalidWinners.length > 0) {
      return res.status(400).json({
        error: 'Some winners do not have PayPal emails configured',
        invalidWinners: invalidWinners.map((w: any) => ({
          userId: w.userId,
          username: w.username,
          email: w.email
        }))
      });
    }

    // Step 3: Prepare recipient data for transaction orchestrator
    const recipients: PayoutRecipient[] = winnerData.winners.map((winner: any) => ({
      cycleWinnerSelectionId: winner.id,
      userId: winner.userId,
      paypalEmail: winner.paypalEmail,
      amount: winner.rewardAmount, // Already in cents from database
      currency: 'USD',
      note: `FinBoost Cycle ${cycleSettingId} Reward - ${winner.tier} Tier`
    }));

    // Step 4: Generate unique request ID for idempotency
    const requestId = crypto.randomUUID();

    // Step 5: Execute two-phase transaction
    console.log(`[STEP 4 ADMIN] Executing two-phase transaction for ${recipients.length} recipients`);
    
    const transactionResult: TransactionResult = await executePaypalDisbursementTransaction(
      Number(cycleSettingId),
      adminId,
      recipients,
      requestId
    );

    // Step 6: Prepare response based on transaction result
    if (transactionResult.success && transactionResult.phase2) {
      const { phase2 } = transactionResult;
      
      console.log(`[STEP 4 ADMIN] Transaction completed successfully`);
      console.log(`[STEP 4 ADMIN] PayPal Batch ID: ${phase2.paypalBatchId}`);
      console.log(`[STEP 4 ADMIN] Results: ${phase2.successfulCount} successful, ${phase2.failedCount} failed, ${phase2.pendingCount} pending`);

      return res.status(200).json({
        success: true,
        message: 'Disbursement transaction completed successfully',
        data: {
          batchId: phase2.batchId,
          paypalBatchId: phase2.paypalBatchId,
          totalRecipients: recipients.length,
          results: {
            successful: phase2.successfulCount,
            failed: phase2.failedCount,
            pending: phase2.pendingCount,
            userRewardsCreated: phase2.userRewardsCreated,
            cycleCompleted: phase2.cycleCompleted
          },
          requestId,
          transactionId: transactionResult.phase1.senderBatchId
        },
        warnings: [
          ...transactionResult.phase1.warnings,
          ...(transactionResult.warnings || [])
        ]
      });

    } else {
      // Transaction failed
      console.error(`[STEP 4 ADMIN] Transaction failed`);
      console.error(`[STEP 4 ADMIN] Phase 1 errors:`, transactionResult.phase1.errors);
      console.error(`[STEP 4 ADMIN] Phase 2 errors:`, transactionResult.phase2?.errors || []);
      console.error(`[STEP 4 ADMIN] Rollback performed:`, transactionResult.rollbackPerformed);

      return res.status(500).json({
        success: false,
        error: 'Disbursement transaction failed',
        details: {
          phase1Errors: transactionResult.phase1.errors,
          phase2Errors: transactionResult.phase2?.errors || [],
          rollbackPerformed: transactionResult.rollbackPerformed,
          allErrors: transactionResult.errors
        },
        requestId
      });
    }

  } catch (error) {
    console.error(`[STEP 4 ADMIN] Critical error in disbursement process:`, error);
    
    return res.status(500).json({
      error: 'Critical error during disbursement process',
      message: error instanceof Error ? error.message : String(error),
      cycleSettingId: cycleSettingId
    });
  }
}

/**
 * Step 4: Get transaction status endpoint
 */
export async function getTransactionStatus(req: Request, res: Response) {
  const { batchId } = req.params;

  if (!batchId || isNaN(Number(batchId))) {
    return res.status(400).json({ error: 'Valid batch ID required' });
  }

  try {
    const { getTransactionStatus } = await import('../paypal-transaction-orchestrator.js');
    const status = await getTransactionStatus(Number(batchId));

    return res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error(`[STEP 4 ADMIN] Error getting transaction status:`, error);
    
    return res.status(500).json({
      error: 'Error retrieving transaction status',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}