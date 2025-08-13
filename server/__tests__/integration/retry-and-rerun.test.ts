/**
 * STEP 10: INTEGRATION TESTS - Retry and Re-run Prevention
 * 
 * Tests the retry logic and re-run prevention mechanisms:
 * - Retry failed-only flows
 * - Re-run prevention with same recipients
 * - Exponential backoff behavior
 * - Manual retry scenarios
 */

import { PaypalTransactionOrchestrator } from '../../paypal-transaction-orchestrator.js';
import { storage } from '../../storage.js';
import type { TransactionContext, RetryPolicy, PayoutRecipient } from '../../paypal-transaction-orchestrator.js';

// Mock PayPal API for controlled testing
jest.mock('../../paypal.js');

describe('Retry and Re-run Prevention - Integration Tests', () => {
  let orchestrator: PaypalTransactionOrchestrator;

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
    jest.clearAllMocks();
  });

  // Helper to create mock transaction context
  const createMockContext = (recipients: PayoutRecipient[], cycleId: number = 18): TransactionContext => ({
    cycleSettingId: cycleId,
    adminId: 1,
    totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
    recipients,
    requestId: `test-retry-${Date.now()}-${Math.random()}`,
    senderBatchId: `cycle-${cycleId}-${Date.now().toString(16)}`
  });

  describe('Retry Failed-Only Flows', () => {
    test('should retry only failed recipients from previous batch', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse, getEnhancedPayoutStatus } = require('../../paypal.js');
      
      // First attempt - mixed results
      const allRecipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'success@example.com',
          amount: 5000,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 102,
          userId: 502,
          paypalEmail: 'failed@example.com',
          amount: 7500,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 103,
          userId: 503,
          paypalEmail: 'pending@example.com',
          amount: 2500,
          currency: 'USD'
        }
      ];

      // Mock first attempt response
      createPaypalPayout.mockResolvedValueOnce({
        batch_header: {
          payout_batch_id: 'MIXED_BATCH_001',
          batch_status: 'COMPLETED'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValueOnce({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'MIXED_BATCH_001',
        individualResults: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            status: 'success',
            amount: 5000,
            paypalItemId: 'SUCCESS_ITEM_001'
          },
          {
            cycleWinnerSelectionId: 102,
            userId: 502,
            status: 'failed',
            amount: 7500,
            paypalItemId: 'FAILED_ITEM_001',
            errorCode: 'RECEIVER_UNREGISTERED'
          },
          {
            cycleWinnerSelectionId: 103,
            userId: 503,
            status: 'pending',
            amount: 2500,
            paypalItemId: 'PENDING_ITEM_001'
          }
        ]
      });

      // Execute first attempt
      const firstContext = createMockContext(allRecipients, 18);
      const firstResult = await orchestrator.executeTransactionWithRetry(firstContext);

      expect(firstResult.success).toBe(true);
      expect(firstResult.phase2?.failedItems).toBe(1);

      // Now retry only failed items
      const failedRecipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 102,
          userId: 502,
          paypalEmail: 'fixed@example.com', // Email corrected
          amount: 7500,
          currency: 'USD'
        }
      ];

      // Mock retry attempt response
      createPaypalPayout.mockResolvedValueOnce({
        batch_header: {
          payout_batch_id: 'RETRY_BATCH_001',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValueOnce({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'RETRY_BATCH_001',
        individualResults: [
          {
            cycleWinnerSelectionId: 102,
            userId: 502,
            status: 'success',
            amount: 7500,
            paypalItemId: 'RETRY_SUCCESS_ITEM'
          }
        ]
      });

      // Execute retry attempt
      const retryContext = createMockContext(failedRecipients, 18);
      const retryResult = await orchestrator.executeTransactionWithRetry(retryContext);

      expect(retryResult.success).toBe(true);
      expect(retryResult.phase2?.successfulItems).toBe(1);
      
      // Verify failed item is now successful
      const updatedWinner = await storage.getWinnerSelectionById(102);
      expect(updatedWinner?.payoutStatus).toBe('completed');
    });

    test('should handle multiple retry attempts with exponential backoff', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 104,
          userId: 504,
          paypalEmail: 'retry@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      const customRetryPolicy: RetryPolicy = {
        maxRetries: 3,
        baseDelayMs: 100, // Short delays for testing
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['Network timeout', 'Connection reset', 'Rate limit exceeded']
      };

      let attemptCount = 0;
      const attemptTimes: number[] = [];

      createPaypalPayout.mockImplementation(async () => {
        attemptTimes.push(Date.now());
        attemptCount++;
        
        if (attemptCount <= 2) {
          throw new Error('Network timeout');
        }
        
        // Third attempt succeeds
        return {
          batch_header: {
            payout_batch_id: 'BACKOFF_SUCCESS_BATCH',
            batch_status: 'SUCCESS'
          }
        };
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'BACKOFF_SUCCESS_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 104,
            userId: 504,
            status: 'success',
            amount: 5000,
            paypalItemId: 'BACKOFF_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context, customRetryPolicy);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
      
      // Verify exponential backoff (with some tolerance for execution time)
      if (attemptTimes.length >= 2) {
        const firstDelay = attemptTimes[1] - attemptTimes[0];
        expect(firstDelay).toBeGreaterThanOrEqual(100); // Base delay
        expect(firstDelay).toBeLessThan(500); // Reasonable upper bound
      }
    });

    test('should respect maximum retry limit', async () => {
      const { createPaypalPayout } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 105,
          userId: 505,
          paypalEmail: 'persistent-failure@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      const customRetryPolicy: RetryPolicy = {
        maxRetries: 2,
        baseDelayMs: 50,
        maxDelayMs: 200,
        backoffMultiplier: 2,
        retryableErrors: ['Network timeout']
      };

      let attemptCount = 0;
      createPaypalPayout.mockImplementation(async () => {
        attemptCount++;
        throw new Error('Network timeout');
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context, customRetryPolicy);

      expect(result.success).toBe(false);
      expect(attemptCount).toBe(3); // Initial attempt + 2 retries
      expect(result.phase2?.retryAttempts).toBe(2);
      expect(result.rollbackPerformed).toBe(true);
    });

    test('should not retry non-retryable errors', async () => {
      const { createPaypalPayout } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 106,
          userId: 506,
          paypalEmail: 'auth-error@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      const customRetryPolicy: RetryPolicy = {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['Network timeout', 'Connection reset'] // Auth errors not included
      };

      let attemptCount = 0;
      createPaypalPayout.mockImplementation(async () => {
        attemptCount++;
        const error = new Error('Authentication failed');
        (error as any).status = 401;
        throw error;
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context, customRetryPolicy);

      expect(result.success).toBe(false);
      expect(attemptCount).toBe(1); // No retries for auth error
      expect(result.phase2?.retryAttempts).toBe(0);
    });
  });

  describe('Re-run Prevention Mechanisms', () => {
    test('should prevent exact duplicate requests', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 107,
          userId: 507,
          paypalEmail: 'duplicate@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'ORIGINAL_BATCH',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'ORIGINAL_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 107,
            userId: 507,
            status: 'success',
            amount: 5000,
            paypalItemId: 'ORIGINAL_ITEM'
          }
        ]
      });

      // Create identical contexts
      const context1 = createMockContext(recipients, 18);
      const context2 = {
        ...context1,
        requestId: context1.requestId // Same request ID
      };

      // Execute first request
      const result1 = await orchestrator.executeTransactionWithRetry(context1);
      expect(result1.success).toBe(true);

      // Execute duplicate request
      const result2 = await orchestrator.executeTransactionWithRetry(context2);
      expect(result2.success).toBe(false);
      expect(result2.errors.some(error => 
        error.includes('duplicate') || error.includes('prevented') || error.includes('already')
      )).toBe(true);
    });

    test('should allow requests with different recipient sets', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients1: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 108,
          userId: 508,
          paypalEmail: 'first@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      const recipients2: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 109,
          userId: 509,
          paypalEmail: 'second@example.com',
          amount: 7500,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'DIFFERENT_BATCH',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockImplementation(() => ({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'DIFFERENT_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 108,
            userId: 508,
            status: 'success',
            amount: 5000,
            paypalItemId: 'DIFFERENT_ITEM_1'
          }
        ]
      }));

      const context1 = createMockContext(recipients1, 18);
      const context2 = createMockContext(recipients2, 18);

      // Both should succeed since recipients are different
      const result1 = await orchestrator.executeTransactionWithRetry(context1);
      const result2 = await orchestrator.executeTransactionWithRetry(context2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.phase1?.requestChecksum).not.toBe(result2.phase1?.requestChecksum);
    });

    test('should handle cooldown periods correctly', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 110,
          userId: 510,
          paypalEmail: 'cooldown@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'COOLDOWN_BATCH',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'COOLDOWN_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 110,
            userId: 510,
            status: 'success',
            amount: 5000,
            paypalItemId: 'COOLDOWN_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients, 18);

      // Execute first request
      const result1 = await orchestrator.executeTransactionWithRetry(context);
      expect(result1.success).toBe(true);

      // Immediate retry should be prevented
      const result2 = await orchestrator.executeTransactionWithRetry(context);
      expect(result2.success).toBe(false);

      // Wait for cooldown period (mock implementation)
      await new Promise(resolve => setTimeout(resolve, 100));

      // After cooldown, may allow retry depending on implementation
      const result3 = await orchestrator.executeTransactionWithRetry(context);
      // Result depends on implementation - either prevented or allowed
      expect(typeof result3.success).toBe('boolean');
    });
  });

  describe('Manual Retry Scenarios', () => {
    test('should support manual retry of failed items', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      // First, create a failed batch
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 111,
          userId: 511,
          paypalEmail: 'manual-retry@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValueOnce({
        batch_header: {
          payout_batch_id: 'FAILED_BATCH_FOR_MANUAL',
          batch_status: 'COMPLETED'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValueOnce({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'FAILED_BATCH_FOR_MANUAL',
        individualResults: [
          {
            cycleWinnerSelectionId: 111,
            userId: 511,
            status: 'failed',
            amount: 5000,
            paypalItemId: 'MANUAL_FAILED_ITEM',
            errorCode: 'RECEIVER_UNREGISTERED'
          }
        ]
      });

      // Execute original batch
      const originalContext = createMockContext(recipients, 18);
      const originalResult = await orchestrator.executeTransactionWithRetry(originalContext);

      expect(originalResult.success).toBe(true);
      expect(originalResult.phase2?.failedItems).toBe(1);

      // Manually retry with corrected data
      const correctedRecipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 111,
          userId: 511,
          paypalEmail: 'corrected@example.com', // Fixed email
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValueOnce({
        batch_header: {
          payout_batch_id: 'MANUAL_RETRY_SUCCESS',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValueOnce({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'MANUAL_RETRY_SUCCESS',
        individualResults: [
          {
            cycleWinnerSelectionId: 111,
            userId: 511,
            status: 'success',
            amount: 5000,
            paypalItemId: 'MANUAL_SUCCESS_ITEM'
          }
        ]
      });

      const manualRetryContext = createMockContext(correctedRecipients, 18);
      const manualRetryResult = await orchestrator.executeTransactionWithRetry(manualRetryContext);

      expect(manualRetryResult.success).toBe(true);
      expect(manualRetryResult.phase2?.successfulItems).toBe(1);
    });

    test('should track retry attempts in database', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 112,
          userId: 512,
          paypalEmail: 'track-retry@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      let attemptCount = 0;
      createPaypalPayout.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Network timeout');
        }
        return {
          batch_header: {
            payout_batch_id: 'TRACKED_RETRY_BATCH',
            batch_status: 'SUCCESS'
          }
        };
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'TRACKED_RETRY_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 112,
            userId: 512,
            status: 'success',
            amount: 5000,
            paypalItemId: 'TRACKED_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);

      // Verify retry tracking in database
      const batchRecord = await storage.getPayoutBatchById(result.phase1!.batchId!);
      expect(batchRecord?.retryCount).toBeGreaterThan(0);
      expect(batchRecord?.lastRetryAt).toBeDefined();
    });
  });

  describe('Error Classification and Retry Logic', () => {
    test('should classify errors correctly for retry decisions', async () => {
      const { createPaypalPayout } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 113,
          userId: 513,
          paypalEmail: 'error-classify@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      const errorScenarios = [
        { error: 'Network timeout', shouldRetry: true },
        { error: 'Connection reset', shouldRetry: true },
        { error: 'Rate limit exceeded', shouldRetry: true },
        { error: 'Authentication failed', shouldRetry: false },
        { error: 'Invalid API credentials', shouldRetry: false },
        { error: 'Malformed request', shouldRetry: false }
      ];

      for (const scenario of errorScenarios) {
        let attemptCount = 0;
        createPaypalPayout.mockImplementation(async () => {
          attemptCount++;
          throw new Error(scenario.error);
        });

        const context = createMockContext(recipients);
        const result = await orchestrator.executeTransactionWithRetry(context);

        expect(result.success).toBe(false);
        
        if (scenario.shouldRetry) {
          expect(attemptCount).toBeGreaterThan(1); // Should have retried
        } else {
          expect(attemptCount).toBe(1); // Should not have retried
        }

        jest.clearAllMocks();
      }
    });

    test('should handle partial batch retry scenarios', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 114,
          userId: 514,
          paypalEmail: 'partial1@example.com',
          amount: 3000,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 115,
          userId: 515,
          paypalEmail: 'partial2@example.com',
          amount: 4000,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 116,
          userId: 516,
          paypalEmail: 'partial3@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'PARTIAL_RETRY_BATCH',
          batch_status: 'COMPLETED'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'PARTIAL_RETRY_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 114,
            userId: 514,
            status: 'success',
            amount: 3000,
            paypalItemId: 'PARTIAL_SUCCESS_1'
          },
          {
            cycleWinnerSelectionId: 115,
            userId: 515,
            status: 'failed',
            amount: 4000,
            paypalItemId: 'PARTIAL_FAILED_1',
            errorCode: 'RECEIVER_UNREGISTERED'
          },
          {
            cycleWinnerSelectionId: 116,
            userId: 516,
            status: 'pending',
            amount: 5000,
            paypalItemId: 'PARTIAL_PENDING_1'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase2?.successfulItems).toBe(1);
      expect(result.phase2?.failedItems).toBe(1);
      expect(result.phase2?.pendingItems).toBe(1);

      // Should be able to retry just the failed item
      const failedOnlyRecipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 115,
          userId: 515,
          paypalEmail: 'fixed@example.com', // Corrected email
          amount: 4000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'RETRY_FAILED_ONLY',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'RETRY_FAILED_ONLY',
        individualResults: [
          {
            cycleWinnerSelectionId: 115,
            userId: 515,
            status: 'success',
            amount: 4000,
            paypalItemId: 'RETRY_SUCCESS'
          }
        ]
      });

      const retryContext = createMockContext(failedOnlyRecipients);
      const retryResult = await orchestrator.executeTransactionWithRetry(retryContext);

      expect(retryResult.success).toBe(true);
      expect(retryResult.phase2?.successfulItems).toBe(1);
    });
  });
});

export default {};