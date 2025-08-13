/**
 * STEP 8: TESTING & VALIDATION
 * Integration Tests for Defensive Orchestrator Complete System
 * 
 * Tests the full 5-layer defensive architecture working together
 * implemented in Step 7: Defensive Orchestrator Enhancement
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PaypalTransactionOrchestrator, type TransactionContext, type PayoutRecipient } from '../../paypal-transaction-orchestrator';

describe('Defensive Orchestrator - Integration Tests', () => {
  let orchestrator: PaypalTransactionOrchestrator;
  let validContext: TransactionContext;

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
    
    // Reset all defensive state
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
    // Reset all state
    (PaypalTransactionOrchestrator as any).circuitBreakerState = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0
    };
    (PaypalTransactionOrchestrator as any).activeOperations = 0;
    jest.restoreAllMocks();
  });

  describe('Defensive Layer Execution Order', () => {
    test('should execute defensive layers in correct order: validation → circuit breaker → resource protection → timeout → cleanup', async () => {
      const executionOrder: string[] = [];

      // Mock validateTransactionContext to track execution
      jest.spyOn(orchestrator as any, 'validateTransactionContext').mockImplementation((...args) => {
        executionOrder.push('Layer 1: Input Validation');
        return {
          valid: true,
          errors: [],
          sanitized: args[0]
        };
      });

      // Mock checkCircuitBreaker to track execution
      jest.spyOn(orchestrator as any, 'checkCircuitBreaker').mockImplementation(() => {
        executionOrder.push('Layer 2: Circuit Breaker');
        return { allowed: true };
      });

      // Mock acquireOperationSlot to track execution
      jest.spyOn(orchestrator as any, 'acquireOperationSlot').mockImplementation(async () => {
        executionOrder.push('Layer 3: Resource Protection');
        return { acquired: true };
      });

      // Mock executeDefensiveTransaction to track timeout wrapper
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(async () => {
        executionOrder.push('Layer 4: Timeout Protection');
        return {
          success: true,
          phase1: { success: true, errors: [], warnings: [] },
          phase2: { success: true, errors: [], warnings: [] },
          rollbackPerformed: false,
          errors: [],
          warnings: []
        };
      });

      // Mock recordCircuitBreakerResult to track execution
      jest.spyOn(orchestrator as any, 'recordCircuitBreakerResult').mockImplementation(() => {
        executionOrder.push('Layer 5: Circuit Breaker Recording');
      });

      // Mock releaseOperationSlot to track cleanup
      jest.spyOn(orchestrator as any, 'releaseOperationSlot').mockImplementation(() => {
        executionOrder.push('Cleanup: Resource Release');
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(true);
      expect(executionOrder).toEqual([
        'Layer 1: Input Validation',
        'Layer 2: Circuit Breaker',
        'Layer 3: Resource Protection',
        'Layer 4: Timeout Protection',
        'Layer 5: Circuit Breaker Recording',
        'Cleanup: Resource Release'
      ]);
    });

    test('should stop at first failing defensive layer', async () => {
      const executionOrder: string[] = [];

      // Mock input validation to fail
      jest.spyOn(orchestrator as any, 'validateTransactionContext').mockImplementation(() => {
        executionOrder.push('Layer 1: Input Validation');
        return {
          valid: false,
          errors: ['Validation failed'],
          sanitized: undefined
        };
      });

      // Mock other layers to track if they're called
      jest.spyOn(orchestrator as any, 'checkCircuitBreaker').mockImplementation(() => {
        executionOrder.push('Layer 2: Circuit Breaker');
        return { allowed: true };
      });

      jest.spyOn(orchestrator as any, 'acquireOperationSlot').mockImplementation(async () => {
        executionOrder.push('Layer 3: Resource Protection');
        return { acquired: true };
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Input validation failed');
      
      // Should only execute first layer
      expect(executionOrder).toEqual(['Layer 1: Input Validation']);
    });
  });

  describe('Multi-Layer Defensive Scenarios', () => {
    test('should handle circuit breaker blocking after successful validation', async () => {
      // Open circuit breaker
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date();

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Circuit breaker protection active');
      
      // Should not have triggered resource protection
      expect(result.errors).not.toContain('Resource protection active');
    });

    test('should handle resource protection blocking after circuit breaker allows', async () => {
      // Set operations to maximum
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Resource protection active');
      
      // Should not have circuit breaker errors
      expect(result.errors).not.toContain('Circuit breaker protection active');
    });

    test('should prioritize circuit breaker over resource protection', async () => {
      // Open circuit breaker AND set max operations
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date();
      
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      // Should get circuit breaker error first
      expect(result.errors).toContain('Circuit breaker protection active');
      expect(result.errors).not.toContain('Resource protection active');
    });

    test('should handle input validation errors with invalid data and blocked circuit', async () => {
      // Create invalid context with bad email
      const invalidContext = {
        ...validContext,
        recipients: [{
          ...validContext.recipients[0],
          paypalEmail: 'invalid-email'
        }]
      };

      // Also open circuit breaker
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date();

      const result = await orchestrator.executeTransaction(invalidContext);

      expect(result.success).toBe(false);
      // Should get validation error first, not circuit breaker
      expect(result.errors).toContain('Input validation failed');
      expect(result.errors).not.toContain('Circuit breaker protection active');
    });
  });

  describe('End-to-End Defensive Flow', () => {
    test('should successfully process valid request through all defensive layers', async () => {
      // Mock successful core transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { 
          success: true, 
          senderBatchId: 'test-batch',
          requestChecksum: 'test-checksum',
          batchId: 1,
          errors: [], 
          warnings: [] 
        },
        phase2: { 
          success: true, 
          paypalBatchId: 'paypal-123',
          successfulCount: 1,
          failedCount: 0,
          pendingCount: 0,
          errors: [], 
          warnings: [] 
        },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Verify all layers allowed the operation
      expect(result.errors).not.toContain('Input validation failed');
      expect(result.errors).not.toContain('Circuit breaker protection active');
      expect(result.errors).not.toContain('Resource protection active');
      expect(result.errors).not.toContain('Transaction timeout');
      
      // Verify operation slot was released
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });

    test('should handle failure with proper cleanup across all layers', async () => {
      // Mock core transaction to fail
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: false,
        phase1: { success: false, errors: ['Core failure'], warnings: [] },
        rollbackPerformed: false,
        errors: ['Core transaction failed'],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Core transaction failed');
      
      // Verify circuit breaker recorded the failure
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(1);
      
      // Verify operation slot was released despite failure
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });

    test('should handle exception with emergency rollback and full cleanup', async () => {
      // Mock core transaction to throw exception
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(async () => {
        throw new Error('Simulated system failure');
      });

      // Mock emergency rollback
      jest.spyOn(orchestrator as any, 'performRollback').mockResolvedValue(undefined);

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Simulated system failure'))).toBe(true);
      
      // Verify circuit breaker recorded the exception
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(1);
      
      // Verify operation slot was released even after exception
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });
  });

  describe('Defensive Layer State Management', () => {
    test('should maintain circuit breaker state across multiple operations', async () => {
      // Mock failing transactions
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: false,
        phase1: { success: false, errors: ['Failure'], warnings: [] },
        rollbackPerformed: false,
        errors: ['Transaction failed'],
        warnings: []
      });

      // Execute multiple failing operations
      for (let i = 0; i < 3; i++) {
        await orchestrator.executeTransaction({
          ...validContext,
          requestId: `test-request-${i}`
        });
      }

      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(3);
      expect(circuitState.state).toBe('closed'); // Still closed, hasn't reached threshold
      
      // Two more failures should open circuit
      for (let i = 3; i < 5; i++) {
        await orchestrator.executeTransaction({
          ...validContext,
          requestId: `test-request-${i}`
        });
      }

      expect(circuitState.failureCount).toBe(5);
      expect(circuitState.state).toBe('open');
    });

    test('should handle resource contention correctly', async () => {
      const operations: Promise<any>[] = [];
      let successCount = 0;
      let rejectedCount = 0;

      // Mock slow transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          success: true,
          phase1: { success: true, errors: [], warnings: [] },
          phase2: { success: true, errors: [], warnings: [] },
          rollbackPerformed: false,
          errors: [],
          warnings: []
        };
      });

      // Start 15 concurrent operations (more than limit of 10)
      for (let i = 0; i < 15; i++) {
        const operation = orchestrator.executeTransaction({
          ...validContext,
          requestId: `test-request-${i}`
        });
        operations.push(operation);
      }

      const results = await Promise.all(operations);

      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else if (result.errors.includes('Resource protection active')) {
          rejectedCount++;
        }
      });

      expect(successCount).toBe(10); // Maximum concurrent operations
      expect(rejectedCount).toBe(5);  // Rejected due to resource protection
      expect(successCount + rejectedCount).toBe(15);
    });
  });

  describe('Defensive Performance Impact', () => {
    test('should have minimal performance overhead for successful operations', async () => {
      // Mock fast successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const startTime = Date.now();
      const result = await orchestrator.executeTransaction(validContext);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      
      // Defensive overhead should be minimal (under 50ms for our mocked scenario)
      const overhead = endTime - startTime;
      expect(overhead).toBeLessThan(50);
    });

    test('should quickly reject invalid requests without expensive processing', async () => {
      // Create invalid context
      const invalidContext = {
        ...validContext,
        cycleSettingId: null as any // Invalid cycle ID
      };

      const startTime = Date.now();
      const result = await orchestrator.executeTransaction(invalidContext);
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Input validation failed');
      
      // Should reject very quickly (under 10ms)
      const rejectionTime = endTime - startTime;
      expect(rejectionTime).toBeLessThan(10);
    });

    test('should efficiently handle circuit breaker blocks', async () => {
      // Open circuit breaker
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date();

      const startTime = Date.now();
      const result = await orchestrator.executeTransaction(validContext);
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Circuit breaker protection active');
      
      // Should block very quickly (under 10ms)
      const blockTime = endTime - startTime;
      expect(blockTime).toBeLessThan(10);
    });
  });

  describe('Defensive Layer Recovery Scenarios', () => {
    test('should recover from circuit breaker open state after timeout', async () => {
      // Open circuit breaker with old failure time
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date(Date.now() - 400000); // 6+ minutes ago

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
      expect(circuitState.state).toBe('half-open');
    });

    test('should handle resource contention relief', async () => {
      // Start with max operations
      (PaypalTransactionOrchestrator as any).activeOperations = 10;

      // First request should be rejected
      let result1 = await orchestrator.executeTransaction(validContext);
      expect(result1.success).toBe(false);
      expect(result1.errors).toContain('Resource protection active');

      // Simulate operations completing
      (PaypalTransactionOrchestrator as any).activeOperations = 5;

      // Mock successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      // Second request should succeed
      let result2 = await orchestrator.executeTransaction({
        ...validContext,
        requestId: 'test-request-2'
      });
      expect(result2.success).toBe(true);
    });
  });
});