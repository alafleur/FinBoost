/**
 * Step 4: Two-Phase Transaction Pattern for PayPal Disbursements
 * 
 * This module implements a comprehensive two-phase transaction pattern that ensures
 * atomicity and consistency between database operations and PayPal API calls.
 * 
 * Phase 1 (Prepare/Intent): 
 * - Validate all prerequisites and data integrity
 * - Create payout batch intent in database with "intent" status
 * - Generate idempotency safeguards
 * - Prepare PayPal request payload
 * - Check for conflicts and validate business rules
 * 
 * Phase 2 (Commit/Execute):
 * - Execute PayPal API call with prepared data
 * - Process PayPal response using Step 2 parsing
 * - Update database using Step 3 storage methods
 * - Handle success, failure, and partial success scenarios
 * - Ensure consistent final state across all systems
 */

import { createPaypalPayout, parseEnhancedPayoutResponse, getEnhancedPayoutStatus } from './paypal.js';
import { storage } from './storage.js';
import type { ParsedPayoutResponse, PayoutItemResult } from './paypal.js';
import type { InsertPayoutBatch, InsertPayoutBatchItem } from '@shared/schema.js';
import crypto from 'crypto';

// ============================================================================
// Types and Interfaces for Two-Phase Transaction Pattern
// ============================================================================

export interface PayoutRecipient {
  cycleWinnerSelectionId: number;
  userId: number;
  paypalEmail: string;
  amount: number; // In cents
  currency: string;
  note?: string;
}

export interface TransactionContext {
  cycleSettingId: number;
  adminId: number;
  recipients: PayoutRecipient[];
  totalAmount: number; // In cents
  requestId: string; // Unique request identifier for idempotency
}

export interface Phase1Result {
  success: boolean;
  batchId?: number;
  senderBatchId: string;
  requestChecksum: string;
  paypalPayload: any;
  itemIds: number[];
  errors: string[];
  warnings: string[];
}

export interface Phase2Result {
  success: boolean;
  batchId: number;
  paypalBatchId?: string;
  processedCount: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  userRewardsCreated: number;
  cycleCompleted: boolean;
  errors: string[];
  paypalResponse?: any;
  parsedResponse?: ParsedPayoutResponse;
}

export interface TransactionResult {
  success: boolean;
  phase1: Phase1Result;
  phase2?: Phase2Result;
  rollbackPerformed: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Two-Phase Transaction Orchestrator Class
// ============================================================================

export class PaypalTransactionOrchestrator {
  private static readonly MAX_RECIPIENTS_PER_BATCH = 15000; // PayPal limit
  private static readonly MIN_AMOUNT_CENTS = 1; // $0.01 minimum
  private static readonly MAX_AMOUNT_CENTS = 6000000; // $60,000 maximum per item

