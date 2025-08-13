/**
 * STEP 8: TESTING & VALIDATION
 * Unit Tests for Defensive Orchestrator Resource Protection
 * 
 * Tests the resource protection and concurrent operation management
 * implemented in Step 7: Defensive Orchestrator Enhancement
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PaypalTransactionOrchestrator, type TransactionContext, type PayoutRecipient } from '../../paypal-transaction-orchestrator';

describe('Defensive Orchestrator - Resource Protection', () => {
  let orchestrator: PaypalTransactionOrchestrator;
  let validContext: TransactionContext;

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
    
    // Reset circuit breaker and operation counters
    (PaypalTransactionOrchestrator as any).circuitBreakerState = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0
    };
    (PaypalTransactionOrchestrator as any).activeOperations = 0;

    const validRecipients: PayoutRecipient[] = [
      {
        cycleWinnerSelectionId: 1,
        userId: 100,
        paypalEmail: 'test@example.com',
        amount: 2500,
        currency: 'USD',
        note: 'FinBoost monthly reward'
      }
    ];

    validContext = {
      cycleSettingId: 1,
      adminId: 1,
      recipients: validRecipients,
      totalAmount: 2500,
      requestId: 'test-request-123',
      senderBatchId: 'cycle-1-test123456789'
    };
  });

  afterEach(() => {
    // Reset operation counters and circuit breaker
    (PaypalTransactionOrchestrator as any).activeOperations = 0;
    (PaypalTransactionOrchestrator as any).circuitBreakerState = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0
    };
    jest.restoreAllMocks();
  });

  describe('Operation Slot Management', () => {
    test('should start with zero active operations', () => {
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });

    test('should acquire operation slot successfully when under limit', async () => {
      // Mock the core transaction to succeed quickly
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(true);
      expect(result.errors).not.toContain('Resource protection active');
      
      // Operation should be completed and slot released
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });

    test('should increment active operations during processing', async () => {
      let peakActiveOperations = 0;

      // Mock the core transaction to check operation count during execution
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          peakActiveOperations = (PaypalTransactionOrchestrator as any).activeOperations;
          return {
            success: true,
            phase1: { success: true, errors: [], warnings: [] },
            phase2: { success: true, errors: [], warnings: [] },
            rollbackPerformed: false,
            errors: [],
            warnings: []
          };
        }
      );

      await orchestrator.executeTransaction(validContext);

      expect(peakActiveOperations).toBe(1);
      
      // Should be released after completion
      const finalActiveOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(finalActiveOperations).toBe(0);
    });

    test('should release operation slot even when transaction fails', async () => {
      // Mock the core transaction to fail
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: false,
        phase1: { success: false, errors: ['Simulated failure'], warnings: [] },
        rollbackPerformed: false,
        errors: ['Simulated failure'],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      
      // Operation slot should still be released
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });

    test('should release operation slot even when exception is thrown', async () => {
      // Mock the core transaction to throw an exception
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          throw new Error('Simulated exception');
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Simulated exception'))).toBe(true);
      
      // Operation slot should still be released in finally block
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });
  });

  describe('Concurrent Operation Limits', () => {
    test('should reject operations when at maximum concurrent limit', async () => {
      // Manually set active operations to maximum (10)
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      expect(result.errors.some(error => error.includes('Maximum concurrent operations reached: 10/10'))).toBe(true);
    });

    test('should reject operations when exceeding maximum limit', async () => {
      // Manually set active operations above maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 11;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      expect(result.errors.some(error => error.includes('Maximum concurrent operations reached: 11/10'))).toBe(true);
    });

    test('should allow operations when just under limit', async () => {
      // Set active operations to just under limit (9 out of 10)
      (PaypalTransactionOrchestrator as any).activeOperations = 9;

      // Mock successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(true);
      expect(result.errors).not.toContain('Resource protection active');
    });

    test('should handle concurrent operations correctly', async () => {
      const maxConcurrent = 10;
      const totalOperations = 15;
      const operations: Promise<any>[] = [];
      let concurrentCount = 0;
      let maxObservedConcurrent = 0;

      // Mock transaction that simulates processing time and tracks concurrency
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          concurrentCount++;
          maxObservedConcurrent = Math.max(maxObservedConcurrent, concurrentCount);
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 50));
          
          concurrentCount--;
          return {
            success: true,
            phase1: { success: true, errors: [], warnings: [] },
            phase2: { success: true, errors: [], warnings: [] },
            rollbackPerformed: false,
            errors: [],
            warnings: []
          };
        }
      );

      // Start multiple operations concurrently
      for (let i = 0; i < totalOperations; i++) {
        const operation = orchestrator.executeTransaction({
          ...validContext,
          requestId: `test-request-${i}`
        });
        operations.push(operation);
      }

      const results = await Promise.all(operations);

      // First 10 should succeed, next 5 should be rejected
      const successfulOps = results.filter(r => r.success).length;
      const rejectedOps = results.filter(r => !r.success && r.errors.includes('Resource protection active')).length;

      expect(successfulOps).toBe(maxConcurrent);
      expect(rejectedOps).toBe(totalOperations - maxConcurrent);
      expect(maxObservedConcurrent).toBeLessThanOrEqual(maxConcurrent);
    });
  });

  describe('Resource Protection Integration', () => {
    test('should check resource protection after circuit breaker validation', async () => {
      // Set operation count to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      
      // Should not contain circuit breaker errors since circuit is closed
      expect(result.errors).not.toContain('Circuit breaker protection active');
    });

    test('should prioritize circuit breaker over resource protection', async () => {
      // Open the circuit breaker
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date();

      // Also set operations to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      // Should get circuit breaker error, not resource protection
      expect(result.errors).toContain('Circuit breaker protection active');
      expect(result.errors).not.toContain('Resource protection active');
    });

    test('should not increment operation count when resource protection blocks', async () => {
      // Set operations to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;
      const initialCount = (PaypalTransactionOrchestrator as any).activeOperations;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      
      // Operation count should remain unchanged
      const finalCount = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(finalCount).toBe(initialCount);
    });

    test('should handle negative operation count gracefully', async () => {
      // Manually set operation count to negative (edge case)
      (PaypalTransactionOrchestrator as any).activeOperations = -1;

      // Mock successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(true);
      
      // Should reset to 0 after operation completes
      const finalCount = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(finalCount).toBe(0);
    });
  });

  describe('Resource Protection Error Messages', () => {
    test('should provide clear error message with current operation counts', async () => {
      // Set operation count to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      expect(result.errors).toContain('Maximum concurrent operations reached: 10/10');
    });

    test('should handle operation count over limit', async () => {
      // Set operation count above maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 15;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      expect(result.errors).toContain('Maximum concurrent operations reached: 15/10');
    });

    test('should provide system capacity message', async () => {
      // Set operation count to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('System at capacity');
    });
  });

  describe('Resource Protection Performance', () => {
    test('should quickly reject when at capacity', async () => {
      // Set operation count to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const startTime = Date.now();
      const result = await orchestrator.executeTransaction(validContext);
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      
      // Should be rejected very quickly (within 100ms)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });

    test('should not waste resources on blocked operations', async () => {
      // Set operation count to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      // Spy to ensure core transaction is never called
      const coreTransactionSpy = jest.spyOn(orchestrator as any, 'executeDefensiveTransaction');

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      
      // Core transaction should never be called when blocked by resource protection
      expect(coreTransactionSpy).not.toHaveBeenCalled();
    });
  });
});