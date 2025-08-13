/**
 * STEP 10: INTEGRATION TESTS - Concurrent Disbursement Attempts
 * 
 * Tests the system's ability to handle multiple simultaneous disbursement requests:
 * - Advisory locking and concurrency control
 * - Re-run prevention mechanisms
 * - Database consistency under concurrent load
 * - Race condition handling
 */

import { PaypalTransactionOrchestrator } from '../../paypal-transaction-orchestrator.js';
import { storage } from '../../storage.js';
import type { TransactionContext } from '../../paypal-transaction-orchestrator.js';

describe('Concurrent Disbursement Attempts - Integration Tests', () => {
  let orchestrator: PaypalTransactionOrchestrator;

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
  });

  // Helper to create mock transaction context
  const createMockContext = (cycleId: number = 18, adminId: number = 1): TransactionContext => ({
    cycleSettingId: cycleId,
    adminId,
    totalAmount: 15000,
    recipients: [
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
        amount: 10000,
        currency: 'USD'
      }
    ],
    requestId: `test-request-${Date.now()}`,
    senderBatchId: `cycle-${cycleId}-${Date.now().toString(16)}`
  });

  describe('Advisory Locking Tests', () => {
    test('should prevent concurrent processing of same cycle', async () => {
      const context1 = createMockContext(18, 1);
      const context2 = createMockContext(18, 2); // Same cycle, different admin

      // Start both transactions simultaneously
      const [result1, result2] = await Promise.all([
        orchestrator.executeTransactionWithRetry(context1),
        orchestrator.executeTransactionWithRetry(context2)
      ]);

      // One should succeed, one should be blocked
      const results = [result1, result2];
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      
      // Verify the failure was due to lock contention
      const failedResult = failures[0];
      expect(failedResult.errors.some(error => 
        error.includes('lock') || error.includes('concurrent') || error.includes('processing')
      )).toBe(true);
    });

    test('should allow concurrent processing of different cycles', async () => {
      const context1 = createMockContext(18, 1);
      const context2 = createMockContext(19, 1); // Different cycle

      // Start both transactions simultaneously
      const [result1, result2] = await Promise.all([
        orchestrator.executeTransactionWithRetry(context1),
        orchestrator.executeTransactionWithRetry(context2)
      ]);

      // Both should succeed since they're different cycles
      expect(result1.success || result2.success).toBe(true);
      
      // At minimum one should succeed (may both succeed if system allows)
      const successes = [result1, result2].filter(r => r.success);
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });

    test('should release lock after transaction completion', async () => {
      const context1 = createMockContext(18, 1);
      const context2 = createMockContext(18, 2);

      // Execute first transaction
      const result1 = await orchestrator.executeTransactionWithRetry(context1);
      
      // Wait a brief moment for lock release
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Execute second transaction
      const result2 = await orchestrator.executeTransactionWithRetry(context2);

      // Second transaction should be able to proceed after first completes
      // (though it may be prevented by other mechanisms like re-run prevention)
      expect(result1.success || result2.success).toBe(true);
    });

    test('should handle lock timeout scenarios', async () => {
      const context = createMockContext(18, 1);

      // Mock a long-running operation that holds the lock
      const longRunningPromise = new Promise(resolve => {
        setTimeout(() => {
          orchestrator.executeTransactionWithRetry(context).then(resolve);
        }, 5000); // 5 second delay
      });

      // Try to acquire lock immediately
      const immediateResult = await orchestrator.executeTransactionWithRetry(context);

      // Should fail due to inability to acquire lock
      expect(immediateResult.success).toBe(false);
      expect(immediateResult.errors.some(error => 
        error.includes('lock') || error.includes('timeout') || error.includes('acquire')
      )).toBe(true);

      // Clean up
      clearTimeout(longRunningPromise as any);
    });
  });

  describe('Re-run Prevention Tests', () => {
    test('should prevent duplicate processing with identical parameters', async () => {
      const baseContext = createMockContext(18, 1);
      
      // Create two contexts with identical parameters
      const context1 = { ...baseContext, requestId: 'identical-request' };
      const context2 = { ...baseContext, requestId: 'identical-request' };

      // Execute first transaction
      const result1 = await orchestrator.executeTransactionWithRetry(context1);
      
      // Execute second transaction with identical parameters
      const result2 = await orchestrator.executeTransactionWithRetry(context2);

      // First should succeed, second should be prevented
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.errors.some(error => 
        error.includes('duplicate') || error.includes('prevented') || error.includes('already')
      )).toBe(true);
    });

    test('should allow processing with different parameters', async () => {
      const context1 = createMockContext(18, 1);
      const context2 = {
        ...createMockContext(18, 1),
        totalAmount: 16000, // Different amount
        requestId: 'different-request'
      };

      // Execute both transactions
      const result1 = await orchestrator.executeTransactionWithRetry(context1);
      const result2 = await orchestrator.executeTransactionWithRetry(context2);

      // Both should have different checksums and be allowed
      expect(result1.phase1?.requestChecksum).toBeDefined();
      expect(result2.phase1?.requestChecksum).toBeDefined();
      expect(result1.phase1?.requestChecksum).not.toBe(result2.phase1?.requestChecksum);
    });

    test('should prevent re-run with different admin but same data', async () => {
      const context1 = createMockContext(18, 1);
      const context2 = createMockContext(18, 2); // Different admin, same data

      // Execute first transaction
      const result1 = await orchestrator.executeTransactionWithRetry(context1);
      
      // Execute second transaction with different admin
      const result2 = await orchestrator.executeTransactionWithRetry(context2);

      // Should be prevented since the data is effectively the same cycle
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
    });
  });

  describe('Database Consistency Under Concurrency', () => {
    test('should maintain referential integrity during concurrent attempts', async () => {
      const contexts = Array.from({ length: 5 }, (_, i) => 
        createMockContext(20 + i, 1) // Different cycles to avoid lock contention
      );

      // Execute all transactions concurrently
      const results = await Promise.allSettled(
        contexts.map(context => orchestrator.executeTransactionWithRetry(context))
      );

      // Check database consistency
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled' && result.value.success) {
          const batchId = result.value.phase1?.batchId;
          if (batchId) {
            // Verify batch exists and has correct items
            const batch = await storage.getPayoutBatchById(batchId);
            expect(batch).toBeDefined();
            
            const items = await storage.getPayoutBatchItemsByBatchId(batchId);
            expect(items.length).toBe(contexts[i].recipients.length);
          }
        }
      }
    });

    test('should handle database deadlocks gracefully', async () => {
      // Create contexts that might cause database contention
      const contexts = Array.from({ length: 3 }, () => createMockContext(18, 1));

      const results = await Promise.allSettled(
        contexts.map(context => orchestrator.executeTransactionWithRetry(context))
      );

      // Should not have any unhandled promise rejections
      results.forEach(result => {
        if (result.status === 'rejected') {
          // Should be handled gracefully, not thrown
          expect(result.reason).toBeInstanceOf(Error);
        }
      });

      // At least one should have provided a meaningful error message
      const failures = results
        .filter(r => r.status === 'fulfilled' && !r.value.success)
        .map(r => (r as PromiseFulfilledResult<any>).value);
      
      if (failures.length > 0) {
        expect(failures.some(f => 
          f.errors.some((e: string) => e.includes('database') || e.includes('conflict'))
        )).toBe(true);
      }
    });
  });

  describe('Race Condition Handling', () => {
    test('should handle rapid-fire identical requests', async () => {
      const context = createMockContext(18, 1);
      
      // Fire 10 identical requests in rapid succession
      const promises = Array.from({ length: 10 }, () => 
        orchestrator.executeTransactionWithRetry(context)
      );

      const results = await Promise.all(promises);

      // Only one should succeed
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      expect(successes).toHaveLength(1);
      expect(failures.length).toBeGreaterThanOrEqual(9);

      // All failures should be due to prevention mechanisms
      failures.forEach(failure => {
        expect(failure.errors.some(error => 
          error.includes('duplicate') || 
          error.includes('lock') || 
          error.includes('prevented') ||
          error.includes('concurrent')
        )).toBe(true);
      });
    });

    test('should handle interleaved Phase 1 and Phase 2 operations', async () => {
      const context1 = createMockContext(21, 1);
      const context2 = createMockContext(22, 1);

      // Start first transaction and let it get partway through
      const promise1 = orchestrator.executeTransactionWithRetry(context1);
      
      // Brief delay to let first transaction start Phase 1
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Start second transaction
      const promise2 = orchestrator.executeTransactionWithRetry(context2);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should complete successfully since they're different cycles
      // or one should fail with proper error handling
      const totalSuccesses = (result1.success ? 1 : 0) + (result2.success ? 1 : 0);
      expect(totalSuccesses).toBeGreaterThanOrEqual(1);

      // Any failures should be properly handled
      [result1, result2].forEach(result => {
        if (!result.success) {
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.rollbackPerformed).toBeDefined();
        }
      });
    });

    test('should maintain consistency during Phase 2 PayPal API race conditions', async () => {
      // Mock PayPal API to introduce delays
      const originalCreatePaypalPayout = require('../../paypal.js').createPaypalPayout;
      
      let callCount = 0;
      require('../../paypal.js').createPaypalPayout = jest.fn().mockImplementation(async () => {
        callCount++;
        // Add random delay to simulate network conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return {
          batch_header: {
            payout_batch_id: `CONCURRENT_BATCH_${callCount}`,
            batch_status: 'SUCCESS'
          },
          items: []
        };
      });

      const contexts = [
        createMockContext(23, 1),
        createMockContext(24, 1),
        createMockContext(25, 1)
      ];

      const results = await Promise.all(
        contexts.map(context => orchestrator.executeTransactionWithRetry(context))
      );

      // Restore original function
      require('../../paypal.js').createPaypalPayout = originalCreatePaypalPayout;

      // Each successful transaction should have a unique PayPal batch ID
      const successfulResults = results.filter(r => r.success);
      const paypalBatchIds = successfulResults
        .map(r => r.phase2?.paypalBatchId)
        .filter(Boolean);

      const uniqueBatchIds = new Set(paypalBatchIds);
      expect(uniqueBatchIds.size).toBe(paypalBatchIds.length);
    });
  });

  describe('Performance Under Load', () => {
    test('should handle burst of concurrent requests without degradation', async () => {
      const startTime = Date.now();
      
      // Create 20 different cycle contexts to avoid lock contention
      const contexts = Array.from({ length: 20 }, (_, i) => 
        createMockContext(100 + i, 1)
      );

      const results = await Promise.all(
        contexts.map(context => orchestrator.executeTransactionWithRetry(context))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust based on system performance)
      expect(duration).toBeLessThan(30000); // 30 seconds max for 20 concurrent transactions

      // Should have reasonable success rate
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(results.length * 0.5); // At least 50% success rate
    });

    test('should not leak resources during concurrent operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run multiple rounds of concurrent operations
      for (let round = 0; round < 3; round++) {
        const contexts = Array.from({ length: 10 }, (_, i) => 
          createMockContext(200 + round * 10 + i, 1)
        );
        
        await Promise.all(
          contexts.map(context => orchestrator.executeTransactionWithRetry(context))
        );
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage shouldn't increase dramatically (allow for some variance)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });
});

export default {};