  /**
   * Main entry point for two-phase PayPal disbursement transactions
   */
  async executeTransaction(context: TransactionContext): Promise<TransactionResult> {
    console.log(`[STEP 4 ORCHESTRATOR] Starting two-phase transaction for ${context.recipients.length} recipients`);
    
    const result: TransactionResult = {
      success: false,
      phase1: {
        success: false,
        senderBatchId: '',
        requestChecksum: '',
        paypalPayload: null,
        itemIds: [],
        errors: [],
        warnings: []
      },
      rollbackPerformed: false,
      errors: [],
      warnings: []
    };

    try {
      // ========================================================================
      // PHASE 1: PREPARE - Create Intent and Validate
      // ========================================================================
      console.log('[STEP 4 ORCHESTRATOR] PHASE 1: Starting preparation phase');
      
      result.phase1 = await this.executePhase1(context);
      
      if (!result.phase1.success) {
        console.error('[STEP 4 ORCHESTRATOR] Phase 1 failed, aborting transaction');
        result.errors.push('Phase 1 preparation failed');
        result.errors.push(...result.phase1.errors);
        return result;
      }

      console.log(`[STEP 4 ORCHESTRATOR] Phase 1 completed successfully - Batch ID: ${result.phase1.batchId}`);

      // ========================================================================
      // PHASE 2: COMMIT - Execute PayPal API and Update Database
      // ========================================================================
      console.log('[STEP 4 ORCHESTRATOR] PHASE 2: Starting execution phase');
      
      result.phase2 = await this.executePhase2(result.phase1);
      
      if (!result.phase2.success) {
        console.error('[STEP 4 ORCHESTRATOR] Phase 2 failed, performing rollback');
        await this.performRollback(result.phase1);
        result.rollbackPerformed = true;
        result.errors.push('Phase 2 execution failed, rollback performed');
        result.errors.push(...result.phase2.errors);
        return result;
      }

      console.log(`[STEP 4 ORCHESTRATOR] Phase 2 completed successfully - PayPal Batch ID: ${result.phase2.paypalBatchId}`);

      // ========================================================================
      // TRANSACTION SUCCESS
      // ========================================================================
      result.success = true;
      console.log(`[STEP 4 ORCHESTRATOR] Two-phase transaction completed successfully`);
      console.log(`[STEP 4 ORCHESTRATOR] Results: ${result.phase2.successfulCount} successful, ${result.phase2.failedCount} failed, ${result.phase2.pendingCount} pending`);

      return result;

    } catch (error) {
      console.error('[STEP 4 ORCHESTRATOR] Critical transaction error:', error);
      result.errors.push(`Critical transaction error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Attempt rollback if Phase 1 succeeded
      if (result.phase1.success) {
        try {
          await this.performRollback(result.phase1);
          result.rollbackPerformed = true;
          console.log('[STEP 4 ORCHESTRATOR] Emergency rollback completed');
        } catch (rollbackError) {
          console.error('[STEP 4 ORCHESTRATOR] Emergency rollback failed:', rollbackError);
          result.errors.push(`Emergency rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }
      
      return result;
    }
  }

  // ============================================================================
  // PHASE 1: PREPARE - Intent Creation and Validation
  // ============================================================================

