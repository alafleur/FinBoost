/**
 * STEP 10: UNIT TESTS - Two-Phase Transaction Rollback Scenarios
 * 
 * Comprehensive tests for rollback scenarios in the two-phase transaction pattern:
 * - Phase 1 failures and cleanup
 * - Phase 2 failures and rollback
 * - Partial success handling
 * - Database consistency validation
 */

import { PaypalTransactionOrchestrator } from '../../paypal-transaction-orchestrator.js';
import { storage } from '../../storage.js';
import type { TransactionContext, PayoutRecipient, TransactionResult } from '../../paypal-transaction-orchestrator.js';

// Mock storage for isolated testing
jest.mock('../../storage.js', () => ({
  storage: {
    createPayoutBatch: jest.fn(),
    createPayoutBatchItems: jest.fn(),
    deletePayoutBatch: jest.fn(),
    deletePayoutBatchItems: jest.fn(),
    checkExistingBatch: jest.fn(),
    updatePayoutBatch: jest.fn(),
    updatePayoutBatchItem: jest.fn(),
    processPaypalResponseResults: jest.fn(),
    markCycleAsCompleted: jest.fn(),
    createUserRewards: jest.fn()
  }
}));

// Mock PayPal API
jest.mock('../../paypal.js', () => ({
  createPaypalPayout: jest.fn(),
  parseEnhancedPayoutResponse: jest.fn(),
  getEnhancedPayoutStatus: jest.fn()
}));

