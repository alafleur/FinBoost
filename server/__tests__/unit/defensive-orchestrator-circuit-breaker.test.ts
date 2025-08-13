/**
 * STEP 8: TESTING & VALIDATION
 * Unit Tests for Defensive Orchestrator Circuit Breaker Pattern
 * 
 * Tests the circuit breaker fault tolerance mechanisms
 * implemented in Step 7: Defensive Orchestrator Enhancement
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PaypalTransactionOrchestrator, type TransactionContext, type PayoutRecipient } from '../../paypal-transaction-orchestrator';

describe('Defensive Orchestrator - Circuit Breaker Pattern', () => {
  let orchestrator: PaypalTransactionOrchestrator;
  let validContext: TransactionContext;

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
    
    // Reset circuit breaker state before each test
    (PaypalTransactionOrchestrator as any).circuitBreakerState = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0
    };

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
    // Reset circuit breaker state after each test
    (PaypalTransactionOrchestrator as any).circuitBreakerState = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0
    };

    // Reset active operations counter
    (PaypalTransactionOrchestrator as any).activeOperations = 0;

    jest.restoreAllMocks();
  });

  describe('Circuit Breaker State Management', () => {
    test('should start in closed state', async () => {
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      
      expect(circuitState.state).toBe('closed');
      expect(circuitState.failureCount).toBe(0);
      expect(circuitState.lastFailureTime).toBe(null);
      expect(circuitState.successCount).toBe(0);
    });

    test('should allow operations when circuit is closed', async () => {
      // Mock the core transaction to succeed
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
      expect(result.errors).not.toContain('Circuit breaker protection active');
    });

    test('should record failures and increment failure count', async () => {
      // Mock the core transaction to fail
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: false,
        phase1: { success: false, errors: ['Simulated failure'], warnings: [] },
        rollbackPerformed: false,
        errors: ['Simulated failure'],
        warnings: []
      });

      await orchestrator.executeTransaction(validContext);
      
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(1);
      expect(circuitState.lastFailureTime).toBeInstanceOf(Date);
    });

    test('should open circuit after failure threshold', async () => {
      // Mock the core transaction to fail
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: false,
        phase1: { success: false, errors: ['Simulated failure'], warnings: [] },
        rollbackPerformed: false,
        errors: ['Simulated failure'],
        warnings: []
      });

      // Trigger 5 failures to reach threshold
      for (let i = 0; i < 5; i++) {
        await orchestrator.executeTransaction({
          ...validContext,
          requestId: `test-request-${i}`
        });
      }

      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.state).toBe('open');
      expect(circuitState.failureCount).toBe(5);
    });

    test('should block operations when circuit is open', async () => {
      // Manually set circuit to open state
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date();

      const result = await orchestrator.executeTransaction(validContext);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Circuit breaker protection active');
      expect(result.errors.some(error => error.includes('Circuit breaker open due to 5 failures'))).toBe(true);
    });

    test('should transition to half-open after timeout', async () => {
      // Set circuit to open state with old failure time
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date(Date.now() - 400000); // 6+ minutes ago (exceeds 5-minute timeout)

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

    test('should close circuit after successful operations in half-open state', async () => {
      // Set circuit to half-open state
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'half-open';
      circuitState.successCount = 0;

      // Mock successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      // Execute enough successful operations to close circuit (3 max calls)
      for (let i = 0; i < 3; i++) {
        await orchestrator.executeTransaction({
          ...validContext,
          requestId: `test-request-${i}`
        });
      }

      expect(circuitState.state).toBe('closed');
      expect(circuitState.failureCount).toBe(0);
      expect(circuitState.lastFailureTime).toBe(null);
    });

    test('should reopen circuit if failure occurs in half-open state', async () => {
      // Set circuit to half-open state
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'half-open';
      circuitState.successCount = 1;
      circuitState.failureCount = 0;

      // Mock failed transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: false,
        phase1: { success: false, errors: ['Simulated failure'], warnings: [] },
        rollbackPerformed: false,
        errors: ['Simulated failure'],
        warnings: []
      });

      await orchestrator.executeTransaction(validContext);

      expect(circuitState.state).toBe('open');
      expect(circuitState.failureCount).toBe(1);
      expect(circuitState.lastFailureTime).toBeInstanceOf(Date);
    });
  });

  describe('Circuit Breaker Timeout Management', () => {
    test('should calculate correct time remaining for open circuit', async () => {
      // Set circuit to open state with recent failure
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date(Date.now() - 60000); // 1 minute ago

      const result = await orchestrator.executeTransaction(validContext);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Will retry after 4 minutes'))).toBe(true);
    });

    test('should not allow operations before timeout expires', async () => {
      // Set circuit to open state with very recent failure
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date(Date.now() - 1000); // 1 second ago

      const result = await orchestrator.executeTransaction(validContext);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Circuit breaker protection active');
    });

    test('should allow operations after timeout expires', async () => {
      // Set circuit to open state with old failure
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date(Date.now() - 310000); // 5+ minutes ago

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
  });

  describe('Circuit Breaker Success Counting', () => {
    test('should reduce failure count on successful operations in closed state', async () => {
      // Set initial failure count
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.failureCount = 3;

      // Mock successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      await orchestrator.executeTransaction(validContext);

      expect(circuitState.failureCount).toBe(2); // Should be reduced by 1
    });

    test('should track success count in half-open state', async () => {
      // Set circuit to half-open state
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'half-open';
      circuitState.successCount = 0;

      // Mock successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      await orchestrator.executeTransaction(validContext);

      expect(circuitState.successCount).toBe(1);
    });

    test('should prevent failure count from going below zero', async () => {
      // Set initial failure count to 0
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.failureCount = 0;

      // Mock successful transaction
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      await orchestrator.executeTransaction(validContext);

      expect(circuitState.failureCount).toBe(0); // Should remain 0, not go negative
    });
  });

  describe('Circuit Breaker Integration with Other Defensive Layers', () => {
    test('should check circuit breaker before resource protection', async () => {
      // Open the circuit
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      circuitState.state = 'open';
      circuitState.failureCount = 5;
      circuitState.lastFailureTime = new Date();

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Circuit breaker protection active');
      
      // Verify that operation slot was not acquired (since circuit breaker blocked it)
      const activeOperations = (PaypalTransactionOrchestrator as any).activeOperations;
      expect(activeOperations).toBe(0);
    });

    test('should record circuit breaker result after successful operation', async () => {
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
      
      // Verify circuit breaker recorded the success
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(0);
    });

    test('should record circuit breaker failure on timeout', async () => {
      // Mock timeout scenario
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), 100);
        })
      );

      const result = await orchestrator.executeTransaction(validContext);

      expect(result.success).toBe(false);
      
      // Verify circuit breaker recorded the failure
      const circuitState = (PaypalTransactionOrchestrator as any).circuitBreakerState;
      expect(circuitState.failureCount).toBe(1);
      expect(circuitState.lastFailureTime).toBeInstanceOf(Date);
    });
  });
});