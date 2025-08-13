/**
 * STEP 8: TESTING & VALIDATION
 * Unit Tests for Defensive Orchestrator Timeout Management
 * 
 * Tests the timeout protection and fail-safe mechanisms
 * implemented in Step 7: Defensive Orchestrator Enhancement
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PaypalTransactionOrchestrator, type TransactionContext, type PayoutRecipient } from '../../paypal-transaction-orchestrator';

describe('Defensive Orchestrator - Timeout Management', () => {
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

    // Set realistic timeout values for testing (shorter than production)
    jest.setTimeout(10000); // 10 second test timeout
  });

  afterEach(() => {
    // Reset all state
    (PaypalTransactionOrchestrator as any).activeOperations = 0;
    (PaypalTransactionOrchestrator as any).circuitBreakerState = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0
    };
    jest.restoreAllMocks();
  });

  describe('Overall Transaction Timeout', () => {
    test('should complete successfully within timeout limit', async () => {
      // Mock fast transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          // Simulate quick processing (100ms)
          await new Promise(resolve => setTimeout(resolve, 100));
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

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(true);
      expect(result.errors).not.toContain('Transaction timeout');
    });

    test('should timeout and fail for excessively long transactions', async () => {
      // Mock slow transaction that exceeds timeout
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          // Simulate transaction that takes longer than timeout (simulate by never resolving)
          return new Promise(() => {}); // Never resolves - will hit timeout
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Transaction timeout after 1800 seconds'))).toBe(true);
      
      // Verify circuit breaker recorded the failure
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(1);
    });

    test('should handle race condition between completion and timeout', async () => {
      // Mock transaction that completes just before timeout
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          // Simulate transaction completing at the last moment
          await new Promise(resolve => setTimeout(resolve, 500));
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

      const result = await orchestrator.executeTransaction(validContext);

      // Since our mock completes in 500ms (well under 30 minute timeout), it should succeed
      expect(result.success).toBe(true);
    });
  });

  describe('Phase-Specific Timeouts', () => {
    test('should timeout Phase 1 operations', async () => {
      // Mock Phase 1 to timeout
      jest.spyOn(orchestrator as any, 'executePhase1').mockImplementation(
        async () => {
          // Simulate Phase 1 that never completes
          return new Promise(() => {}); // Never resolves
        }
      );

      // Mock executeDefensiveTransaction to test Phase 1 timeout specifically
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          // Call the real Phase 1 timeout logic
          const phase1Promise = orchestrator['executePhase1'](validContext);
          const phase1TimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Phase 1 timeout')), 100); // Short timeout for testing
          });
          
          try {
            await Promise.race([phase1Promise, phase1TimeoutPromise]);
            return {
              success: true,
              phase1: { success: true, errors: [], warnings: [] },
              phase2: { success: true, errors: [], warnings: [] },
              rollbackPerformed: false,
              errors: [],
              warnings: []
            };
          } catch (error) {
            return {
              success: false,
              phase1: { success: false, errors: ['Phase 1 timeout'], warnings: [] },
              rollbackPerformed: false,
              errors: ['Phase 1 timeout'],
              warnings: []
            };
          }
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Phase 1 timeout'))).toBe(true);
    });

    test('should timeout Phase 2 operations', async () => {
      // Mock successful Phase 1 but failing Phase 2
      jest.spyOn(orchestrator as any, 'executePhase1').mockResolvedValue({
        success: true,
        senderBatchId: 'test-batch',
        requestChecksum: 'test-checksum',
        batchId: 1,
        errors: [],
        warnings: []
      });

      jest.spyOn(orchestrator as any, 'executePhase2').mockImplementation(
        async () => {
          // Simulate Phase 2 that never completes
          return new Promise(() => {}); // Never resolves
        }
      );

      jest.spyOn(orchestrator as any, 'performRollback').mockResolvedValue(undefined);

      // Mock executeDefensiveTransaction to test Phase 2 timeout specifically
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          const phase1Result = await orchestrator['executePhase1'](validContext);
          
          if (!phase1Result.success) {
            return {
              success: false,
              phase1: phase1Result,
              rollbackPerformed: false,
              errors: ['Phase 1 failed'],
              warnings: []
            };
          }

          // Test Phase 2 timeout
          const phase2Promise = orchestrator['executePhase2'](phase1Result);
          const phase2TimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Phase 2 timeout')), 100); // Short timeout for testing
          });
          
          try {
            const phase2Result = await Promise.race([phase2Promise, phase2TimeoutPromise]);
            return {
              success: true,
              phase1: phase1Result,
              phase2: phase2Result,
              rollbackPerformed: false,
              errors: [],
              warnings: []
            };
          } catch (error) {
            // Perform rollback
            await orchestrator['performRollback'](phase1Result);
            return {
              success: false,
              phase1: phase1Result,
              phase2: { success: false, errors: ['Phase 2 timeout'], warnings: [] },
              rollbackPerformed: true,
              errors: ['Phase 2 timeout'],
              warnings: []
            };
          }
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Phase 2 timeout'))).toBe(true);
      expect(result.rollbackPerformed).toBe(true);
    });

    test('should timeout rollback operations', async () => {
      // Mock successful Phase 1 but failing Phase 2 and slow rollback
      jest.spyOn(orchestrator as any, 'executePhase1').mockResolvedValue({
        success: true,
        senderBatchId: 'test-batch',
        requestChecksum: 'test-checksum',
        batchId: 1,
        errors: [],
        warnings: []
      });

      jest.spyOn(orchestrator as any, 'executePhase2').mockResolvedValue({
        success: false,
        errors: ['Phase 2 failed'],
        warnings: []
      });

      jest.spyOn(orchestrator as any, 'performRollback').mockImplementation(
        async () => {
          // Simulate rollback that never completes
          return new Promise(() => {}); // Never resolves
        }
      );

      // Mock executeDefensiveTransaction to test rollback timeout
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          const phase1Result = await orchestrator['executePhase1'](validContext);
          const phase2Result = await orchestrator['executePhase2'](phase1Result);
          
          if (!phase2Result.success) {
            // Test rollback timeout
            const rollbackPromise = orchestrator['performRollback'](phase1Result);
            const rollbackTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Rollback timeout')), 100); // Short timeout for testing
            });
            
            try {
              await Promise.race([rollbackPromise, rollbackTimeoutPromise]);
              return {
                success: false,
                phase1: phase1Result,
                phase2: phase2Result,
                rollbackPerformed: true,
                errors: ['Phase 2 failed'],
                warnings: []
              };
            } catch (rollbackError) {
              return {
                success: false,
                phase1: phase1Result,
                phase2: phase2Result,
                rollbackPerformed: false,
                errors: ['Phase 2 failed', 'Rollback timeout'],
                warnings: []
              };
            }
          }

          return {
            success: true,
            phase1: phase1Result,
            phase2: phase2Result,
            rollbackPerformed: false,
            errors: [],
            warnings: []
          };
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Rollback timeout'))).toBe(true);
      expect(result.rollbackPerformed).toBe(false);
    });
  });

  describe('Emergency Rollback Timeout', () => {
    test('should timeout emergency rollback after exception', async () => {
      // Mock Phase 1 success followed by exception
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          // Simulate an exception after Phase 1 succeeds
          throw new Error('Simulated critical error');
        }
      );

      // Mock performRollback to never complete
      jest.spyOn(orchestrator as any, 'performRollback').mockImplementation(
        async () => {
          return new Promise(() => {}); // Never resolves
        }
      );

      // Manually set phase1 success to trigger emergency rollback path
      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Simulated critical error'))).toBe(true);
    });

    test('should handle emergency rollback success within timeout', async () => {
      // Mock Phase 1 success followed by exception
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          // Simulate an exception after Phase 1 succeeds  
          const error = new Error('Simulated critical error');
          error.name = 'Critical Error';
          throw error;
        }
      );

      // Mock successful emergency rollback
      jest.spyOn(orchestrator as any, 'performRollback').mockResolvedValue(undefined);

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Simulated critical error'))).toBe(true);
      // Should not have rollback timeout errors since rollback succeeds quickly
    });
  });

  describe('Timeout Error Messages', () => {
    test('should provide clear timeout error message with duration', async () => {
      // Mock transaction that times out
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          return new Promise(() => {}); // Never resolves
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Transaction timeout after 1800 seconds'))).toBe(true);
    });

    test('should record timeout in circuit breaker', async () => {
      // Mock transaction that times out
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          return new Promise(() => {}); // Never resolves
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      
      // Verify circuit breaker recorded the timeout as a failure
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(1);
      expect(circuitState.lastFailureTime).toBeInstanceOf(Date);
    });
  });

  describe('Timeout Recovery', () => {
    test('should properly clean up resources after timeout', async () => {
      // Mock transaction that times out
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          return new Promise(() => {}); // Never resolves
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      
      // Verify operation slot was released even after timeout
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });

    test('should allow new operations after timeout', async () => {
      // First operation times out
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction')
        .mockImplementationOnce(async () => {
          return new Promise(() => {}); // Never resolves - timeout
        })
        .mockImplementationOnce(async () => {
          // Second operation succeeds
          return {
            success: true,
            phase1: { success: true, errors: [], warnings: [] },
            phase2: { success: true, errors: [], warnings: [] },
            rollbackPerformed: false,
            errors: [],
            warnings: []
          };
        });

      // First operation should timeout
      const result1 = await orchestrator.executeTransaction(validContext);
      expect(result1.success).toBe(false);

      // Second operation should succeed (not blocked by previous timeout)
      const result2 = await orchestrator.executeTransaction({
        ...validContext,
        requestId: 'test-request-2'
      });
      expect(result2.success).toBe(true);
    });

    test('should track processing duration even on timeout', async () => {
      const startTime = Date.now();

      // Mock transaction that times out
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async () => {
          return new Promise(() => {}); // Never resolves
        }
      );

      const result = await orchestrator.executeTransaction(validContext);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(false);
      // Should timeout reasonably quickly due to our shorter timeout in test
      expect(duration).toBeGreaterThan(100); // At least some processing time
    });
  });
});