  private async executePhase1(context: TransactionContext): Promise<Phase1Result> {
    const result: Phase1Result = {
      success: false,
      senderBatchId: '',
      requestChecksum: '',
      paypalPayload: null,
      itemIds: [],
      errors: [],
      warnings: []
    };

    try {
      console.log('[STEP 4 PHASE 1] Starting validation and intent creation');

      // Step 1.1: Validate business rules and prerequisites
      const validationResult = await this.validateTransactionContext(context);
      if (!validationResult.isValid) {
        result.errors.push(...validationResult.errors);
        return result;
      }
      result.warnings.push(...validationResult.warnings);

      // Step 1.2: Generate idempotency safeguards
      const idempotencyData = this.generateIdempotencyData(context);
      result.senderBatchId = idempotencyData.senderBatchId;
      result.requestChecksum = idempotencyData.requestChecksum;

      // Step 1.3: Check for duplicate transactions
      const duplicateCheck = await this.checkForDuplicateTransaction(result.requestChecksum);
      if (duplicateCheck.isDuplicate) {
        result.errors.push(`Duplicate transaction detected: ${duplicateCheck.existingBatchId}`);
        return result;
      }

      // Step 1.4: Create payout batch intent in database
      const batchData: InsertPayoutBatch = {
        cycleSettingId: context.cycleSettingId,
        senderBatchId: result.senderBatchId,
        requestChecksum: result.requestChecksum,
        status: 'intent', // Phase 1 status
        adminId: context.adminId,
        totalAmount: context.totalAmount,
        totalRecipients: context.recipients.length
      };

      const createdBatch = await storage.createPayoutBatch(batchData);
      result.batchId = createdBatch.id;
      console.log(`[STEP 4 PHASE 1] Created payout batch intent: ${result.batchId}`);

      // Step 1.5: Create payout batch items
      const itemIds: number[] = [];
      for (const recipient of context.recipients) {
        const itemData: InsertPayoutBatchItem = {
          batchId: result.batchId,
          cycleWinnerSelectionId: recipient.cycleWinnerSelectionId,
          userId: recipient.userId,
          paypalEmail: recipient.paypalEmail,
          amount: recipient.amount,
          currency: recipient.currency
        };

        const createdItem = await storage.createPayoutBatchItem(itemData);
        itemIds.push(createdItem.id);
      }
      result.itemIds = itemIds;
      console.log(`[STEP 4 PHASE 1] Created ${itemIds.length} payout batch items`);

      // Step 1.6: Prepare PayPal API payload
      result.paypalPayload = this.preparePaypalPayload(context, result.senderBatchId);

      // Step 1.7: Final validation of prepared data
      const finalValidation = this.validatePreparedData(result);
      if (!finalValidation.isValid) {
        result.errors.push(...finalValidation.errors);
        return result;
      }

      result.success = true;
      console.log('[STEP 4 PHASE 1] Phase 1 preparation completed successfully');
      
      return result;

    } catch (error) {
      console.error('[STEP 4 PHASE 1] Phase 1 error:', error);
      result.errors.push(`Phase 1 error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  // ============================================================================
  // PHASE 2: COMMIT - PayPal Execution and Database Updates
  // ============================================================================

  private async executePhase2(phase1Result: Phase1Result): Promise<Phase2Result> {
    const result: Phase2Result = {
      success: false,
      batchId: phase1Result.batchId!,
      processedCount: 0,
      successfulCount: 0,
      failedCount: 0,
      pendingCount: 0,
      userRewardsCreated: 0,
      cycleCompleted: false,
      errors: []
    };

    try {
      console.log('[STEP 4 PHASE 2] Starting PayPal execution phase');

      // Step 2.1: Update batch status to "processing"
      await storage.updatePayoutBatch(result.batchId, { 
        status: 'processing',
        updatedAt: new Date()
      });

      // Step 2.2: Execute PayPal API call
      console.log('[STEP 4 PHASE 2] Executing PayPal payout API call');
      const paypalResponse = await createPaypalPayout(phase1Result.paypalPayload.items);
      result.paypalResponse = paypalResponse;

      // Step 2.3: Parse PayPal response using Step 2 enhanced parsing
      console.log('[STEP 4 PHASE 2] Parsing PayPal response using Step 2 methods');
      const parsedResponse = parseEnhancedPayoutResponse(paypalResponse);
      result.parsedResponse = parsedResponse;
      result.paypalBatchId = parsedResponse.paypalBatchId;

      // Step 2.4: Process response using Step 3 storage integration
      console.log('[STEP 4 PHASE 2] Processing response using Step 3 integration methods');
      const processingResult = await storage.processPaypalResponseResults(result.batchId, parsedResponse);
      
      // Update result with processing statistics
      result.processedCount = processingResult.itemsUpdated;
      result.successfulCount = processingResult.successfulPayouts;
      result.failedCount = processingResult.failedPayouts;
      result.pendingCount = processingResult.pendingPayouts;
      result.userRewardsCreated = processingResult.userRewardsCreated;
      result.cycleCompleted = processingResult.cycleCompleted;

      // Step 2.5: Verify data consistency
      const consistencyCheck = await this.verifyDataConsistency(result.batchId, parsedResponse);
      if (!consistencyCheck.isConsistent) {
        result.errors.push(...consistencyCheck.errors);
        // Don't fail the transaction for consistency warnings - log them
        console.warn('[STEP 4 PHASE 2] Data consistency warnings:', consistencyCheck.errors);
      }

      // Step 2.6: Final batch status update
      const finalStatus = this.determineFinalBatchStatus(parsedResponse);
      await storage.updatePayoutBatch(result.batchId, { 
        status: finalStatus,
        paypalBatchId: result.paypalBatchId,
        updatedAt: new Date()
      });

      result.success = true;
      console.log('[STEP 4 PHASE 2] Phase 2 execution completed successfully');
      
      return result;

    } catch (error) {
      console.error('[STEP 4 PHASE 2] Phase 2 error:', error);
      result.errors.push(`Phase 2 error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Update batch status to "failed" on error
      try {
        await storage.updatePayoutBatch(result.batchId, { 
          status: 'failed',
          errorDetails: error instanceof Error ? error.message : String(error),
          updatedAt: new Date()
        });
      } catch (statusUpdateError) {
        console.error('[STEP 4 PHASE 2] Failed to update batch status to failed:', statusUpdateError);
      }
      
      return result;
    }
  }

  // ============================================================================
  // Validation and Helper Methods
  // ============================================================================

  private async validateTransactionContext(context: TransactionContext): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate recipients array
    if (!context.recipients || context.recipients.length === 0) {
      errors.push('No recipients provided');
    }

    if (context.recipients.length > PaypalTransactionOrchestrator.MAX_RECIPIENTS_PER_BATCH) {
      errors.push(`Too many recipients: ${context.recipients.length}. Maximum: ${PaypalTransactionOrchestrator.MAX_RECIPIENTS_PER_BATCH}`);
    }

    // Validate individual recipients
    for (let i = 0; i < context.recipients.length; i++) {
      const recipient = context.recipients[i];
      
      if (!recipient.paypalEmail || !this.isValidEmail(recipient.paypalEmail)) {
        errors.push(`Invalid PayPal email for recipient ${i + 1}: ${recipient.paypalEmail}`);
      }

      if (recipient.amount < PaypalTransactionOrchestrator.MIN_AMOUNT_CENTS) {
        errors.push(`Amount too small for recipient ${i + 1}: $${(recipient.amount / 100).toFixed(2)}`);
      }

      if (recipient.amount > PaypalTransactionOrchestrator.MAX_AMOUNT_CENTS) {
        errors.push(`Amount too large for recipient ${i + 1}: $${(recipient.amount / 100).toFixed(2)}`);
      }
    }

    // Validate total amount consistency
    const calculatedTotal = context.recipients.reduce((sum, r) => sum + r.amount, 0);
    if (Math.abs(calculatedTotal - context.totalAmount) > 1) { // Allow 1 cent tolerance for rounding
      errors.push(`Total amount mismatch: calculated ${calculatedTotal}, provided ${context.totalAmount}`);
    }

    // Check for duplicate recipients
    const emailSet = new Set<string>();
    const duplicateEmails: string[] = [];
    for (const recipient of context.recipients) {
      if (emailSet.has(recipient.paypalEmail)) {
        duplicateEmails.push(recipient.paypalEmail);
      } else {
        emailSet.add(recipient.paypalEmail);
      }
    }
    if (duplicateEmails.length > 0) {
      warnings.push(`Duplicate PayPal emails detected: ${duplicateEmails.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private generateIdempotencyData(context: TransactionContext): {
    senderBatchId: string;
    requestChecksum: string;
  } {
    const timestamp = Date.now();
    const senderBatchId = `finboost-${context.cycleSettingId}-${timestamp}`;
    
    // Create checksum from request data for idempotency
    const checksumData = {
      cycleSettingId: context.cycleSettingId,
      adminId: context.adminId,
      totalAmount: context.totalAmount,
      recipientCount: context.recipients.length,
      recipientEmails: context.recipients.map(r => r.paypalEmail).sort(),
      requestId: context.requestId
    };
    
    const requestChecksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(checksumData))
      .digest('hex');

    return { senderBatchId, requestChecksum };
  }

  private async checkForDuplicateTransaction(requestChecksum: string): Promise<{
    isDuplicate: boolean;
    existingBatchId?: string;
  }> {
    try {
      const existingBatch = await storage.getPayoutBatchByChecksum(requestChecksum);
      return {
        isDuplicate: !!existingBatch,
        existingBatchId: existingBatch?.senderBatchId
      };
    } catch (error) {
      console.warn('[STEP 4 ORCHESTRATOR] Duplicate check failed, proceeding:', error);
      return { isDuplicate: false };
    }
  }

  private preparePaypalPayload(context: TransactionContext, senderBatchId: string): any {
    return {
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: "FinBoost Reward Payout",
        email_message: "You have received a reward payout from FinBoost!"
      },
      items: context.recipients.map((recipient, index) => ({
        recipient_type: "EMAIL",
        amount: {
          value: (recipient.amount / 100).toFixed(2), // Convert cents to dollars
          currency: recipient.currency
        },
        receiver: recipient.paypalEmail,
        note: recipient.note || "FinBoost monthly reward",
        sender_item_id: `winner-${recipient.cycleWinnerSelectionId}-${recipient.userId}`
      }))
    };
  }

  private validatePreparedData(phase1Result: Phase1Result): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!phase1Result.batchId) {
      errors.push('No batch ID created');
    }

    if (!phase1Result.senderBatchId) {
      errors.push('No sender batch ID generated');
    }

    if (!phase1Result.paypalPayload || !phase1Result.paypalPayload.items) {
      errors.push('Invalid PayPal payload prepared');
    }

    if (phase1Result.itemIds.length === 0) {
      errors.push('No payout items created');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async verifyDataConsistency(batchId: number, parsedResponse: ParsedPayoutResponse): Promise<{
    isConsistent: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Verify batch exists and has correct PayPal batch ID
      const batch = await storage.getPayoutBatch(batchId);
      if (!batch) {
        errors.push('Batch not found in database');
        return { isConsistent: false, errors };
      }

      if (batch.paypalBatchId !== parsedResponse.paypalBatchId) {
        errors.push(`PayPal batch ID mismatch: DB ${batch.paypalBatchId}, Response ${parsedResponse.paypalBatchId}`);
      }

      // Verify item count consistency
      const batchItems = await storage.getPayoutBatchItems(batchId);
      if (batchItems.length !== parsedResponse.itemCount) {
        errors.push(`Item count mismatch: DB ${batchItems.length}, PayPal ${parsedResponse.itemCount}`);
      }

      return {
        isConsistent: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push(`Consistency check failed: ${error instanceof Error ? error.message : String(error)}`);
      return { isConsistent: false, errors };
    }
  }

  private determineFinalBatchStatus(parsedResponse: ParsedPayoutResponse): string {
    switch (parsedResponse.batchStatus.toUpperCase()) {
      case 'SUCCESS':
        return 'completed';
      case 'PENDING':
        return 'processing';
      case 'FAILED':
        return 'failed';
      default:
        return 'completed'; // Default for mixed results
    }
  }

  // ============================================================================
  // Rollback and Recovery Methods
  // ============================================================================

  private async performRollback(phase1Result: Phase1Result): Promise<void> {
    console.log(`[STEP 4 ROLLBACK] Starting rollback for batch ${phase1Result.batchId}`);

    try {
      if (phase1Result.batchId) {
        // Update batch status to "cancelled"
        await storage.updatePayoutBatch(phase1Result.batchId, {
          status: 'cancelled',
          errorDetails: 'Transaction rolled back due to Phase 2 failure',
          updatedAt: new Date()
        });

        // Update all batch items to "cancelled" status
        const batchItems = await storage.getPayoutBatchItems(phase1Result.batchId);
        for (const item of batchItems) {
          await storage.updatePayoutBatchItem(item.id, {
            status: 'cancelled',
            errorMessage: 'Transaction rolled back',
            updatedAt: new Date()
          });
        }

        console.log(`[STEP 4 ROLLBACK] Rollback completed for batch ${phase1Result.batchId}`);
      }
    } catch (error) {
      console.error('[STEP 4 ROLLBACK] Rollback failed:', error);
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Factory method to create transaction context from admin disbursement request
   */
  static createTransactionContext(
    cycleSettingId: number,
    adminId: number,
    recipients: PayoutRecipient[],
    requestId?: string
  ): TransactionContext {
    const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
    
    return {
      cycleSettingId,
      adminId,
      recipients,
      totalAmount,
      requestId: requestId || crypto.randomUUID()
    };
  }
}

// ============================================================================
// Main Export and Convenience Functions
// ============================================================================

/**
 * Main entry point for Step 4 two-phase PayPal transactions
 */
export async function executePaypalDisbursementTransaction(
  cycleSettingId: number,
  adminId: number,
  recipients: PayoutRecipient[],
  requestId?: string
): Promise<TransactionResult> {
  const orchestrator = new PaypalTransactionOrchestrator();
  const context = PaypalTransactionOrchestrator.createTransactionContext(
    cycleSettingId,
    adminId,
    recipients,
    requestId
  );
  
  return await orchestrator.executeTransaction(context);
}

/**
 * Utility function to check transaction status by batch ID
 */
export async function getTransactionStatus(batchId: number): Promise<{
  batchStatus: string;
  paypalBatchId?: string;
  itemCount: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
}> {
  const batch = await storage.getPayoutBatch(batchId);
  const items = await storage.getPayoutBatchItems(batchId);
  
  if (!batch) {
    throw new Error(`Batch ${batchId} not found`);
  }
  
  const statusCounts = items.reduce((acc, item) => {
    switch (item.status) {
      case 'success': acc.successful++; break;
      case 'failed': acc.failed++; break;
      case 'pending': 
      case 'unclaimed': acc.pending++; break;
    }
    return acc;
  }, { successful: 0, failed: 0, pending: 0 });

  return {
    batchStatus: batch.status,
    paypalBatchId: batch.paypalBatchId || undefined,
    itemCount: items.length,
    successfulCount: statusCounts.successful,
    failedCount: statusCounts.failed,
    pendingCount: statusCounts.pending
  };
}