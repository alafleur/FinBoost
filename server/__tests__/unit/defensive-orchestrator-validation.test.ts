/**
 * STEP 8: TESTING & VALIDATION
 * Unit Tests for Defensive Orchestrator Input Validation
 * 
 * Tests the comprehensive input validation and sanitization mechanisms
 * implemented in Step 7: Defensive Orchestrator Enhancement
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PaypalTransactionOrchestrator, type TransactionContext, type PayoutRecipient } from '../../paypal-transaction-orchestrator';

describe('Defensive Orchestrator - Input Validation', () => {
  let orchestrator: PaypalTransactionOrchestrator;
  let validContext: TransactionContext;
  let validRecipients: PayoutRecipient[];

  beforeEach(() => {
    orchestrator = new PaypalTransactionOrchestrator();
    
    // Valid test data baseline
    validRecipients = [
      {
        cycleWinnerSelectionId: 1,
        userId: 100,
        paypalEmail: 'test@example.com',
        amount: 2500, // $25.00
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

  describe('Cycle ID Validation', () => {
    test('should reject null cycle ID', async () => {
      const context = { ...validContext, cycleSettingId: null as any };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Input validation failed');
      expect(result.errors.some(error => error.includes('Invalid cycle ID'))).toBe(true);
    });

    test('should reject zero cycle ID', async () => {
      const context = { ...validContext, cycleSettingId: 0 };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Cycle ID must be >= 1'))).toBe(true);
    });

    test('should reject non-number cycle ID', async () => {
      const context = { ...validContext, cycleSettingId: 'invalid' as any };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid cycle ID'))).toBe(true);
    });

    test('should accept valid cycle ID', async () => {
      const context = { ...validContext, cycleSettingId: 5 };
      
      // Mock the rest of the pipeline to focus on validation
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Admin ID Validation', () => {
    test('should reject null admin ID', async () => {
      const context = { ...validContext, adminId: null as any };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid admin ID'))).toBe(true);
    });

    test('should reject admin ID exceeding maximum', async () => {
      const context = { ...validContext, adminId: 1000000000 }; // Exceeds MAX_ADMIN_ID
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Admin ID exceeds maximum'))).toBe(true);
    });

    test('should accept valid admin ID', async () => {
      const context = { ...validContext, adminId: 999999999 }; // At max limit
      
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Recipients Array Validation', () => {
    test('should reject non-array recipients', async () => {
      const context = { ...validContext, recipients: 'invalid' as any };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Recipients must be an array'))).toBe(true);
    });

    test('should reject empty recipients array', async () => {
      const context = { ...validContext, recipients: [] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Recipients array cannot be empty'))).toBe(true);
    });

    test('should reject too many recipients', async () => {
      // Create array exceeding MAX_RECIPIENTS_PER_BATCH (15000)
      const tooManyRecipients = Array(15001).fill(validRecipients[0]);
      const context = { ...validContext, recipients: tooManyRecipients };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Too many recipients'))).toBe(true);
    });
  });

  describe('Email Validation and Sanitization', () => {
    test('should reject invalid email format', async () => {
      const invalidEmailRecipient = { ...validRecipients[0], paypalEmail: 'invalid-email' };
      const context = { ...validContext, recipients: [invalidEmailRecipient] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid email format'))).toBe(true);
    });

    test('should reject email exceeding length limit', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // Exceeds 254 char limit
      const longEmailRecipient = { ...validRecipients[0], paypalEmail: longEmail };
      const context = { ...validContext, recipients: [longEmailRecipient] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Email too long'))).toBe(true);
    });

    test('should sanitize email (trim and lowercase)', async () => {
      const messyEmailRecipient = { ...validRecipients[0], paypalEmail: '  TEST@EXAMPLE.COM  ' };
      const context = { ...validContext, recipients: [messyEmailRecipient] };
      
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async (...args: any[]) => {
          const sanitizedContext = args[0] as TransactionContext;
          // Verify email was sanitized
          expect(sanitizedContext.recipients[0].paypalEmail).toBe('test@example.com');
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

      const result = await orchestrator.executeTransaction(context);
      expect(result.success).toBe(true);
    });

    test('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'x@y.z',
        'test123@sub.domain.com'
      ];

      for (const email of validEmails) {
        const emailRecipient = { ...validRecipients[0], paypalEmail: email };
        const context = { ...validContext, recipients: [emailRecipient] };
        
        jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
          success: true,
          phase1: { success: true, errors: [], warnings: [] },
          phase2: { success: true, errors: [], warnings: [] },
          rollbackPerformed: false,
          errors: [],
          warnings: []
        });

        const result = await orchestrator.executeTransaction(context);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Amount Validation', () => {
    test('should reject non-number amounts', async () => {
      const invalidAmountRecipient = { ...validRecipients[0], amount: 'invalid' as any };
      const context = { ...validContext, recipients: [invalidAmountRecipient] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid amount (must be a number)'))).toBe(true);
    });

    test('should reject NaN amounts', async () => {
      const nanAmountRecipient = { ...validRecipients[0], amount: NaN };
      const context = { ...validContext, recipients: [nanAmountRecipient] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid amount (must be a number)'))).toBe(true);
    });

    test('should reject amounts below minimum', async () => {
      const lowAmountRecipient = { ...validRecipients[0], amount: 0 }; // Below $0.01 minimum
      const context = { ...validContext, recipients: [lowAmountRecipient] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Amount too low'))).toBe(true);
    });

    test('should reject amounts above maximum', async () => {
      const highAmountRecipient = { ...validRecipients[0], amount: 6000001 }; // Above $60,000 maximum
      const context = { ...validContext, recipients: [highAmountRecipient] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Amount too high'))).toBe(true);
    });

    test('should accept valid amount range', async () => {
      const validAmounts = [1, 100, 2500, 6000000]; // $0.01, $1.00, $25.00, $60,000
      
      for (const amount of validAmounts) {
        const amountRecipient = { ...validRecipients[0], amount };
        const context = { ...validContext, recipients: [amountRecipient], totalAmount: amount };
        
        jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
          success: true,
          phase1: { success: true, errors: [], warnings: [] },
          phase2: { success: true, errors: [], warnings: [] },
          rollbackPerformed: false,
          errors: [],
          warnings: []
        });

        const result = await orchestrator.executeTransaction(context);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Currency Validation and Defaults', () => {
    test('should default missing currency to USD', async () => {
      const noCurrencyRecipient = { ...validRecipients[0] };
      delete (noCurrencyRecipient as any).currency;
      const context = { ...validContext, recipients: [noCurrencyRecipient] };
      
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async (...args: any[]) => {
          const sanitizedContext = args[0] as TransactionContext;
          // Verify currency was defaulted to USD
          expect(sanitizedContext.recipients[0].currency).toBe('USD');
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

      const result = await orchestrator.executeTransaction(context);
      expect(result.success).toBe(true);
    });

    test('should reject non-USD currencies', async () => {
      const eurRecipient = { ...validRecipients[0], currency: 'EUR' };
      const context = { ...validContext, recipients: [eurRecipient] };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Only USD currency is supported'))).toBe(true);
    });

    test('should normalize currency case', async () => {
      const lowercaseUsdRecipient = { ...validRecipients[0], currency: 'usd' };
      const context = { ...validContext, recipients: [lowercaseUsdRecipient] };
      
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async (...args: any[]) => {
          const sanitizedContext = args[0] as TransactionContext;
          // Verify currency was normalized to uppercase
          expect(sanitizedContext.recipients[0].currency).toBe('USD');
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

      const result = await orchestrator.executeTransaction(context);
      expect(result.success).toBe(true);
    });
  });

  describe('Total Amount Safety Limits', () => {
    test('should reject total amount exceeding safety limit', async () => {
      const context = { ...validContext, totalAmount: 10000000001 }; // Exceeds $100M safety limit
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Total amount exceeds safety limit'))).toBe(true);
    });

    test('should accept total amount at safety limit', async () => {
      const context = { ...validContext, totalAmount: 10000000000 }; // Exactly $100M limit
      
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockResolvedValue({
        success: true,
        phase1: { success: true, errors: [], warnings: [] },
        phase2: { success: true, errors: [], warnings: [] },
        rollbackPerformed: false,
        errors: [],
        warnings: []
      });

      const result = await orchestrator.executeTransaction(context);
      expect(result.success).toBe(true);
    });
  });

  describe('Request ID and Sender Batch ID Validation', () => {
    test('should reject missing request ID', async () => {
      const context = { ...validContext, requestId: '' };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid request ID'))).toBe(true);
    });

    test('should reject request ID exceeding length limit', async () => {
      const longRequestId = 'a'.repeat(501); // Exceeds 500 char limit
      const context = { ...validContext, requestId: longRequestId };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Request ID too long'))).toBe(true);
    });

    test('should reject sender batch ID exceeding PayPal limit', async () => {
      const longSenderBatchId = 'a'.repeat(128); // Exceeds 127 char PayPal limit
      const context = { ...validContext, senderBatchId: longSenderBatchId };
      
      const result = await orchestrator.executeTransaction(context);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Sender batch ID too long'))).toBe(true);
    });

    test('should trim and accept valid request ID', async () => {
      const context = { ...validContext, requestId: '  valid-request-id  ' };
      
      jest.spyOn(orchestrator as any, 'executeDefensiveTransaction').mockImplementation(
        async (...args: any[]) => {
          const sanitizedContext = args[0] as TransactionContext;
          // Verify request ID was trimmed
          expect(sanitizedContext.requestId).toBe('valid-request-id');
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

      const result = await orchestrator.executeTransaction(context);
      expect(result.success).toBe(true);
    });
  });
});