describe('Two-Phase Transaction Rollback - Unit Tests', () => {
  let orchestrator: PaypalTransactionOrchestrator;
  let mockStorage: jest.Mocked<typeof storage>;

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
    mockStorage = storage as jest.Mocked<typeof storage>;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    mockStorage.checkExistingBatch.mockResolvedValue(null);
    mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
    mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  // Helper to create mock transaction context
  const createMockContext = (overrides: Partial<TransactionContext> = {}): TransactionContext => ({
    cycleSettingId: 18,
    adminId: 1,
    totalAmount: 15000,
    recipients: [
      {
        cycleWinnerSelectionId: 101,
        userId: 501,
        paypalEmail: 'winner1@example.com',
        amount: 5000,
        currency: 'USD',
        note: 'FinBoost Reward'
      },
      {
        cycleWinnerSelectionId: 102,
        userId: 502,
        paypalEmail: 'winner2@example.com',
        amount: 10000,
        currency: 'USD',
        note: 'FinBoost Reward'
      }
    ],
    requestId: 'test-request-123',
    senderBatchId: 'cycle-18-abc123def456',
    ...overrides
  });

  describe('Phase 1 Failure Scenarios', () => {
    test('should cleanup when batch creation fails', async () => {
      const context = createMockContext();
      mockStorage.createPayoutBatch.mockRejectedValue(new Error('Database connection failed'));

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase1.success).toBe(false);
      expect(result.phase1.errors).toContain('Database connection failed');
      expect(result.rollbackPerformed).toBe(false); // No rollback needed for Phase 1 failures
      
      // Verify no PayPal call was made
      expect(result.phase2).toBeUndefined();
    });

    test('should cleanup when batch items creation fails', async () => {
      const context = createMockContext();
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockRejectedValue(new Error('Items creation failed'));

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase1.success).toBe(false);
      expect(result.phase1.errors).toContain('Items creation failed');
      
      // Verify batch was attempted to be cleaned up
      expect(mockStorage.deletePayoutBatch).toHaveBeenCalledWith(1);
    });

    test('should handle validation failures without database operations', async () => {
      const context = createMockContext({
        recipients: [] // Invalid: empty recipients
      });

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase1.success).toBe(false);
      expect(result.phase1.errors).toContain('No valid recipients provided');
      
      // Verify no database operations were performed
      expect(mockStorage.createPayoutBatch).not.toHaveBeenCalled();
      expect(mockStorage.createPayoutBatchItems).not.toHaveBeenCalled();
    });

    test('should prevent duplicate batches during Phase 1', async () => {
      const context = createMockContext();
      mockStorage.checkExistingBatch.mockResolvedValue({
        id: 999,
        senderBatchId: 'existing-batch',
        status: 'processing'
      });

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase1.success).toBe(false);
      expect(result.phase1.errors).toContain('Duplicate batch detected');
      
      // Verify no new batch was created
      expect(mockStorage.createPayoutBatch).not.toHaveBeenCalled();
    });
  });

  describe('Phase 2 Failure and Rollback Scenarios', () => {
    test('should rollback when PayPal API fails', async () => {
      const context = createMockContext();
      
      // Phase 1 succeeds
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // Phase 2 fails - mock PayPal API failure
      const { createPaypalPayout } = require('../../paypal.js');
      createPaypalPayout.mockRejectedValue(new Error('PayPal API timeout'));

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase1.success).toBe(true);
      expect(result.phase2?.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      
      // Verify rollback operations
      expect(mockStorage.deletePayoutBatch).toHaveBeenCalledWith(1);
      expect(mockStorage.deletePayoutBatchItems).toHaveBeenCalledWith(1);
    });

    test('should rollback when response parsing fails', async () => {
      const context = createMockContext();
      
      // Phase 1 succeeds
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // PayPal API succeeds but parsing fails
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      createPaypalPayout.mockResolvedValue({ batch_header: { payout_batch_id: 'PAYPAL_123' } });
      parseEnhancedPayoutResponse.mockImplementation(() => {
        throw new Error('Invalid response format');
      });

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase2?.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      
      // Verify PayPal was called but rollback occurred
      expect(createPaypalPayout).toHaveBeenCalled();
      expect(mockStorage.deletePayoutBatch).toHaveBeenCalledWith(1);
    });

    test('should rollback when database update fails after PayPal success', async () => {
      const context = createMockContext();
      
      // Phase 1 succeeds
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // PayPal API and parsing succeed
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      createPaypalPayout.mockResolvedValue({ batch_header: { payout_batch_id: 'PAYPAL_123' } });
      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'SUCCESS',
        paypalBatchId: 'PAYPAL_123',
        individualResults: [
          { cycleWinnerSelectionId: 101, userId: 501, status: 'success', amount: 5000 }
        ]
      });
      
      // Database update fails
      mockStorage.processPaypalResponseResults.mockRejectedValue(new Error('Database update failed'));

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.phase2?.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      
      // Verify PayPal succeeded but rollback occurred due to database failure
      expect(createPaypalPayout).toHaveBeenCalled();
      expect(parseEnhancedPayoutResponse).toHaveBeenCalled();
      expect(mockStorage.deletePayoutBatch).toHaveBeenCalledWith(1);
    });
  });

  describe('Partial Success Scenarios', () => {
    test('should handle mixed success/failure without rollback', async () => {
      const context = createMockContext();
      
      // Phase 1 succeeds
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // PayPal returns mixed results
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      createPaypalPayout.mockResolvedValue({ batch_header: { payout_batch_id: 'PAYPAL_123' } });
      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'PAYPAL_123',
        individualResults: [
          { cycleWinnerSelectionId: 101, userId: 501, status: 'success', amount: 5000 },
          { cycleWinnerSelectionId: 102, userId: 502, status: 'failed', amount: 10000, errorCode: 'RECEIVER_UNREGISTERED' }
        ]
      });
      
      // Database update succeeds
      mockStorage.processPaypalResponseResults.mockResolvedValue(undefined);

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase2?.success).toBe(true);
      expect(result.rollbackPerformed).toBe(false);
      
      // Verify no rollback for partial success
      expect(mockStorage.deletePayoutBatch).not.toHaveBeenCalled();
      expect(mockStorage.processPaypalResponseResults).toHaveBeenCalled();
    });

    test('should handle all failures without rollback if properly processed', async () => {
      const context = createMockContext();
      
      // Phase 1 succeeds
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // PayPal returns all failures but batch is processed
      const { createPaypalPayout, parseEnhancedPayoutResponse } = require('../../paypal.js');
      createPaypalPayout.mockResolvedValue({ batch_header: { payout_batch_id: 'PAYPAL_123' } });
      parseEnhancedPayoutResponse.mockReturnValue({
        batchStatus: 'COMPLETED',
        paypalBatchId: 'PAYPAL_123',
        individualResults: [
          { cycleWinnerSelectionId: 101, userId: 501, status: 'failed', amount: 5000, errorCode: 'INVALID_EMAIL' },
          { cycleWinnerSelectionId: 102, userId: 502, status: 'failed', amount: 10000, errorCode: 'RECEIVER_UNREGISTERED' }
        ]
      });
      
      mockStorage.processPaypalResponseResults.mockResolvedValue(undefined);

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(true);
      expect(result.phase2?.success).toBe(true);
      expect(result.rollbackPerformed).toBe(false);
      
      // All failures are valid results, no rollback needed
      expect(mockStorage.deletePayoutBatch).not.toHaveBeenCalled();
    });
  });

  describe('Rollback Error Handling', () => {
    test('should log but not fail if rollback operations fail', async () => {
      const context = createMockContext();
      
      // Phase 1 succeeds
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // Phase 2 fails
      const { createPaypalPayout } = require('../../paypal.js');
      createPaypalPayout.mockRejectedValue(new Error('PayPal API error'));
      
      // Rollback operations fail
      mockStorage.deletePayoutBatch.mockRejectedValue(new Error('Rollback batch deletion failed'));
      mockStorage.deletePayoutBatchItems.mockRejectedValue(new Error('Rollback items deletion failed'));

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      
      // Should still report rollback as performed even if cleanup failed
      expect(mockStorage.deletePayoutBatch).toHaveBeenCalled();
      expect(mockStorage.deletePayoutBatchItems).toHaveBeenCalled();
    });

    test('should handle partial rollback scenarios', async () => {
      const context = createMockContext();
      
      // Phase 1 succeeds
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // Phase 2 fails
      const { createPaypalPayout } = require('../../paypal.js');
      createPaypalPayout.mockRejectedValue(new Error('PayPal API error'));
      
      // Batch deletion succeeds, items deletion fails
      mockStorage.deletePayoutBatch.mockResolvedValue(undefined);
      mockStorage.deletePayoutBatchItems.mockRejectedValue(new Error('Items deletion failed'));

      const result = await orchestrator.executeTransactionWithRetry(context);

      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      
      // Both rollback operations should have been attempted
      expect(mockStorage.deletePayoutBatch).toHaveBeenCalledWith(1);
      expect(mockStorage.deletePayoutBatchItems).toHaveBeenCalledWith(1);
    });
  });

  describe('Database Consistency Validation', () => {
    test('should maintain database consistency on Phase 1 failures', async () => {
      const context = createMockContext();
      mockStorage.createPayoutBatch.mockRejectedValue(new Error('Database error'));

      await orchestrator.executeTransactionWithRetry(context);

      // Verify no orphaned data
      expect(mockStorage.createPayoutBatchItems).not.toHaveBeenCalled();
      expect(mockStorage.processPaypalResponseResults).not.toHaveBeenCalled();
      expect(mockStorage.markCycleAsCompleted).not.toHaveBeenCalled();
    });

    test('should maintain database consistency on Phase 2 failures', async () => {
      const context = createMockContext();
      
      // Phase 1 creates database records
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      // Phase 2 fails
      const { createPaypalPayout } = require('../../paypal.js');
      createPaypalPayout.mockRejectedValue(new Error('PayPal error'));

      await orchestrator.executeTransactionWithRetry(context);

      // Verify rollback cleans up database
      expect(mockStorage.deletePayoutBatch).toHaveBeenCalledWith(1);
      expect(mockStorage.deletePayoutBatchItems).toHaveBeenCalledWith(1);
      
      // Verify no completion operations occurred
      expect(mockStorage.markCycleAsCompleted).not.toHaveBeenCalled();
      expect(mockStorage.createUserRewards).not.toHaveBeenCalled();
    });

    test('should validate foreign key relationships during rollback', async () => {
      const context = createMockContext();
      
      mockStorage.createPayoutBatch.mockResolvedValue({ id: 1, senderBatchId: 'test-batch' });
      mockStorage.createPayoutBatchItems.mockResolvedValue([
        { id: 10, payoutBatchId: 1 },
        { id: 11, payoutBatchId: 1 }
      ]);
      
      const { createPaypalPayout } = require('../../paypal.js');
      createPaypalPayout.mockRejectedValue(new Error('PayPal error'));

      await orchestrator.executeTransactionWithRetry(context);

      // Verify items are deleted before batch (foreign key constraint)
      const deleteCallOrder = mockStorage.deletePayoutBatchItems.mock.invocationCallOrder[0];
      const batchDeleteCallOrder = mockStorage.deletePayoutBatch.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(batchDeleteCallOrder);
    });
  });
});

export default {};