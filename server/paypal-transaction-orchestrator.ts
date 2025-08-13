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
import { db } from './db.js'; // CHATGPT: Import db for transaction boundary
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

// ============================================================================
// PHASE 1: VALIDATION RESULT TYPES (Long-term Fix)
// ============================================================================

export type ValidationOk = { 
  valid: true; 
  sanitized: TransactionContext; 
};

export type ValidationFail = { 
  valid: false; 
  errors: string[]; 
  sanitized?: Partial<TransactionContext>; 
};

export type ValidationResult = ValidationOk | ValidationFail;

// ============================================================================
// STEP 6: RE-RUN PREVENTION & RETRY LOGIC TYPES
// ============================================================================

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RetryState {
  attemptNumber: number;
  lastAttemptAt: Date;
  nextRetryAt: Date;
  totalAttempts: number;
  errorHistory: Array<{
    attemptNumber: number;
    timestamp: Date;
    errorType: string;
    errorMessage: string;
    recoverable: boolean;
  }>;
}

export interface TransactionStatus {
  batchId: number;
  status: 'intent' | 'processing' | 'retrying' | 'completed' | 'failed' | 'cancelled';
  lastActivity: Date;
  retryState?: RetryState;
  preventRerun: boolean;
  lockExpiry?: Date;
}

export interface TransactionContext {
  cycleSettingId: number;
  adminId: number;
  recipients: PayoutRecipient[];
  totalAmount: number; // In cents
  requestId: string; // Unique request identifier for idempotency
  senderBatchId: string; // Deterministic sender batch ID for PayPal
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
  // STEP 4: Replay safety fields
  expectedItemCount?: number;
  payloadChecksum?: string;
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

  // ========================================================================
  // STEP 7: DEFENSIVE ORCHESTRATOR ENHANCEMENT - VALIDATION & PROTECTION
  // ========================================================================
  
  // Input validation constraints
  private static readonly MAX_EMAIL_LENGTH = 254; // RFC 5321 standard
  private static readonly MIN_CYCLE_ID = 1;
  private static readonly MAX_ADMIN_ID = 999999999;
  private static readonly MAX_USER_ID = 999999999;
  private static readonly MAX_TOTAL_AMOUNT_CENTS = 10000000000; // $100M safety limit
  private static readonly MAX_REQUEST_ID_LENGTH = 500;
  private static readonly MAX_SENDER_BATCH_ID_LENGTH = 127; // PayPal limit
  
  // Circuit breaker configuration
  private static readonly CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
  private static readonly CIRCUIT_BREAKER_TIMEOUT_MS = 300000; // 5 minutes
  private static readonly CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS = 3;
  
  // Resource protection limits
  private static readonly MAX_PROCESSING_TIME_MS = 1800000; // 30 minutes
  private static readonly MAX_MEMORY_USAGE_MB = 512;
  private static readonly MAX_CONCURRENT_OPERATIONS = 10;
  
  // Fail-safe timeouts
  private static readonly PHASE1_TIMEOUT_MS = 300000; // 5 minutes
  private static readonly PHASE2_TIMEOUT_MS = 600000; // 10 minutes
  private static readonly ROLLBACK_TIMEOUT_MS = 180000; // 3 minutes

  // ========================================================================
  // STEP 6: RETRY POLICY CONFIGURATION
  // ========================================================================
  
