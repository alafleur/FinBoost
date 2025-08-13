/**
 * STEP 10: INTEGRATION TESTS - Success/Failure Scenarios
 * 
 * Tests complete end-to-end scenarios:
 * - All success scenarios
 * - Partial success/failure combinations
 * - Complete failure scenarios
 * - PayPal API error recovery
 */

import { PaypalTransactionOrchestrator } from '../../paypal-transaction-orchestrator.js';
import { storage } from '../../storage.js';
import type { TransactionContext, PayoutRecipient } from '../../paypal-transaction-orchestrator.js';

// Mock PayPal API for controlled testing
jest.mock('../../paypal.js');

describe('Success/Failure Scenarios - Integration Tests', () => {
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
    requestId: `test-scenario-${Date.now()}`,
    senderBatchId: `cycle-${cycleId}-${Date.now().toString(16)}`
  });

  describe('All Success Scenarios', () => {
    test('should handle single recipient success', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'winner@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      // Mock successful PayPal response
      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'SUCCESS_BATCH_001',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'SUCCESS_BATCH_001',
        individualResults: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            status: 'success',
            amount: 5000,
            paypalItemId: 'ITEM_001'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase1?.success).toBe(true);
      expect(result.phase2?.success).toBe(true);
      expect(result.phase2?.processedItems).toBe(1);
      expect(result.rollbackPerformed).toBe(false);
    });

    test('should handle multiple recipients all success', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'winner1@example.com',
          amount: 5000,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 102,
          userId: 502,
          paypalEmail: 'winner2@example.com',
          amount: 7500,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 103,
          userId: 503,
          paypalEmail: 'winner3@example.com',
          amount: 2500,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'MULTI_SUCCESS_BATCH',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'MULTI_SUCCESS_BATCH',
        individualResults: recipients.map((r, i) => ({
          cycleWinnerSelectionId: r.cycleWinnerSelectionId,
          userId: r.userId,
          status: 'success',
          amount: r.amount,
          paypalItemId: `ITEM_${i + 1}`
        }))
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase2?.processedItems).toBe(3);
      expect(result.phase2?.successfulItems).toBe(3);
      expect(result.phase2?.failedItems).toBe(0);
    });

    test('should handle large batch success (50+ recipients)', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = Array.from({ length: 75 }, (_, i) => ({
        cycleWinnerSelectionId: 200 + i,
        userId: 600 + i,
        paypalEmail: `winner${i}@example.com`,
        amount: 1000 + (i * 100),
        currency: 'USD'
      }));

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'LARGE_BATCH_SUCCESS',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'LARGE_BATCH_SUCCESS',
        individualResults: recipients.map((r, i) => ({
          cycleWinnerSelectionId: r.cycleWinnerSelectionId,
          userId: r.userId,
          status: 'success',
          amount: r.amount,
          paypalItemId: `LARGE_ITEM_${i + 1}`
        }))
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase2?.processedItems).toBe(75);
      expect(result.phase2?.successfulItems).toBe(75);
    });
  });

  describe('Partial Success/Failure Scenarios', () => {
    test('should handle mixed success and failures', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'valid@example.com',
          amount: 5000,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 102,
          userId: 502,
          paypalEmail: 'invalid@example.com',
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

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'MIXED_RESULTS_BATCH',
          batch_status: 'COMPLETED'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'MIXED_RESULTS_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            status: 'success',
            amount: 5000,
            paypalItemId: 'SUCCESS_ITEM'
          },
          {
            cycleWinnerSelectionId: 102,
            userId: 502,
            status: 'failed',
            amount: 7500,
            paypalItemId: 'FAILED_ITEM',
            errorCode: 'RECEIVER_UNREGISTERED'
          },
          {
            cycleWinnerSelectionId: 103,
            userId: 503,
            status: 'pending',
            amount: 2500,
            paypalItemId: 'PENDING_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true); // Overall success even with some failures
      expect(result.phase2?.processedItems).toBe(3);
      expect(result.phase2?.successfulItems).toBe(1);
      expect(result.phase2?.failedItems).toBe(1);
      expect(result.phase2?.pendingItems).toBe(1);
      expect(result.rollbackPerformed).toBe(false);
    });

    test('should handle unclaimed PayPal payments', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'unclaimed@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'UNCLAIMED_BATCH',
          batch_status: 'COMPLETED'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'UNCLAIMED_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            status: 'unclaimed',
            amount: 5000,
            paypalItemId: 'UNCLAIMED_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase2?.unclaimedItems).toBe(1);
    });

    test('should handle 70% success rate scenario', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = Array.from({ length: 10 }, (_, i) => ({
        cycleWinnerSelectionId: 300 + i,
        userId: 700 + i,
        paypalEmail: `user${i}@example.com`,
        amount: 1000,
        currency: 'USD'
      }));

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'PARTIAL_SUCCESS_BATCH',
          batch_status: 'COMPLETED'
        }
      });

      // 7 success, 3 failures
      const individualResults = recipients.map((r, i) => ({
        cycleWinnerSelectionId: r.cycleWinnerSelectionId,
        userId: r.userId,
        status: i < 7 ? 'success' : 'failed',
        amount: r.amount,
        paypalItemId: `ITEM_${i}`,
        ...(i >= 7 && { errorCode: 'INVALID_EMAIL' })
      }));

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'PARTIAL_SUCCESS_BATCH',
        individualResults
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase2?.successfulItems).toBe(7);
      expect(result.phase2?.failedItems).toBe(3);
      expect(result.phase2?.successRate).toBeCloseTo(0.7, 1);
    });
  });

  describe('Complete Failure Scenarios', () => {
    test('should handle all recipients failing', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'invalid1@example.com',
          amount: 5000,
          currency: 'USD'
        },
        {
          cycleWinnerSelectionId: 102,
          userId: 502,
          paypalEmail: 'invalid2@example.com',
          amount: 7500,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'ALL_FAILED_BATCH',
          batch_status: 'COMPLETED'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'ALL_FAILED_BATCH',
        individualResults: recipients.map(r => ({
          cycleWinnerSelectionId: r.cycleWinnerSelectionId,
          userId: r.userId,
          status: 'failed',
          amount: r.amount,
          paypalItemId: `FAILED_${r.userId}`,
          errorCode: 'RECEIVER_UNREGISTERED'
        }))
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true); // PayPal processed the batch successfully
      expect(result.phase2?.successfulItems).toBe(0);
      expect(result.phase2?.failedItems).toBe(2);
      expect(result.rollbackPerformed).toBe(false);
    });

    test('should handle PayPal batch-level failure', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'test@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'BATCH_FAILED',
          batch_status: 'FAILED',
          errors: [{ name: 'BATCH_ERROR', message: 'Insufficient funds' }]
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'FAILED',
        paypalBatchId: 'BATCH_FAILED',
        individualResults: [],
        batchError: 'Insufficient funds'
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase2?.success).toBe(false);
      expect(result.phase2?.errors).toContain('Insufficient funds');
      expect(result.rollbackPerformed).toBe(true);
    });

    test('should handle complete PayPal API failure', async () => {
      const { createPaypalPayout } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'test@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      // Simulate complete API failure
      createPaypalPayout.mockRejectedValue(new Error('PayPal API unavailable'));

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase1?.success).toBe(true);
      expect(result.phase2?.success).toBe(false);
      expect(result.phase2?.errors).toContain('PayPal API unavailable');
      expect(result.rollbackPerformed).toBe(true);
    });
  });

  describe('PayPal API Error Recovery', () => {
    test('should handle network timeout and retry', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'test@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      let callCount = 0;
      createPaypalPayout.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network timeout');
        }
        if (callCount === 2) {
          throw new Error('Connection reset');
        }
        // Third call succeeds
        return {
          batch_header: {
            payout_batch_id: 'RETRY_SUCCESS_BATCH',
            batch_status: 'SUCCESS'
          }
        };
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'RETRY_SUCCESS_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            status: 'success',
            amount: 5000,
            paypalItemId: 'RETRY_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(callCount).toBe(3); // Two failures, one success
      expect(result.phase2?.retryAttempts).toBeGreaterThan(0);
    });

    test('should handle rate limiting from PayPal', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'test@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      let callCount = 0;
      createPaypalPayout.mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          const error = new Error('Rate limit exceeded');
          (error as any).status = 429;
          throw error;
        }
        return {
          batch_header: {
            payout_batch_id: 'RATE_LIMIT_SUCCESS_BATCH',
            batch_status: 'SUCCESS'
          }
        };
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'RATE_LIMIT_SUCCESS_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            status: 'success',
            amount: 5000,
            paypalItemId: 'RATE_LIMIT_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    });

    test('should handle malformed PayPal responses', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'test@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        // Malformed response missing critical fields
        incomplete_data: true
      });

      parseEnhancedPayoutResponse.mockImplementation(() => {
        throw new Error('Failed to parse PayPal response: Missing batch_header');
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase2?.errors).toContain('Failed to parse PayPal response: Missing batch_header');
      expect(result.rollbackPerformed).toBe(true);
    });
  });

  describe('Database Integration with Scenarios', () => {
    test('should properly update winner records on success', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 101,
          userId: 501,
          paypalEmail: 'winner@example.com',
          amount: 5000,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'DB_INTEGRATION_BATCH',
          batch_status: 'SUCCESS'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'DB_INTEGRATION_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            status: 'success',
            amount: 5000,
            paypalItemId: 'DB_INTEGRATION_ITEM'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      
      // Verify database was updated
      const winnerRecord = await storage.getWinnerSelectionById(101);
      expect(winnerRecord?.payoutStatus).toBe('completed');
      expect(winnerRecord?.notificationDisplayed).toBe(false); // Should trigger banner
    });

    test('should properly track failed items in database', async () => {
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      
      const recipients: PayoutRecipient[] = [
        {
          cycleWinnerSelectionId: 102,
          userId: 502,
          paypalEmail: 'failed@example.com',
          amount: 7500,
          currency: 'USD'
        }
      ];

      createPaypalPayout.mockResolvedValue({
        batch_header: {
          payout_batch_id: 'DB_FAILED_BATCH',
          batch_status: 'COMPLETED'
        }
      });

      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'DB_FAILED_BATCH',
        individualResults: [
          {
            cycleWinnerSelectionId: 102,
            userId: 502,
            status: 'failed',
            amount: 7500,
            paypalItemId: 'DB_FAILED_ITEM',
            errorCode: 'RECEIVER_UNREGISTERED'
          }
        ]
      });

      const context = createMockContext(recipients);
      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      
      // Verify failed status was recorded
      const winnerRecord = await storage.getWinnerSelectionById(102);
      expect(winnerRecord?.payoutStatus).toBe('failed');
      
      // Verify error details were stored in payout batch items
      const batchItems = await storage.getPayoutBatchItemsByBatchId(result.phase1!.batchId!);
      const failedItem = batchItems.find(item => item.cycleWinnerSelectionId === 102);
      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.errorCode).toBe('RECEIVER_UNREGISTERED');
    });
  });
});

export default {};