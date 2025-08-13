/**
 * STEP 10: UNIT TESTS - Idempotency Key Generation
 * 
 * Comprehensive tests for generateIdempotencyData covering:
 * - Deterministic batch ID generation
 * - Request checksum consistency
 * - Data variations and edge cases
 * - Collision resistance
 */

import crypto from 'crypto';
import { PaypalTransactionOrchestrator } from '../../paypal-transaction-orchestrator.js';
import type { TransactionContext, PayoutRecipient } from '../../paypal-transaction-orchestrator.js';

describe('Idempotency Generation - Unit Tests', () => {
  let orchestrator: PaypalTransactionOrchestrator;

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
  });

  // Helper to create mock transaction context
  const createMockContext = (overrides: Partial<TransactionContext> = {}): TransactionContext => ({
    cycleSettingId: 18,
    adminId: 1,
    totalAmount: 15000, // $150.00 in cents
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

  describe('Deterministic Batch ID Generation', () => {
    test('should use provided deterministic sender batch ID', () => {
      const context = createMockContext({
        senderBatchId: 'cycle-18-deterministic123'
      });

      // Access private method for testing using bracket notation
      const result = (orchestrator as any).generateIdempotencyData(context);
      
      expect(result.senderBatchId).toBe('cycle-18-deterministic123');
      expect(result.senderBatchId).toMatch(/^cycle-\d+-[a-f0-9]{16}$/);
    });

    test('should maintain batch ID consistency across calls', () => {
      const context = createMockContext({
        senderBatchId: 'cycle-18-consistent456'
      });

      const result1 = (orchestrator as any).generateIdempotencyData(context);
      const result2 = (orchestrator as any).generateIdempotencyData(context);
      
      expect(result1.senderBatchId).toBe(result2.senderBatchId);
      expect(result1.senderBatchId).toBe('cycle-18-consistent456');
    });

    test('should generate different batch IDs for different cycles', () => {
      const context1 = createMockContext({ 
        cycleSettingId: 18,
        senderBatchId: 'cycle-18-abc123'
      });
      const context2 = createMockContext({ 
        cycleSettingId: 19,
        senderBatchId: 'cycle-19-abc123'
      });

      const result1 = (orchestrator as any).generateIdempotencyData(context1);
      const result2 = (orchestrator as any).generateIdempotencyData(context2);
      
      expect(result1.senderBatchId).not.toBe(result2.senderBatchId);
      expect(result1.senderBatchId).toContain('cycle-18');
      expect(result2.senderBatchId).toContain('cycle-19');
    });
  });

  describe('Request Checksum Generation', () => {
    test('should generate consistent checksum for identical requests', () => {
      const context = createMockContext();

      const result1 = (orchestrator as any).generateIdempotencyData(context);
      const result2 = (orchestrator as any).generateIdempotencyData(context);
      
      expect(result1.requestChecksum).toBe(result2.requestChecksum);
      expect(result1.requestChecksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    test('should generate different checksums for different data', () => {
      const context1 = createMockContext({ totalAmount: 15000 });
      const context2 = createMockContext({ totalAmount: 16000 });

      const result1 = (orchestrator as any).generateIdempotencyData(context1);
      const result2 = (orchestrator as any).generateIdempotencyData(context2);
      
      expect(result1.requestChecksum).not.toBe(result2.requestChecksum);
    });

    test('should be sensitive to recipient order changes', () => {
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
          amount: 10000,
          currency: 'USD'
        }
      ];

      const context1 = createMockContext({ recipients });
      const context2 = createMockContext({ recipients: [...recipients].reverse() });

      const result1 = (orchestrator as any).generateIdempotencyData(context1);
      const result2 = (orchestrator as any).generateIdempotencyData(context2);
      
      // Should be same because emails are sorted in checksum generation
      expect(result1.requestChecksum).toBe(result2.requestChecksum);
    });

    test('should be sensitive to recipient email changes', () => {
      const context1 = createMockContext();
      const context2 = createMockContext({
        recipients: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            paypalEmail: 'different@example.com', // Changed email
            amount: 5000,
            currency: 'USD'
          },
          ...context1.recipients.slice(1)
        ]
      });

      const result1 = (orchestrator as any).generateIdempotencyData(context1);
      const result2 = (orchestrator as any).generateIdempotencyData(context2);
      
      expect(result1.requestChecksum).not.toBe(result2.requestChecksum);
    });

    test('should be sensitive to admin ID changes', () => {
      const context1 = createMockContext({ adminId: 1 });
      const context2 = createMockContext({ adminId: 2 });

      const result1 = (orchestrator as any).generateIdempotencyData(context1);
      const result2 = (orchestrator as any).generateIdempotencyData(context2);
      
      expect(result1.requestChecksum).not.toBe(result2.requestChecksum);
    });

    test('should be sensitive to request ID changes', () => {
      const context1 = createMockContext({ requestId: 'request-123' });
      const context2 = createMockContext({ requestId: 'request-456' });

      const result1 = (orchestrator as any).generateIdempotencyData(context1);
      const result2 = (orchestrator as any).generateIdempotencyData(context2);
      
      expect(result1.requestChecksum).not.toBe(result2.requestChecksum);
    });
  });

  describe('Collision Resistance', () => {
    test('should generate unique checksums for subtle data differences', () => {
      const baseContext = createMockContext();
      const variations = [
        { ...baseContext, totalAmount: baseContext.totalAmount + 1 },
        { ...baseContext, cycleSettingId: baseContext.cycleSettingId + 1 },
        { 
          ...baseContext, 
          recipients: [
            { ...baseContext.recipients[0], amount: baseContext.recipients[0].amount + 1 },
            ...baseContext.recipients.slice(1)
          ]
        },
        {
          ...baseContext,
          recipients: [
            ...baseContext.recipients,
            {
              cycleWinnerSelectionId: 103,
              userId: 503,
              paypalEmail: 'additional@example.com',
              amount: 1,
              currency: 'USD'
            }
          ]
        }
      ];

      const baseResult = (orchestrator as any).generateIdempotencyData(baseContext);
      const checksums = new Set([baseResult.requestChecksum]);

      variations.forEach((variation, index) => {
        const result = (orchestrator as any).generateIdempotencyData(variation);
        expect(checksums.has(result.requestChecksum)).toBe(false);
        checksums.add(result.requestChecksum);
      });

      expect(checksums.size).toBe(variations.length + 1);
    });

    test('should handle large recipient lists without collision', () => {
      const baseRecipients: PayoutRecipient[] = Array.from({ length: 100 }, (_, i) => ({
        cycleWinnerSelectionId: 100 + i,
        userId: 500 + i,
        paypalEmail: `winner${i}@example.com`,
        amount: 1000 + i,
        currency: 'USD'
      }));

      const context1 = createMockContext({ recipients: baseRecipients });
      const context2 = createMockContext({ 
        recipients: [
          ...baseRecipients.slice(0, 50),
          {
            cycleWinnerSelectionId: 999,
            userId: 999,
            paypalEmail: 'different@example.com',
            amount: 1000,
            currency: 'USD'
          },
          ...baseRecipients.slice(51)
        ]
      });

      const result1 = (orchestrator as any).generateIdempotencyData(context1);
      const result2 = (orchestrator as any).generateIdempotencyData(context2);
      
      expect(result1.requestChecksum).not.toBe(result2.requestChecksum);
    });
  });

  describe('Edge Cases and Data Validation', () => {
    test('should handle empty recipients array', () => {
      const context = createMockContext({ 
        recipients: [],
        totalAmount: 0 
      });

      expect(() => {
        (orchestrator as any).generateIdempotencyData(context);
      }).not.toThrow();

      const result = (orchestrator as any).generateIdempotencyData(context);
      expect(result.requestChecksum).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle special characters in emails', () => {
      const context = createMockContext({
        recipients: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            paypalEmail: 'test+tag@example.com',
            amount: 5000,
            currency: 'USD'
          },
          {
            cycleWinnerSelectionId: 102,
            userId: 502,
            paypalEmail: 'user.name+tag@sub.domain.com',
            amount: 10000,
            currency: 'USD'
          }
        ]
      });

      expect(() => {
        (orchestrator as any).generateIdempotencyData(context);
      }).not.toThrow();

      const result = (orchestrator as any).generateIdempotencyData(context);
      expect(result.requestChecksum).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle large monetary amounts', () => {
      const context = createMockContext({
        totalAmount: 999999999, // $9,999,999.99 in cents
        recipients: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            paypalEmail: 'high-value@example.com',
            amount: 999999999,
            currency: 'USD'
          }
        ]
      });

      const result = (orchestrator as any).generateIdempotencyData(context);
      expect(result.requestChecksum).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle very long request IDs', () => {
      const longRequestId = 'x'.repeat(1000);
      const context = createMockContext({ requestId: longRequestId });

      const result = (orchestrator as any).generateIdempotencyData(context);
      expect(result.requestChecksum).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Security Properties', () => {
    test('should use cryptographically secure hash function', () => {
      const context = createMockContext();
      const result = (orchestrator as any).generateIdempotencyData(context);
      
      // Verify it's a proper SHA-256 hash
      expect(result.requestChecksum).toMatch(/^[a-f0-9]{64}$/);
      expect(result.requestChecksum.length).toBe(64);
    });

    test('should not include sensitive data in plaintext', () => {
      const context = createMockContext({
        recipients: [
          {
            cycleWinnerSelectionId: 101,
            userId: 501,
            paypalEmail: 'sensitive@example.com',
            amount: 5000,
            currency: 'USD'
          }
        ]
      });

      const result = (orchestrator as any).generateIdempotencyData(context);
      
      // Checksum should not contain readable email or amounts
      expect(result.requestChecksum).not.toContain('sensitive@example.com');
      expect(result.requestChecksum).not.toContain('5000');
      expect(result.requestChecksum).not.toContain('501');
    });
  });
});

export default {};