  private static readonly DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 3,
    baseDelayMs: 5000, // 5 seconds
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
    retryableErrors: [
      'ECONNRESET',
      'ETIMEDOUT', 
      'ENOTFOUND',
      'ECONNREFUSED',
      'SOCKET_TIMEOUT',
      'NETWORK_ERROR',
      'TEMPORARY_UNAVAILABLE',
      'RATE_LIMITED',
      'INTERNAL_ERROR'
    ]
  };

  private static readonly PROCESSING_LOCK_DURATION_MS = 600000; // 10 minutes
  private static readonly RERUN_COOLDOWN_MS = 60000; // 1 minute
  
  // ========================================================================
  // STEP 7: CIRCUIT BREAKER STATE MANAGEMENT
  // ========================================================================
  
  private static circuitBreakerState: {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime: Date | null;
    successCount: number;
  } = {
    state: 'closed',
    failureCount: 0,
    lastFailureTime: null,
    successCount: 0
  };
  
  private static activeOperations = 0;

  // ========================================================================
  // STEP 7: DEFENSIVE VALIDATION METHODS
  // ========================================================================
  
  /**
   * PHASE 1: Comprehensive input validation with guaranteed return structure
   * This method NEVER returns undefined - always returns ValidationResult
   */
  private validateTransactionContext(context: TransactionContext): ValidationResult {
    try {
      const errors: string[] = [];
      
      // Defensive null/undefined check for context
      if (!context || typeof context !== 'object') {
        return { 
          valid: false, 
          errors: ['context_missing_or_invalid'] 
        };
      }

      // Initialize sanitized context with actual values and safe defaults
      const sanitized: TransactionContext = {
        cycleSettingId: context.cycleSettingId || 0,
        adminId: context.adminId || 0,
        recipients: context.recipients || [],
        totalAmount: context.totalAmount || 0,
        requestId: context.requestId || '',
        senderBatchId: context.senderBatchId || ''
      };

      // Validate cycle ID
      if (!this.isValidNumber(context.cycleSettingId)) {
        errors.push('cycle_setting_id_invalid');
      } else if (context.cycleSettingId < PaypalTransactionOrchestrator.MIN_CYCLE_ID) {
        errors.push(`cycle_setting_id_too_low`);
      }

      // Validate admin ID  
      if (!this.isValidNumber(context.adminId)) {
        errors.push('admin_id_invalid');
      } else if (context.adminId > PaypalTransactionOrchestrator.MAX_ADMIN_ID) {
        errors.push('admin_id_exceeds_maximum');
      }

      // Validate request ID
      if (!this.isValidString(context.requestId)) {
        errors.push('request_id_missing');
      } else {
        sanitized.requestId = this.sanitizeString(context.requestId);
        if (sanitized.requestId.length > PaypalTransactionOrchestrator.MAX_REQUEST_ID_LENGTH) {
          errors.push('request_id_too_long');
        }
      }

      // Validate sender batch ID
      if (!this.isValidString(context.senderBatchId)) {
        errors.push('sender_batch_id_missing');
      } else {
        sanitized.senderBatchId = this.sanitizeString(context.senderBatchId);
        if (sanitized.senderBatchId.length > PaypalTransactionOrchestrator.MAX_SENDER_BATCH_ID_LENGTH) {
          errors.push('sender_batch_id_too_long');
        }
      }

      // Validate recipients array
      const recipientValidation = this.validateRecipients(context.recipients);
      if (!recipientValidation.valid) {
        errors.push(...recipientValidation.errors);
      } else {
        sanitized.recipients = recipientValidation.sanitizedRecipients!;
      }

      // Validate total amount
      if (!this.isValidNumber(context.totalAmount)) {
        errors.push('total_amount_invalid');
      } else if (context.totalAmount > PaypalTransactionOrchestrator.MAX_TOTAL_AMOUNT_CENTS) {
        errors.push('total_amount_exceeds_safety_limit');
      } else if (context.totalAmount <= 0) {
        errors.push('total_amount_must_be_positive');
      }

      // Return validation result
      if (errors.length > 0) {
        return { 
          valid: false, 
          errors,
          sanitized: sanitized as Partial<TransactionContext>
        };
      }

      return { 
        valid: true, 
        sanitized 
      };

    } catch (error) {
      // Defensive catch-all - should never happen but prevents undefined returns
      console.error('[VALIDATOR EXCEPTION]', error);
      return { 
        valid: false, 
        errors: ['validation_internal_error'] 
      };
    }
  }

  /**
   * Helper: Validate that value is a valid positive number
   */
  private isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && Number.isFinite(value) && value > 0;
  }

  /**
   * Helper: Validate that value is a valid non-empty string
   */
  private isValidString(value: any): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Helper: Sanitize string input (consistent with checksum generation)
   */
  private sanitizeString(value: string): string {
    return value.trim();
  }

  /**
   * Helper: Normalize email address (consistent with existing logic)
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Helper: Validate email format
   */
  private isValidPaypalEmail(email: string): boolean {
    const normalizedEmail = this.normalizeEmail(email);
    if (normalizedEmail.length === 0 || normalizedEmail.length > PaypalTransactionOrchestrator.MAX_EMAIL_LENGTH) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  }

  /**
   * Helper: Validate recipients array with comprehensive error handling
   */
  private validateRecipients(recipients: any): { valid: boolean; errors: string[]; sanitizedRecipients?: PayoutRecipient[] } {
    const errors: string[] = [];

    // Check if recipients is an array
    if (!Array.isArray(recipients)) {
      return { valid: false, errors: ['recipients_not_array'] };
    }

    // Check if array is empty
    if (recipients.length === 0) {
      return { valid: false, errors: ['recipients_empty'] };
    }

    // Check if array exceeds maximum size
    if (recipients.length > PaypalTransactionOrchestrator.MAX_RECIPIENTS_PER_BATCH) {
      return { 
        valid: false, 
        errors: [`recipients_exceed_limit_${recipients.length}_max_${PaypalTransactionOrchestrator.MAX_RECIPIENTS_PER_BATCH}`] 
      };
    }

    // Validate each recipient
    const sanitizedRecipients: PayoutRecipient[] = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const recipientErrors: string[] = [];

      // Validate recipient structure
      if (!recipient || typeof recipient !== 'object') {
        errors.push(`recipient_${i}_invalid_structure`);
        continue;
      }

      // Create sanitized recipient with safe defaults
      const sanitizedRecipient: PayoutRecipient = {
        cycleWinnerSelectionId: 0,
        userId: 0,
        paypalEmail: '',
        amount: 0,
        currency: 'USD'
      };

      // Validate cycle winner selection ID
      if (!this.isValidNumber(recipient.cycleWinnerSelectionId)) {
        recipientErrors.push(`recipient_${i}_winner_id_invalid`);
      } else {
        sanitizedRecipient.cycleWinnerSelectionId = recipient.cycleWinnerSelectionId;
      }

      // Validate user ID
      if (!this.isValidNumber(recipient.userId)) {
        recipientErrors.push(`recipient_${i}_user_id_invalid`);
      } else if (recipient.userId > PaypalTransactionOrchestrator.MAX_USER_ID) {
        recipientErrors.push(`recipient_${i}_user_id_exceeds_maximum`);
      } else {
        sanitizedRecipient.userId = recipient.userId;
      }

      // Validate and sanitize PayPal email
      if (!this.isValidString(recipient.paypalEmail)) {
        recipientErrors.push(`recipient_${i}_email_missing`);
      } else {
        const normalizedEmail = this.normalizeEmail(recipient.paypalEmail);
        if (!this.isValidPaypalEmail(recipient.paypalEmail)) {
          recipientErrors.push(`recipient_${i}_email_invalid_format`);
        } else {
          sanitizedRecipient.paypalEmail = normalizedEmail;
        }
      }

      // Validate amount
      if (!this.isValidNumber(recipient.amount)) {
        recipientErrors.push(`recipient_${i}_amount_invalid`);
      } else if (recipient.amount < PaypalTransactionOrchestrator.MIN_AMOUNT_CENTS) {
        recipientErrors.push(`recipient_${i}_amount_too_low`);
      } else if (recipient.amount > PaypalTransactionOrchestrator.MAX_AMOUNT_CENTS) {
        recipientErrors.push(`recipient_${i}_amount_too_high`);
      } else {
        sanitizedRecipient.amount = recipient.amount;
      }

      // Validate currency
      if (this.isValidString(recipient.currency)) {
        const normalizedCurrency = recipient.currency.toUpperCase();
        if (normalizedCurrency !== 'USD') {
          recipientErrors.push(`recipient_${i}_currency_not_supported`);
        } else {
          sanitizedRecipient.currency = normalizedCurrency;
        }
      } else {
        // Default to USD if not provided
        sanitizedRecipient.currency = 'USD';
      }

      // Add note if present
      if (this.isValidString(recipient.note)) {
        sanitizedRecipient.note = this.sanitizeString(recipient.note);
      }

      // Collect errors for this recipient
      errors.push(...recipientErrors);

      // Only add recipient if no errors
      if (recipientErrors.length === 0) {
        sanitizedRecipients.push(sanitizedRecipient);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedRecipients: errors.length === 0 ? sanitizedRecipients : undefined
    };
  }
  
  /**
   * Circuit breaker pattern implementation
   */
  private checkCircuitBreaker(): { allowed: boolean; reason?: string } {
    const state = PaypalTransactionOrchestrator.circuitBreakerState;
    const now = new Date();
    
    switch (state.state) {
      case 'closed':
        return { allowed: true };
        
      case 'open':
        if (state.lastFailureTime && 
            (now.getTime() - state.lastFailureTime.getTime()) > PaypalTransactionOrchestrator.CIRCUIT_BREAKER_TIMEOUT_MS) {
          // Move to half-open state
          state.state = 'half-open';
          state.successCount = 0;
          console.log('[STEP 7 DEFENSIVE] Circuit breaker moved to half-open state');
          return { allowed: true };
        }
        return { 
          allowed: false, 
          reason: `Circuit breaker open due to ${state.failureCount} failures. Will retry after ${Math.ceil((PaypalTransactionOrchestrator.CIRCUIT_BREAKER_TIMEOUT_MS - (now.getTime() - (state.lastFailureTime?.getTime() || 0))) / 60000)} minutes.`
        };
        
      case 'half-open':
        if (state.successCount >= PaypalTransactionOrchestrator.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS) {
          // Close the circuit breaker
          state.state = 'closed';
          state.failureCount = 0;
          state.lastFailureTime = null;
          console.log('[STEP 7 DEFENSIVE] Circuit breaker closed after successful recovery');
        }
        return { allowed: true };
    }
  }
  
  /**
   * Record circuit breaker operations
   */
  private recordCircuitBreakerResult(success: boolean): void {
    const state = PaypalTransactionOrchestrator.circuitBreakerState;
    
    if (success) {
      if (state.state === 'half-open') {
        state.successCount++;
      } else if (state.state === 'closed') {
        // Reset failure count on successful operation
        state.failureCount = Math.max(0, state.failureCount - 1);
      }
    } else {
      state.failureCount++;
      state.lastFailureTime = new Date();
      
      if (state.failureCount >= PaypalTransactionOrchestrator.CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
        state.state = 'open';
        state.successCount = 0;
        console.log(`[STEP 7 DEFENSIVE] Circuit breaker opened after ${state.failureCount} failures`);
      }
    }
  }
  
  /**
   * Resource protection and concurrent operation management
   */
  private async acquireOperationSlot(): Promise<{ acquired: boolean; reason?: string }> {
    if (PaypalTransactionOrchestrator.activeOperations >= PaypalTransactionOrchestrator.MAX_CONCURRENT_OPERATIONS) {
      return { 
        acquired: false, 
        reason: `Maximum concurrent operations reached: ${PaypalTransactionOrchestrator.activeOperations}/${PaypalTransactionOrchestrator.MAX_CONCURRENT_OPERATIONS}`
      };
    }
    
    PaypalTransactionOrchestrator.activeOperations++;
    console.log(`[STEP 7 DEFENSIVE] Operation slot acquired (${PaypalTransactionOrchestrator.activeOperations}/${PaypalTransactionOrchestrator.MAX_CONCURRENT_OPERATIONS})`);
    return { acquired: true };
  }
  
  /**
   * Release operation slot
   */
  private releaseOperationSlot(): void {
    PaypalTransactionOrchestrator.activeOperations = Math.max(0, PaypalTransactionOrchestrator.activeOperations - 1);
    console.log(`[STEP 7 DEFENSIVE] Operation slot released (${PaypalTransactionOrchestrator.activeOperations}/${PaypalTransactionOrchestrator.MAX_CONCURRENT_OPERATIONS})`);
  }
  
  /**
   * Enhanced main entry point with defensive mechanisms
   */
  async executeTransaction(context: TransactionContext): Promise<TransactionResult> {
    console.log(`[STEP 7 DEFENSIVE] Starting defensive transaction validation for ${context.recipients.length} recipients`);
    
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

    let operationSlotAcquired = false;
    const processingStartTime = new Date();
    
    try {
      // ========================================================================
      // STEP 7: DEFENSIVE LAYER 1 - INPUT VALIDATION WITH UNDEFINED PROTECTION
      // ========================================================================
      console.log('[STEP 7 DEFENSIVE] Layer 1: Validating transaction context');
      
      const validation = this.validateTransactionContext(context) as ValidationResult;
      
      // PHASE 1: Defensive guard against undefined validation results
      if (!validation || typeof validation !== 'object') {
        console.error('[STEP 7 DEFENSIVE] Validation returned invalid result:', validation);
        result.errors.push('validation_system_error');
        result.errors.push('validator_returned_invalid_result');
        return result;
      }
      
      // PHASE 1: Defensive guard against missing validation properties
      if (validation.valid !== true && validation.valid !== false) {
        console.error('[STEP 7 DEFENSIVE] Validation result missing valid property:', validation);
        result.errors.push('validation_system_error');
        result.errors.push('validator_missing_valid_property');
        return result;
      }
      
      // PHASE 1: Handle validation failure with proper error structure
      if (validation.valid !== true) {
        const validationErrors = Array.isArray(validation.errors) ? validation.errors : ['validation_errors_missing'];
        console.error('[STEP 7 DEFENSIVE] Input validation failed with errors:', validationErrors);
        result.errors.push('input_validation_failed');
        result.errors.push(...validationErrors);
        return result;
      }
      
      // PHASE 1: Defensive guard against missing sanitized context
      if (!validation.sanitized || typeof validation.sanitized !== 'object') {
        console.error('[STEP 7 DEFENSIVE] Validation passed but missing sanitized context:', validation);
        result.errors.push('validation_system_error');
        result.errors.push('validator_missing_sanitized_context');
        return result;
      }
      
      // Use sanitized context for processing
      const sanitizedContext = validation.sanitized;
      console.log('[STEP 7 DEFENSIVE] Input validation passed - using sanitized context with', sanitizedContext.recipients.length, 'recipients');
      
      // ========================================================================
      // STEP 7: DEFENSIVE LAYER 2 - CIRCUIT BREAKER CHECK
      // ========================================================================
      console.log('[STEP 7 DEFENSIVE] Layer 2: Checking circuit breaker state');
      
      const circuitCheck = this.checkCircuitBreaker();
      if (!circuitCheck.allowed) {
        console.error('[STEP 7 DEFENSIVE] Circuit breaker blocked operation:', circuitCheck.reason);
        result.errors.push('Circuit breaker protection active');
        result.errors.push(circuitCheck.reason || 'Service temporarily unavailable');
        return result;
      }
      
      console.log('[STEP 7 DEFENSIVE] Circuit breaker allows operation');
      
      // ========================================================================
      // STEP 7: DEFENSIVE LAYER 3 - RESOURCE PROTECTION
      // ========================================================================
      console.log('[STEP 7 DEFENSIVE] Layer 3: Acquiring operation slot');
      
      const slotAcquisition = await this.acquireOperationSlot();
      if (!slotAcquisition.acquired) {
        console.error('[STEP 7 DEFENSIVE] Resource protection blocked operation:', slotAcquisition.reason);
        result.errors.push('Resource protection active');
        result.errors.push(slotAcquisition.reason || 'System at capacity');
        return result;
      }
      
      operationSlotAcquired = true;
      console.log('[STEP 7 DEFENSIVE] Resource slot acquired successfully');
      
      // ========================================================================
      // STEP 7: DEFENSIVE LAYER 4 - TIMEOUT WRAPPER
      // ========================================================================
      console.log('[STEP 7 DEFENSIVE] Layer 4: Starting transaction with timeout protection');
      
      const transactionPromise = this.executeDefensiveTransaction(sanitizedContext, result);
      const timeoutPromise = new Promise<TransactionResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Transaction timeout after ${PaypalTransactionOrchestrator.MAX_PROCESSING_TIME_MS / 1000} seconds`));
        }, PaypalTransactionOrchestrator.MAX_PROCESSING_TIME_MS);
      });
      
      // Race between transaction completion and timeout
      const finalResult = await Promise.race([transactionPromise, timeoutPromise]);
      
      // ========================================================================
      // STEP 7: DEFENSIVE LAYER 5 - CIRCUIT BREAKER RECORDING
      // ========================================================================
      this.recordCircuitBreakerResult(finalResult.success);
      
      const processingDuration = new Date().getTime() - processingStartTime.getTime();
      console.log(`[STEP 7 DEFENSIVE] Transaction completed in ${processingDuration}ms - Success: ${finalResult.success}`);
      
      return finalResult;

    } catch (error) {
      console.error('[STEP 7 DEFENSIVE] Critical defensive error:', error);
      
      // Record failure in circuit breaker
      this.recordCircuitBreakerResult(false);
      
      result.errors.push(`Defensive orchestrator error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Attempt emergency rollback if Phase 1 succeeded
      if (result.phase1.success) {
        try {
          console.log('[STEP 7 DEFENSIVE] Attempting emergency rollback');
          await Promise.race([
            this.performRollback(result.phase1),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Rollback timeout')), PaypalTransactionOrchestrator.ROLLBACK_TIMEOUT_MS))
          ]);
          result.rollbackPerformed = true;
          console.log('[STEP 7 DEFENSIVE] Emergency rollback completed');
        } catch (rollbackError) {
          console.error('[STEP 7 DEFENSIVE] Emergency rollback failed:', rollbackError);
          result.errors.push(`Emergency rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }
      
      return result;
      
    } finally {
      // ========================================================================
      // STEP 7: DEFENSIVE CLEANUP - ALWAYS EXECUTED
      // ========================================================================
      if (operationSlotAcquired) {
        this.releaseOperationSlot();
      }
      
      const totalDuration = new Date().getTime() - processingStartTime.getTime();
      console.log(`[STEP 7 DEFENSIVE] Defensive orchestrator cleanup completed - Total duration: ${totalDuration}ms`);
    }
  }
  
  /**
   * Core transaction logic wrapped with defensive timeout handling
   */
  private async executeDefensiveTransaction(context: TransactionContext, result: TransactionResult): Promise<TransactionResult> {
    console.log(`[STEP 7 DEFENSIVE] Starting core transaction for ${context.recipients.length} recipients`);
    
    try {
      // ========================================================================
      // PHASE 1: PREPARE - Create Intent and Validate (with timeout)
      // ========================================================================
      console.log('[STEP 7 DEFENSIVE] PHASE 1: Starting preparation phase with timeout protection');
      
      const phase1Promise = this.executePhase1(context);
      const phase1TimeoutPromise = new Promise<Phase1Result>((_, reject) => {
        setTimeout(() => reject(new Error('Phase 1 timeout')), PaypalTransactionOrchestrator.PHASE1_TIMEOUT_MS);
      });
      
      result.phase1 = await Promise.race([phase1Promise, phase1TimeoutPromise]);
      
      if (!result.phase1.success) {
        console.error('[STEP 7 DEFENSIVE] Phase 1 failed, aborting transaction');
        result.errors.push('Phase 1 preparation failed');
        result.errors.push(...result.phase1.errors);
        return result;
      }

      console.log(`[STEP 7 DEFENSIVE] Phase 1 completed successfully - Batch ID: ${result.phase1.batchId}`);

      // ========================================================================
      // PHASE 2: COMMIT - Execute PayPal API and Update Database (with timeout)
      // ========================================================================
      console.log('[STEP 7 DEFENSIVE] PHASE 2: Starting execution phase with timeout protection');
      
      const phase2Promise = this.executePhase2(result.phase1);
      const phase2TimeoutPromise = new Promise<Phase2Result>((_, reject) => {
        setTimeout(() => reject(new Error('Phase 2 timeout')), PaypalTransactionOrchestrator.PHASE2_TIMEOUT_MS);
      });
      
      result.phase2 = await Promise.race([phase2Promise, phase2TimeoutPromise]);
      
      if (!result.phase2.success) {
        console.error('[STEP 7 DEFENSIVE] Phase 2 failed, performing defensive rollback');
        
        // Defensive rollback with timeout
        const rollbackPromise = this.performRollback(result.phase1);
        const rollbackTimeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Rollback timeout')), PaypalTransactionOrchestrator.ROLLBACK_TIMEOUT_MS);
        });
        
        try {
          await Promise.race([rollbackPromise, rollbackTimeoutPromise]);
          result.rollbackPerformed = true;
          console.log('[STEP 7 DEFENSIVE] Defensive rollback completed');
        } catch (rollbackError) {
          console.error('[STEP 7 DEFENSIVE] Defensive rollback failed:', rollbackError);
          result.errors.push(`Defensive rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
        
        result.errors.push('Phase 2 execution failed, defensive rollback performed');
        result.errors.push(...result.phase2.errors);
        return result;
      }

      console.log(`[STEP 7 DEFENSIVE] Phase 2 completed successfully - PayPal Batch ID: ${result.phase2.paypalBatchId}`);

      // ========================================================================
      // TRANSACTION SUCCESS
      // ========================================================================
      result.success = true;
      console.log(`[STEP 7 DEFENSIVE] Defensive transaction completed successfully`);
      console.log(`[STEP 7 DEFENSIVE] Results: ${result.phase2.successfulCount} successful, ${result.phase2.failedCount} failed, ${result.phase2.pendingCount} pending`);

      return result;

    } catch (error) {
      console.error('[STEP 7 DEFENSIVE] Core transaction error:', error);
      result.errors.push(`Core transaction error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  // ============================================================================
  // STEP 6: RE-RUN PREVENTION & RETRY LOGIC METHODS
  // ============================================================================

  /**
   * Enhanced transaction execution with automatic retry for existing batches
   */
  async retryTransaction(batchId: number, overridePolicy?: RetryPolicy): Promise<TransactionResult> {
    console.log(`[STEP 6 ORCHESTRATOR] Retrying transaction for batch ${batchId}`);
    
    try {
      // Get existing batch and validate retry eligibility  
      const batch = await storage.getPayoutBatch(batchId);
      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      // Check retry eligibility
      const retryCheck = await this.checkRetryEligibility(batch);
      if (!retryCheck.eligible) {
        throw new Error(`Retry not eligible: ${retryCheck.reason}`);
      }

      // Reconstruct transaction context from batch data
      const context = await this.reconstructTransactionContext(batch);
      
      // Execute with retry logic
      return await this.executeTransactionWithRetry(context, overridePolicy);

    } catch (error) {
      console.error('[STEP 6 ORCHESTRATOR] Retry transaction error:', error);
      return {
        success: false,
        phase1: {
          success: false,
          senderBatchId: '',
          requestChecksum: '',
          paypalPayload: null,
          itemIds: [],
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: []
        },
        rollbackPerformed: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }

  /**
   * Enhanced executeTransaction with comprehensive retry logic
   */
  async executeTransactionWithRetry(context: TransactionContext, retryPolicy?: RetryPolicy): Promise<TransactionResult> {
    const policy = retryPolicy || PaypalTransactionOrchestrator.DEFAULT_RETRY_POLICY;
    console.log(`[STEP 6 ORCHESTRATOR] Starting transaction with retry policy - max retries: ${policy.maxRetries}`);
    
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
      // Check re-run prevention
      const preventionCheck = await this.checkRerunPrevention(context);
      if (preventionCheck.prevented) {
        result.errors.push(`Re-run prevented: ${preventionCheck.reason}`);
        return result;
      }

      // Acquire processing lock
      const lockAcquired = await this.acquireProcessingLock(context);
      if (!lockAcquired) {
        result.errors.push('Could not acquire processing lock - another transaction may be in progress');
        return result;
      }

      try {
        // Execute Phase 1
        result.phase1 = await this.executePhase1(context);
        
        if (!result.phase1.success) {
          result.errors.push('Phase 1 preparation failed');
          result.errors.push(...result.phase1.errors);
          return result;
        }

        // Execute Phase 2 with retry logic
        result.phase2 = await this.executePhase2WithRetry(result.phase1, policy);
        
        if (!result.phase2.success) {
          await this.performRollback(result.phase1);
          result.rollbackPerformed = true;
          result.errors.push('Phase 2 execution failed after all retry attempts');
          result.errors.push(...result.phase2.errors);
          return result;
        }

        result.success = true;
        return result;

      } finally {
        await this.releaseProcessingLock(context);
      }

    } catch (error) {
      console.error('[STEP 6 ORCHESTRATOR] Critical transaction error:', error);
      result.errors.push(`Critical transaction error: ${error instanceof Error ? error.message : String(error)}`);
      
      if (result.phase1.success) {
        try {
          await this.performRollback(result.phase1);
          result.rollbackPerformed = true;
        } catch (rollbackError) {
          console.error('[STEP 6 ORCHESTRATOR] Rollback failed:', rollbackError);
        }
      }
      
      return result;
    }
  }

  /**
   * Enhanced Phase 2 execution with intelligent retry logic
   */
  private async executePhase2WithRetry(phase1Result: Phase1Result, policy: RetryPolicy): Promise<Phase2Result> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= policy.maxRetries + 1; attempt++) {
      console.log(`[STEP 6 PHASE 2] Attempt ${attempt}/${policy.maxRetries + 1}`);
      
      try {
        // Record retry attempt if not first attempt
        if (attempt > 1) {
          await this.recordRetryAttempt(phase1Result.batchId!, attempt, lastError);
        }

        // Execute Phase 2
        const result = await this.executePhase2(phase1Result);
        
        if (result.success) {
          console.log(`[STEP 6 PHASE 2] Attempt ${attempt} succeeded`);
          return result;
        }

        // Check if error is retryable
        const errorAnalysis = this.analyzeError(result.errors, policy);
        if (!errorAnalysis.retryable || attempt > policy.maxRetries) {
          console.log(`[STEP 6 PHASE 2] Error not retryable or max attempts reached`);
          return result;
        }

        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt - 1, policy);
        console.log(`[STEP 6 PHASE 2] Waiting ${delay}ms before retry attempt ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));

        lastError = new Error(result.errors.join('; '));

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const errorAnalysis = this.analyzeError([lastError.message], policy);
        if (!errorAnalysis.retryable || attempt > policy.maxRetries) {
          console.log(`[STEP 6 PHASE 2] Critical error not retryable or max attempts reached`);
          return {
            success: false,
            batchId: phase1Result.batchId!,
            processedCount: 0,
            successfulCount: 0,
            failedCount: 0,
            pendingCount: 0,
            userRewardsCreated: 0,
            cycleCompleted: false,
            errors: [`Attempt ${attempt} failed: ${lastError.message}`]
          };
        }

        const delay = this.calculateRetryDelay(attempt - 1, policy);
        console.log(`[STEP 6 PHASE 2] Waiting ${delay}ms before retry attempt ${attempt + 1} due to error: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All attempts failed
    return {
      success: false,
      batchId: phase1Result.batchId!,
      processedCount: 0,
      successfulCount: 0,
      failedCount: 0,
      pendingCount: 0,
      userRewardsCreated: 0,
      cycleCompleted: false,
      errors: [`All ${policy.maxRetries + 1} attempts failed. Last error: ${lastError?.message || 'Unknown error'}`]
    };
  }

  /**
   * Check for re-run prevention conditions
   */
  private async checkRerunPrevention(context: TransactionContext): Promise<{
    prevented: boolean;
    reason?: string;
  }> {
    try {
      // HOTFIX STEP 3: Remove duplicate check from prevention - only check in executePhase1
      // The duplicate check needs the computed checksum, which isn't available here.
      // Duplicate prevention is now handled in executePhase1 with proper status-aware logic.

      // Check for recent processing activity (cooldown period)
      const recentActivity = await this.checkRecentProcessingActivity(context.cycleSettingId);
      if (recentActivity.withinCooldown) {
        return {
          prevented: true,
          reason: `Processing cooldown active - last activity: ${recentActivity.lastActivity}`
        };
      }

      // Check for concurrent processing locks
      const lockStatus = await this.checkExistingLocks(context.cycleSettingId);
      if (lockStatus.hasActiveLock) {
        return {
          prevented: true,
          reason: `Processing lock active - expires: ${lockStatus.lockExpiry}`
        };
      }

      return { prevented: false };

    } catch (error) {
      console.error('[STEP 6 PREVENTION] Re-run prevention check failed:', error);
      // On error, allow processing but log warning
      return { prevented: false };
    }
  }

  /**
   * Acquire processing lock to prevent concurrent execution
   */
  private async acquireProcessingLock(context: TransactionContext): Promise<boolean> {
    try {
      const lockKey = `cycle_${context.cycleSettingId}_processing`;
      const lockExpiry = new Date(Date.now() + PaypalTransactionOrchestrator.PROCESSING_LOCK_DURATION_MS);
      
      return await storage.acquireProcessingLock(lockKey, lockExpiry);
    } catch (error) {
      console.error('[STEP 6 LOCK] Failed to acquire processing lock:', error);
      return false;
    }
  }

  /**
   * Release processing lock
   */
  private async releaseProcessingLock(context: TransactionContext): Promise<void> {
    try {
      const lockKey = `cycle_${context.cycleSettingId}_processing`;
      await storage.releaseProcessingLock(lockKey);
    } catch (error) {
      console.error('[STEP 6 LOCK] Failed to release processing lock:', error);
      // Don't throw - this is cleanup
    }
  }

  // ============================================================================
  // STEP 6: HELPER METHODS FOR RETRY LOGIC AND PREVENTION
  // ============================================================================

  /**
   * Check if a batch is eligible for retry
   */
  private async checkRetryEligibility(batch: any): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    try {
      // Check batch status
      if (batch.status === 'completed') {
        return { eligible: false, reason: 'Batch already completed successfully' };
      }

      if (batch.status === 'processing') {
        return { eligible: false, reason: 'Batch currently processing' };
      }

      if (batch.status === 'cancelled') {
        return { eligible: false, reason: 'Batch was cancelled' };
      }

      // Check retry count (if stored)
      if (batch.retryCount && batch.retryCount >= PaypalTransactionOrchestrator.DEFAULT_RETRY_POLICY.maxRetries) {
        return { eligible: false, reason: 'Maximum retry attempts exceeded' };
      }

      // Check if batch was created too long ago (e.g., 24 hours)
      const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - batch.createdAt.getTime() > MAX_AGE_MS) {
        return { eligible: false, reason: 'Batch too old for retry' };
      }

      return { eligible: true };

    } catch (error) {
      console.error('[STEP 6 ELIGIBILITY] Retry eligibility check failed:', error);
      return { eligible: false, reason: 'Eligibility check failed' };
    }
  }

  /**
   * Reconstruct transaction context from batch data
   */
  private async reconstructTransactionContext(batch: any): Promise<TransactionContext> {
    try {
      // Get batch items to reconstruct recipients
      const batchItems = await storage.getPayoutBatchItems(batch.id);
      
      const recipients: PayoutRecipient[] = batchItems.map(item => ({
        cycleWinnerSelectionId: item.cycleWinnerSelectionId,
        userId: item.userId,
        paypalEmail: item.paypalEmail, // Fixed: use paypalEmail instead of recipientEmail
        amount: item.amount,
        currency: item.currency || 'USD',
        note: item.note || 'FinBoost monthly reward'
      }));

      return {
        cycleSettingId: batch.cycleSettingId || 1, // Fallback if not stored
        adminId: batch.adminId || 1, // Fallback if not stored  
        recipients,
        totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
        requestId: batch.requestChecksum || batch.senderBatchId,
        senderBatchId: batch.senderBatchId // Fixed: include required senderBatchId field
      };

    } catch (error) {
      console.error('[STEP 6 RECONSTRUCTION] Failed to reconstruct transaction context:', error);
      throw new Error(`Failed to reconstruct transaction context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Record retry attempt for auditing and tracking
   */
  private async recordRetryAttempt(batchId: number, attemptNumber: number, error: Error | null): Promise<void> {
    try {
      await storage.recordRetryAttempt(batchId, {
        attemptNumber,
        timestamp: new Date(),
        errorType: error?.name || 'Unknown',
        errorMessage: error?.message || 'No error details',
        recoverable: error ? this.isRecoverableError(error.message) : false
      });
    } catch (recordError) {
      console.error('[STEP 6 AUDIT] Failed to record retry attempt:', recordError);
      // Don't throw - this is auditing
    }
  }

  /**
   * Analyze error to determine if it's retryable
   */
  private analyzeError(errors: string[], policy: RetryPolicy): {
    retryable: boolean;
    errorType: string;
  } {
    const combinedError = errors.join(' ').toLowerCase();

    // Check if any error matches retryable patterns
    for (const retryablePattern of policy.retryableErrors) {
      if (combinedError.includes(retryablePattern.toLowerCase())) {
        return {
          retryable: true,
          errorType: retryablePattern
        };
      }
    }

    // Check for additional retryable patterns
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'rate limit',
      'service unavailable',
      'internal server error',
      '5xx'
    ];

    for (const pattern of retryablePatterns) {
      if (combinedError.includes(pattern)) {
        return {
          retryable: true,
          errorType: pattern
        };
      }
    }

    return {
      retryable: false,
      errorType: 'non-retryable'
    };
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attemptNumber: number, policy: RetryPolicy): number {
    const baseDelay = policy.baseDelayMs;
    const multiplier = policy.backoffMultiplier;
    const maxDelay = policy.maxDelayMs;

    // Calculate exponential backoff: baseDelay * (multiplier ^ attemptNumber)
    const calculatedDelay = baseDelay * Math.pow(multiplier, attemptNumber);
    
    // Add random jitter (±25%) to avoid thundering herd
    const jitter = calculatedDelay * 0.25 * (Math.random() - 0.5);
    const delayWithJitter = calculatedDelay + jitter;

    // Cap at maximum delay
    return Math.min(Math.max(delayWithJitter, baseDelay), maxDelay);
  }

  /**
   * Check if an error is recoverable
   */
  private isRecoverableError(errorMessage: string): boolean {
    const recoverablePatterns = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'rate limit',
      'service unavailable'
    ];

    const lowerError = errorMessage.toLowerCase();
    return recoverablePatterns.some(pattern => lowerError.includes(pattern));
  }

  /**
   * Check for recent processing activity within cooldown period
   */
  private async checkRecentProcessingActivity(cycleSettingId: number): Promise<{
    withinCooldown: boolean;
    lastActivity?: Date;
  }> {
    try {
      const recentBatches = await storage.getRecentPayoutBatches(
        cycleSettingId, 
        PaypalTransactionOrchestrator.RERUN_COOLDOWN_MS
      );

      if (recentBatches.length > 0) {
        const lastActivity = recentBatches[0].updatedAt || recentBatches[0].createdAt;
        return {
          withinCooldown: true,
          lastActivity
        };
      }

      return { withinCooldown: false };

    } catch (error) {
      console.error('[STEP 6 COOLDOWN] Recent activity check failed:', error);
      return { withinCooldown: false };
    }
  }

  /**
   * Check for existing processing locks
   */
  private async checkExistingLocks(cycleSettingId: number): Promise<{
    hasActiveLock: boolean;
    lockExpiry?: Date;
  }> {
    try {
      const lockKey = `cycle_${cycleSettingId}_processing`;
      const lockInfo = await storage.getProcessingLockInfo(lockKey);

      if (lockInfo && lockInfo.expiry > new Date()) {
        return {
          hasActiveLock: true,
          lockExpiry: lockInfo.expiry
        };
      }

      return { hasActiveLock: false };

    } catch (error) {
      console.error('[STEP 6 LOCK] Lock check failed:', error);
      return { hasActiveLock: false };
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

      // PHASE 1 STEP 3: Concurrency Guard + Advisory Locks
      console.log('[STEP 3 CONCURRENCY] Acquiring advisory lock for cycle', context.cycleSettingId);
      const lockAcquired = await this.acquireCycleAdvisoryLock(context.cycleSettingId);
      if (!lockAcquired) {
        result.errors.push('concurrent_disbursement_in_progress');
        console.error('[STEP 3 CONCURRENCY] Failed to acquire lock - concurrent disbursement already running');
        return result;
      }
      console.log('[STEP 3 CONCURRENCY] Advisory lock acquired successfully');

      // Step 1.1: Validate business rules and prerequisites  
      const validationResult = this.validateTransactionContext(context);
      if (!validationResult.valid) {
        result.errors.push(...validationResult.errors);
        return result;
      }
      // Use sanitized context for further processing
      const sanitizedContext = validationResult.sanitized || context;

      // PHASE 1 STEP 1: CHATGPT Preflight validation - hard filter for malformed recipients
      console.log(`[STEP 1 PREFLIGHT] Starting preflight validation for ${sanitizedContext.recipients.length} recipients`);
      
      const malformed: { 
        index: number; 
        userId: number; 
        cycleWinnerSelectionId: number; 
        paypalEmail: any; 
        amount: number; 
        reason: string;
      }[] = [];

      const validRecipients = sanitizedContext.recipients.filter((r, idx) => {
        // CHATGPT STEP 3: Use enhanced validation methods
        const emailValidation = this.validatePayPalEmail(r.paypalEmail);
        const amountValidation = this.validatePayoutAmount(r.amount);
        
        if (!emailValidation.isValid || !amountValidation.isValid) {
          const reasons = [];
          if (!emailValidation.isValid) reasons.push(emailValidation.reason || 'email_invalid');
          if (!amountValidation.isValid) reasons.push(amountValidation.reason || 'amount_invalid');
          
          malformed.push({
            index: idx,
            userId: r.userId,
            cycleWinnerSelectionId: r.cycleWinnerSelectionId,
            paypalEmail: r.paypalEmail,
            amount: r.amount,
            reason: reasons.join(', ')
          });
          return false;
        }
        return true;
      });

      // CHATGPT PHASE 1 STEP 4: Comprehensive Error Classification and Logging
      if (malformed.length > 0) {
        console.error(`[STEP 1 PREFLIGHT] FAILED - Found ${malformed.length} malformed recipients`);
        
        // STEP 4: Classify errors by type for better debugging
        const errorClassification = this.classifyValidationErrors(malformed);
        console.error('[STEP 4 ERROR CLASSIFICATION]', errorClassification.summary);
        
        // STEP 4: Structure error response with classification
        result.errors.push('preflight_validation_failed');
        result.errors.push(`malformed_recipients_count=${malformed.length}`);
        result.errors.push(`error_types=${JSON.stringify(errorClassification.errorTypes)}`);
        
        // STEP 4: Provide actionable error details
        result.warnings.push(
          `validation_report=${JSON.stringify({
            totalRejected: malformed.length,
            totalValid: validRecipients.length,
            errorBreakdown: errorClassification.breakdown,
            sampleErrors: malformed.slice(0, 5)
          })}`
        );
        
        // STEP 4: Enhanced logging for operational debugging
        console.error('[STEP 4 VALIDATION REPORT] Error breakdown:', errorClassification.breakdown);
        console.error('[STEP 4 VALIDATION REPORT] Sample rejected recipients:', malformed.slice(0, 5));
        
        return result;
      }

      // CHATGPT: Create safeContext with only valid recipients - use this for ALL subsequent operations
      const safeContext: TransactionContext = { ...sanitizedContext, recipients: validRecipients };
      console.log(`[STEP 1 PREFLIGHT] SUCCESS - ${validRecipients.length} recipients passed validation`);

      // PHASE 1 STEP 2: CHATGPT Single Database Transaction Boundary - BEGIN TRANSACTION
      console.log('[STEP 2 TRANSACTION] Starting atomic transaction for Phase 1 operations');
      
      const transactionResult = await db.transaction(async (tx) => {
        console.log('[STEP 2 TRANSACTION] Inside transaction scope');

        // Step 1.2: Generate idempotency safeguards (CHATGPT: Use safeContext)
        const idempotencyData = this.generateIdempotencyData(safeContext);
      result.senderBatchId = idempotencyData.senderBatchId;
      result.requestChecksum = idempotencyData.requestChecksum;

      // Step 1.3: Check for duplicate transactions with status-aware handling
      // HOTFIX STEP 1: Use consistent cycleId + requestChecksum parameters (CHATGPT: Use safeContext)
      const duplicateCheck = await this.checkForDuplicateTransaction(safeContext.cycleSettingId, result.requestChecksum);
      if (duplicateCheck.isDuplicate) {
        console.log(`[IDEMPOTENCY] Duplicate check result: action=${duplicateCheck.action}, reason=${duplicateCheck.reason}`);
        
        // Handle different duplicate scenarios
        if (duplicateCheck.action === 'return_existing') {
          // TODO: Return existing batch summary instead of failing
          result.errors.push(`Idempotent return: ${duplicateCheck.reason}`);
          return result;
        } else if (duplicateCheck.action === 'block_in_progress') {
          result.errors.push(`Concurrent processing blocked: ${duplicateCheck.reason}`);
          return result;
        }
        // For 'allow_retry': continue processing (create new attempt)
        console.log(`[IDEMPOTENCY] Retry allowed for ${duplicateCheck.existingBatch?.status} batch - creating new attempt`);
      }

      // PHASE 2 STEP 5: Transition winners to pending_disbursement state
      console.log('[STEP 5 STATE MACHINE] Transitioning winners to pending_disbursement');
      const winnerStateUpdates = safeContext.recipients.map(recipient => ({
        winnerId: recipient.cycleWinnerSelectionId,
        newState: 'pending_disbursement',
        adminId: safeContext.adminId,
        reason: 'Disbursement batch processing started',
        metadata: { phase: 'phase1_preparation' }
      }));

      const { default: WinnerStateMachine } = await import('./winner-state-machine.js');
      const stateTransitionResult = await WinnerStateMachine.batchTransitionState(winnerStateUpdates);
      
      if (!stateTransitionResult.success || stateTransitionResult.failureCount > 0) {
        console.warn(`[STEP 5 STATE MACHINE] State transition warnings: ${stateTransitionResult.failureCount} failures`);
        result.warnings.push(`winner_state_transitions_partial_success=${stateTransitionResult.successCount}/${winnerStateUpdates.length}`);
      } else {
        console.log(`[STEP 5 STATE MACHINE] Successfully transitioned ${stateTransitionResult.successCount} winners to pending_disbursement`);
      }

      // Step 1.4: Create payout batch intent with proper attempt handling (CHATGPT: Use safeContext)
      const nextAttempt = await this.findNextAttemptNumber(safeContext.cycleSettingId, result.requestChecksum);
      const attemptSenderBatchId = this.generateAttemptSenderBatchId(result.senderBatchId, nextAttempt);
      
      const batchData: InsertPayoutBatch = {
        cycleSettingId: safeContext.cycleSettingId, // CHATGPT: Use safeContext
        senderBatchId: attemptSenderBatchId, // CHATGPT: Include attempt number in sender_batch_id
        requestChecksum: result.requestChecksum,
        attempt: nextAttempt, // CHATGPT: Track attempt number
        adminId: safeContext.adminId, // CHATGPT: Use safeContext
        totalAmount: safeContext.totalAmount, // CHATGPT: Use safeContext
        totalRecipients: safeContext.recipients.length // CHATGPT: Use safeContext (filtered count)
      };

      const createdBatch = await storage.createPayoutBatchWithAttempt(batchData);
      result.batchId = createdBatch.id;
      result.senderBatchId = attemptSenderBatchId; // Update result with final sender_batch_id
      console.log(`[STEP 4 PHASE 1] Created payout batch intent: ${result.batchId}, attempt ${nextAttempt}`);

      // Step 1.5: Create payout batch items (CHATGPT: Use safeContext with validated recipients)
      const itemIds: number[] = [];
      for (const recipient of safeContext.recipients) {
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

      // Step 1.6: Prepare PayPal API payload (CHATGPT: Use safeContext)
      result.paypalPayload = this.preparePaypalPayload(safeContext, result.senderBatchId);
      
      // STEP 4: Store payload checksum data for replay safety
      const checksumData = this.generatePayloadChecksum(result.paypalPayload.items);
      result.expectedItemCount = checksumData.itemCount;
      result.payloadChecksum = checksumData.checksum;
      
      // Update batch record with checksum data for replay safety validation (Note: fields may not exist in schema yet)
      console.log(`[STEP 4 CHECKSUM] Storing checksum data - count: ${result.expectedItemCount}, checksum: ${result.payloadChecksum}`);

      // Step 1.7: Final validation of prepared data
      const finalValidation = this.validatePreparedData(result);
      if (!finalValidation.isValid) {
        result.errors.push(...finalValidation.errors);
        return result;
      }

        result.success = true;
        console.log('[STEP 2 TRANSACTION] Transaction completed successfully');
        return result;
      }); // CHATGPT: End of transaction block

      console.log('[STEP 4 PHASE 1] Phase 1 preparation completed successfully');
      return transactionResult;

    } catch (error) {
      console.error('[STEP 4 PHASE 1] Phase 1 error:', error);
      result.errors.push(`Phase 1 error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    } finally {
      // STEP 3: Always release advisory lock
      await this.releaseCycleAdvisoryLock(context.cycleSettingId);
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

      // PHASE 2 STEP 5: Transition winners to processing_disbursement state
      console.log('[STEP 5 STATE MACHINE] Transitioning winners to processing_disbursement');
      const batchItems = await storage.getPayoutBatchItems(result.batchId);
      const processingStateUpdates = batchItems.map(item => ({
        winnerId: item.cycleWinnerSelectionId,
        newState: 'processing_disbursement',
        reason: 'PayPal API processing initiated',
        metadata: { 
          batchId: result.batchId,
          paypalBatchId: phase1Result.senderBatchId,
          phase: 'phase2_paypal_execution'
        }
      }));

      const { default: WinnerStateMachine } = await import('./winner-state-machine.js');
      const processingTransitionResult = await WinnerStateMachine.batchTransitionState(processingStateUpdates);
      
      if (processingTransitionResult.failureCount > 0) {
        console.warn(`[STEP 5 STATE MACHINE] Processing state transition warnings: ${processingTransitionResult.failureCount} failures`);
      } else {
        console.log(`[STEP 5 STATE MACHINE] Successfully transitioned ${processingTransitionResult.successCount} winners to processing_disbursement`);
      }

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

      // PHASE 2 STEP 5: Update winner states based on PayPal individual results
      console.log('[STEP 5 STATE MACHINE] Updating winner states based on PayPal results');
      await this.updateWinnerStatesFromPayPalResults(result.batchId, parsedResponse, batchItems);

      result.success = true;
      console.log('[STEP 4 PHASE 2] Phase 2 execution completed successfully');
      
      return result;

    } catch (error) {
      console.error('[STEP 4 PHASE 2] Phase 2 error:', error);
      result.errors.push(`Phase 2 error: ${error instanceof Error ? error.message : String(error)}`);
      
      // PHASE 2 STEP 5: Transition winners to disbursement_failed on Phase 2 error
      console.log('[STEP 5 STATE MACHINE] Transitioning winners to disbursement_failed due to Phase 2 error');
      try {
        const batchItems = await storage.getPayoutBatchItems(result.batchId);
        const failureStateUpdates = batchItems.map(item => ({
          winnerId: item.cycleWinnerSelectionId,
          newState: 'disbursement_failed',
          reason: `Phase 2 processing error: ${error instanceof Error ? error.message : String(error)}`,
          metadata: { 
            batchId: result.batchId,
            phase: 'phase2_error',
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
          },
          failureReason: error instanceof Error ? error.message : String(error)
        }));

        const { default: WinnerStateMachine } = await import('./winner-state-machine.js');
        await WinnerStateMachine.batchTransitionState(failureStateUpdates);
      } catch (stateUpdateError) {
        console.error('[STEP 5 STATE MACHINE] Failed to update winner states on Phase 2 error:', stateUpdateError);
      }
      
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

  private generateIdempotencyData(context: TransactionContext): {
    senderBatchId: string;
    requestChecksum: string;
  } {
    // CHATGPT: Create checksum from normalized request data for idempotency
    const checksumData = {
      cycleSettingId: context.cycleSettingId,
      adminId: context.adminId,
      totalAmount: context.totalAmount,
      recipientCount: context.recipients.length,
      // CHATGPT: Normalize emails - lowercase and trim for consistency
      recipientEmails: context.recipients.map(r => r.paypalEmail.toLowerCase().trim()).sort(),
      requestId: context.requestId
    };
    
    const requestChecksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(checksumData))
      .digest('hex');

    // CHATGPT: Generate deterministic sender_batch_id WITHOUT attempt number (will be added later)
    const baseSenderBatchId = `cycle-${context.cycleSettingId}-${requestChecksum.slice(0, 16)}`;

    return { 
      senderBatchId: baseSenderBatchId, // This will be the base - attempt number added in createBatchWithAttempt
      requestChecksum 
    };
  }

  /**
   * CHATGPT: Create retry-safe sender_batch_id with attempt number
   */
  private generateAttemptSenderBatchId(baseSenderBatchId: string, attempt: number): string {
    return `${baseSenderBatchId}-attempt-${attempt}`;
  }

  /**
   * CHATGPT: Find next available attempt number for retry
   */
  private async findNextAttemptNumber(cycleId: number, requestChecksum: string): Promise<number> {
    try {
      // Find the highest existing attempt number for this checksum
      const existingBatches = await storage.getPayoutBatchesByChecksum(cycleId, requestChecksum);
      const maxAttempt = Math.max(...existingBatches.map(b => b.attempt || 1), 0);
      return maxAttempt + 1;
    } catch (error) {
      console.warn('[ATTEMPT] Failed to find next attempt number, defaulting to 1:', error);
      return 1;
    }
  }

  private async checkForDuplicateTransaction(cycleId: number, requestChecksum: string): Promise<{
    isDuplicate: boolean;
    existingBatchId?: string;
    action?: 'allow_retry' | 'return_existing' | 'block_in_progress';
    existingBatch?: any;
    reason?: string;
  }> {
    try {
      // HOTFIX STEP 2: Update function signature to include cycleId
      const existingBatch = await storage.getPayoutBatchByChecksum(cycleId, requestChecksum);
      
      if (!existingBatch) {
        return { isDuplicate: false };
      }
      
      // CHATGPT FIX: Status-aware idempotency logic
      console.log(`[IDEMPOTENCY] Found existing batch ID ${existingBatch.id} with status: ${existingBatch.status}`);
      
      switch (existingBatch.status) {
        // Terminal success states - return existing summary (idempotent)
        case 'completed':
        case 'partially_completed':
        case 'awaiting_reconcile':
          return {
            isDuplicate: true,
            existingBatchId: existingBatch.senderBatchId,
            action: 'return_existing',
            existingBatch,
            reason: `Batch already ${existingBatch.status} - returning existing result`
          };
        
        // Active processing - block concurrent requests
        case 'processing':
        case 'executing':
          return {
            isDuplicate: true,
            existingBatchId: existingBatch.senderBatchId,
            action: 'block_in_progress',
            existingBatch,
            reason: `Batch currently ${existingBatch.status} - blocking concurrent request`
          };
        
        // Failed states - allow retry with new attempt
        case 'failed':
        case 'cancelled':
        case 'draft':
        case 'intent_only':
        default:
          console.log(`[IDEMPOTENCY] Allowing retry for ${existingBatch.status} batch - creating new attempt`);
          return {
            isDuplicate: false,
            action: 'allow_retry',
            existingBatch,
            reason: `Previous batch ${existingBatch.status} - retry allowed`
          };
      }
      
    } catch (error) {
      console.warn('[STEP 4 ORCHESTRATOR] Duplicate check failed, proceeding:', error);
      return { isDuplicate: false };
    }
  }

  private preparePaypalPayload(context: TransactionContext, senderBatchId: string): any {
    // PHASE 1 STEP 4: Enhanced Payload Validation + Replay Safety
    console.log('[STEP 4 PAYLOAD] Starting enhanced payload preparation');
    
    // STEP 4: Self-defensive filtering (redundant protection)
    const validatedRecipients = context.recipients.filter((recipient, index) => {
      // Enhanced email validation with placeholder rejection
      if (!this.isValidPayoutEmail(recipient.paypalEmail)) {
        console.error(`[STEP 4 PAYLOAD] Invalid email filtered: ${this.maskEmail(recipient.paypalEmail)}`);
        return false;
      }
      
      // Amount validation
      if (!recipient.amount || recipient.amount <= 0) {
        console.error(`[STEP 4 PAYLOAD] Invalid amount filtered: ${recipient.amount} for user ${recipient.userId}`);
        return false;
      }
      
      return true;
    });

    if (validatedRecipients.length === 0) {
      throw new Error('preparePaypalPayload_no_valid_items');
    }

    // STEP 4: Generate payload with normalized data
    const payloadItems = validatedRecipients.map((recipient, index) => {
      // STEP 4: Normalize emails (trim, lowercase)
      const normalizedEmail = recipient.paypalEmail.trim().toLowerCase();
      
      const senderItemId = `winner-${recipient.cycleWinnerSelectionId}-${recipient.userId}`;
      
      return {
        recipient_type: "EMAIL",
        amount: {
          value: (recipient.amount / 100).toFixed(2), // Convert cents to dollars
          currency: recipient.currency
        },
        receiver: normalizedEmail,
        note: recipient.note || "FinBoost monthly reward",
        sender_item_id: senderItemId
      };
    });

    const payload = {
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: "FinBoost Reward Payout",
        email_message: "You have received a reward payout from FinBoost!"
      },
      items: payloadItems
    };

    // STEP 4: Generate payload checksum for replay safety
    const checksumData = this.generatePayloadChecksum(payloadItems);
    console.log(`[STEP 4 PAYLOAD] Generated checksum: ${checksumData.checksum}, expected count: ${checksumData.itemCount}`);
    
    // STEP 4: PII-safe logging
    console.log(`[STEP 4 PAYLOAD] Payload prepared with ${payloadItems.length} items`);
    console.log(`[STEP 4 PAYLOAD] Sample receivers: ${payloadItems.slice(0, 3).map(item => this.maskEmail(item.receiver)).join(', ')}`);

    return payload;
  }

  /**
   * STEP 4: Enhanced email validation with placeholder rejection
   */
  private isValidPayoutEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    const trimmed = email.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > 254) return false; // RFC standard
    if (!trimmed.includes('@')) return false;
    
    // STEP 4: Reject obvious placeholders
    const placeholderPatterns = [
      /^test@/i,
      /^none@/i, 
      /^noreply@/i,
      /^placeholder@/i,
      /^example@/i
    ];
    
    return !placeholderPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * STEP 4: Generate payload checksum for replay safety validation
   */
  private generatePayloadChecksum(items: any[]): { checksum: string; itemCount: number } {
    // STEP 4: Sort data for deterministic checksum
    const sortedItems = items
      .map(item => `${item.receiver}|${item.amount.value}|${item.amount.currency}|${item.sender_item_id}`)
      .sort()
      .join('::');
    
    const checksum = crypto.createHash('sha256').update(sortedItems).digest('hex').substring(0, 16);
    
    return {
      checksum,
      itemCount: items.length
    };
  }

  /**
   * STEP 4: Mask emails for PII-safe logging
   */
  private maskEmail(email: string): string {
    if (!email || typeof email !== 'string') return 'invalid_email';
    
    const parts = email.split('@');
    if (parts.length !== 2) return 'malformed_email';
    
    const localPart = parts[0];
    const domain = parts[1];
    
    if (localPart.length <= 3) {
      return `${localPart.charAt(0)}***@${domain}`;
    }
    
    return `${localPart.substring(0, 2)}***@${domain}`;
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
        // PHASE 2 STEP 5: Transition winners to disbursement_cancelled state
        console.log('[STEP 5 STATE MACHINE] Transitioning winners to disbursement_cancelled due to rollback');
        try {
          const batchItems = await storage.getPayoutBatchItems(phase1Result.batchId);
          const rollbackStateUpdates = batchItems.map(item => ({
            winnerId: item.cycleWinnerSelectionId,
            newState: 'disbursement_cancelled',
            reason: 'Transaction rolled back due to Phase 2 failure',
            metadata: { 
              batchId: phase1Result.batchId,
              phase: 'rollback',
              rollbackReason: 'phase2_failure'
            }
          }));

          const { default: WinnerStateMachine } = await import('./winner-state-machine.js');
          const rollbackTransitionResult = await WinnerStateMachine.batchTransitionState(rollbackStateUpdates);
          
          if (rollbackTransitionResult.failureCount > 0) {
            console.warn(`[STEP 5 STATE MACHINE] Rollback state transition warnings: ${rollbackTransitionResult.failureCount} failures`);
          } else {
            console.log(`[STEP 5 STATE MACHINE] Successfully transitioned ${rollbackTransitionResult.successCount} winners to disbursement_cancelled`);
          }
        } catch (stateUpdateError) {
          console.error('[STEP 5 STATE MACHINE] Failed to update winner states during rollback:', stateUpdateError);
        }

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

  /**
   * PHASE 2 STEP 5: Update winner states based on individual PayPal results
   */
  private async updateWinnerStatesFromPayPalResults(
    batchId: number, 
    parsedResponse: any, 
    batchItems: any[]
  ): Promise<void> {
    console.log('[STEP 5 STATE MACHINE] Processing individual PayPal results for winner state updates');

    try {
      const { default: WinnerStateMachine } = await import('./winner-state-machine.js');
      const stateUpdates: any[] = [];

      // Process each item in the PayPal response
      if (parsedResponse.items && Array.isArray(parsedResponse.items)) {
        for (const paypalItem of parsedResponse.items) {
          // Find corresponding batch item
          const batchItem = batchItems.find(item => 
            paypalItem.payout_item?.sender_item_id?.includes(item.cycleWinnerSelectionId.toString())
          );

          if (!batchItem) {
            console.warn(`[STEP 5 STATE MACHINE] Could not find batch item for PayPal item: ${paypalItem.payout_item?.sender_item_id}`);
            continue;
          }

          // Determine new state based on PayPal transaction status
          let newState: string;
          let reason: string;
          let failureReason: string | undefined;

          switch (paypalItem.transaction_status?.toUpperCase()) {
            case 'SUCCESS':
              newState = 'disbursement_completed';
              reason = 'PayPal disbursement completed successfully';
              break;
            case 'FAILED':
            case 'DENIED':
            case 'BLOCKED':
              newState = 'disbursement_failed';
              reason = `PayPal disbursement failed: ${paypalItem.transaction_status}`;
              failureReason = paypalItem.errors?.map((e: any) => e.message).join('; ') || paypalItem.transaction_status;
              break;
            case 'PENDING':
            case 'UNCLAIMED':
            case 'RETURNED':
              // Keep in processing state, will be updated when final status is known
              console.log(`[STEP 5 STATE MACHINE] Keeping winner ${batchItem.cycleWinnerSelectionId} in processing_disbursement (status: ${paypalItem.transaction_status})`);
              continue;
            default:
              console.warn(`[STEP 5 STATE MACHINE] Unknown PayPal transaction status: ${paypalItem.transaction_status} for winner ${batchItem.cycleWinnerSelectionId}`);
              continue;
          }

          stateUpdates.push({
            winnerId: batchItem.cycleWinnerSelectionId,
            newState,
            reason,
            metadata: {
              batchId,
              paypalBatchId: parsedResponse.paypalBatchId,
              paypalItemId: paypalItem.payout_item_id,
              paypalStatus: paypalItem.transaction_status,
              phase: 'phase2_paypal_results'
            },
            paypalBatchId: parsedResponse.paypalBatchId,
            paypalItemId: paypalItem.payout_item_id,
            failureReason
          });
        }
      }

      // Execute state transitions
      if (stateUpdates.length > 0) {
        const transitionResult = await WinnerStateMachine.batchTransitionState(stateUpdates);
        
        console.log(`[STEP 5 STATE MACHINE] PayPal results processing: ${transitionResult.successCount} successful, ${transitionResult.failureCount} failed state transitions`);
        
        // Log successful completions and failures
        const completedCount = stateUpdates.filter(u => u.newState === 'disbursement_completed').length;
        const failedCount = stateUpdates.filter(u => u.newState === 'disbursement_failed').length;
        
        console.log(`[STEP 5 STATE MACHINE] Final disbursement results: ${completedCount} completed, ${failedCount} failed`);
      } else {
        console.log('[STEP 5 STATE MACHINE] No final state transitions needed from PayPal results');
      }

    } catch (error) {
      console.error('[STEP 5 STATE MACHINE] Error updating winner states from PayPal results:', error);
      // Don't throw - this is not critical enough to fail the entire transaction
    }
  }

  // ============================================================================
  // CHATGPT PHASE 1 STEP 3: Concurrency Guard + Advisory Locks
  // ============================================================================

  /**
   * STEP 3: Acquire PostgreSQL advisory lock to prevent concurrent disbursements per cycle
   */
  private async acquireCycleAdvisoryLock(cycleSettingId: number): Promise<boolean> {
    try {
      console.log('[STEP 3 ADVISORY LOCK] Attempting to acquire lock for cycle', cycleSettingId);
      
      // Use cycle ID as the advisory lock key
      const result = await db.execute(
        `SELECT pg_try_advisory_lock(${cycleSettingId}) as lock_acquired`
      );
      
      const lockAcquired = (result as any)[0]?.lock_acquired === true;
      
      if (lockAcquired) {
        console.log('[STEP 3 ADVISORY LOCK] Lock acquired successfully for cycle', cycleSettingId);
      } else {
        console.log('[STEP 3 ADVISORY LOCK] Lock already held by another process for cycle', cycleSettingId);
      }
      
      return lockAcquired;
    } catch (error) {
      console.error('[STEP 3 ADVISORY LOCK] Failed to acquire lock:', error);
      return false;
    }
  }

  /**
   * STEP 3: Release PostgreSQL advisory lock for cycle
   */
  private async releaseCycleAdvisoryLock(cycleSettingId: number): Promise<void> {
    try {
      console.log('[STEP 3 ADVISORY LOCK] Releasing lock for cycle', cycleSettingId);
      
      await db.execute(
        `SELECT pg_advisory_unlock(${cycleSettingId})`
      );
      
      console.log('[STEP 3 ADVISORY LOCK] Lock released successfully for cycle', cycleSettingId);
    } catch (error) {
      console.error('[STEP 3 ADVISORY LOCK] Failed to release lock:', error);
    }
  }

  // ============================================================================
  // CHATGPT PHASE 1 STEP 3: Enhanced Input Sanitization Methods
  // ============================================================================

  /**
   * STEP 3: Deep PayPal email validation beyond basic format checks
   */
  private validatePayPalEmail(email: string): { isValid: boolean; reason?: string } {
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, reason: 'invalid_email_format' };
    }

    // PayPal-specific validation rules
    if (email.length > 254) {
      return { isValid: false, reason: 'email_too_long' };
    }

    // Check for dangerous characters that could cause PayPal API issues
    const dangerousChars = /[<>'"&]/;
    if (dangerousChars.test(email)) {
      return { isValid: false, reason: 'email_contains_dangerous_chars' };
    }

    // Normalize whitespace issues
    if (email !== email.trim()) {
      return { isValid: false, reason: 'email_has_whitespace' };
    }

    return { isValid: true };
  }

  /**
   * STEP 3: Validate payout amounts against PayPal limits and business rules
   */
  private validatePayoutAmount(amount: number): { isValid: boolean; reason?: string } {
    // PayPal minimum payout (1 cent)
    if (amount < 1) {
      return { isValid: false, reason: 'amount_below_minimum' };
    }

    // PayPal maximum single payout ($10,000 = 1,000,000 cents)
    if (amount > 1000000) {
      return { isValid: false, reason: 'amount_above_maximum' };
    }

    // Check for fractional cents (should be whole numbers)
    if (!Number.isInteger(amount)) {
      return { isValid: false, reason: 'amount_not_integer_cents' };
    }

    // Sanity check for reasonable reward amounts (under $500)
    if (amount > 50000) {
      console.warn(`[VALIDATION] Large payout amount detected: ${amount} cents ($${amount/100})`);
    }

    return { isValid: true };
  }

  /**
   * STEP 4: Classify validation errors for comprehensive debugging
   */
  private classifyValidationErrors(malformed: any[]): {
    summary: string;
    errorTypes: string[];
    breakdown: Record<string, number>;
  } {
    const breakdown: Record<string, number> = {};
    const errorTypes = new Set<string>();

    malformed.forEach(item => {
      const reasons = item.reason.split(', ');
      reasons.forEach(reason => {
        errorTypes.add(reason);
        breakdown[reason] = (breakdown[reason] || 0) + 1;
      });
    });

    const sortedErrors = Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([error, count]) => `${error}(${count})`)
      .join(', ');

    return {
      summary: `${malformed.length} validation failures: ${sortedErrors}`,
      errorTypes: Array.from(errorTypes),
      breakdown
    };
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
    const finalRequestId = requestId || crypto.randomUUID();
    
    // Generate deterministic sender batch ID (from Gap 1 fix)
    const requestChecksum = crypto.createHash('sha256')
      .update(JSON.stringify({ cycleSettingId, recipients, totalAmount, requestId: finalRequestId }))
      .digest('hex');
    const senderBatchId = `cycle-${cycleSettingId}-${requestChecksum.slice(0, 16)}`;
    
    return {
      cycleSettingId,
      adminId,
      recipients,
      totalAmount,
      requestId: finalRequestId,
      senderBatchId // Fixed: include required senderBatchId field
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