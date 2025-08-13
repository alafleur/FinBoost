/**
 * STEP 10: UNIT TESTS - PayPal Response Parsing Edge Cases
 * 
 * Comprehensive tests for parseEnhancedPayoutResponse function covering:
 * - Standard success/failure scenarios
 * - Edge cases and malformed data
 * - Legacy format tolerance
 * - Error handling and validation
 */

import { parseEnhancedPayoutResponse, getMockPayoutResponse } from '../../paypal.js';
import type { ParsedPayoutResponse } from '../../paypal.js';

describe('PayPal Response Parser - Unit Tests', () => {
  
  describe('Standard Response Parsing', () => {
    test('should parse successful payout response correctly', () => {
      const mockResponse = getMockPayoutResponse('success');
      const result = parseEnhancedPayoutResponse(mockResponse);
      
      expect(result.batchStatus).toBe('SUCCESS');
      expect(result.itemCount).toBe(2);
      expect(result.individualResults).toHaveLength(2);
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.paypalBatchId).toMatch(/^MOCK_BATCH_/);
      
      // Verify individual items
      const firstItem = result.individualResults[0];
      expect(firstItem.status).toBe('success');
      expect(firstItem.cycleWinnerSelectionId).toBe(101);
      expect(firstItem.userId).toBe(501);
      expect(firstItem.amount).toBe(5000); // $50.00 in cents
    });

    test('should parse mixed results response correctly', () => {
      const mockResponse = getMockPayoutResponse('mixed');
      const result = parseEnhancedPayoutResponse(mockResponse);
      
      expect(result.batchStatus).toBe('COMPLETED');
      expect(result.itemCount).toBe(3);
      expect(result.individualResults).toHaveLength(3);
      
      // Verify different statuses
      const statuses = result.individualResults.map(item => item.status);
      expect(statuses).toContain('success');
      expect(statuses).toContain('unclaimed');
      expect(statuses).toContain('failed');
      
      // Verify error handling
      const failedItem = result.individualResults.find(item => item.status === 'failed');
      expect(failedItem?.errorCode).toBeDefined();
    });

    test('should parse complete failure response correctly', () => {
      const mockResponse = getMockPayoutResponse('failed');
      const result = parseEnhancedPayoutResponse(mockResponse);
      
      expect(result.batchStatus).toBe('FAILED');
      expect(result.individualResults.every(item => item.status === 'failed')).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed response structure', () => {
      const malformedResponse = {
        batch_header: null,
        items: undefined
      };
      
      expect(() => parseEnhancedPayoutResponse(malformedResponse)).toThrow('Failed to parse PayPal response');
    });

    test('should handle missing batch header', () => {
      const responseWithoutHeader = {
        items: []
      };
      
      expect(() => parseEnhancedPayoutResponse(responseWithoutHeader)).toThrow();
    });

    test('should handle empty items array', () => {
      const emptyResponse = {
        batch_header: {
          payout_batch_id: 'TEST_BATCH',
          batch_status: 'SUCCESS',
          amount: { value: '0.00', currency: 'USD' },
          fees: { value: '0.00', currency: 'USD' }
        },
        items: []
      };
      
      const result = parseEnhancedPayoutResponse(emptyResponse);
      expect(result.itemCount).toBe(0);
      expect(result.individualResults).toHaveLength(0);
    });

    test('should handle invalid amount formats', () => {
      const invalidAmountResponse = {
        batch_header: {
          payout_batch_id: 'TEST_BATCH',
          batch_status: 'SUCCESS',
          amount: { value: 'invalid', currency: 'USD' },
          fees: { value: 'also_invalid', currency: 'USD' }
        },
        items: []
      };
      
      const result = parseEnhancedPayoutResponse(invalidAmountResponse);
      expect(result.totalAmount).toBe(0);
      expect(result.totalFees).toBe(0);
    });

    test('should skip items with invalid sender_item_id format', () => {
      const invalidSenderIdResponse = {
        batch_header: {
          payout_batch_id: 'TEST_BATCH',
          batch_status: 'SUCCESS',
          amount: { value: '100.00', currency: 'USD' },
          fees: { value: '2.00', currency: 'USD' }
        },
        items: [
          {
            payout_item_id: 'VALID_ITEM',
            transaction_status: 'SUCCESS',
            payout_item: {
              sender_item_id: 'winner-123-456', // Valid format
              amount: { value: '50.00', currency: 'USD' },
              receiver: 'valid@example.com'
            }
          },
          {
            payout_item_id: 'INVALID_ITEM',
            transaction_status: 'SUCCESS',
            payout_item: {
              sender_item_id: 'invalid_format_123', // Invalid format
              amount: { value: '50.00', currency: 'USD' },
              receiver: 'invalid@example.com'
            }
          }
        ]
      };
      
      const result = parseEnhancedPayoutResponse(invalidSenderIdResponse);
      expect(result.itemCount).toBe(2); // Reports total from PayPal
      expect(result.individualResults).toHaveLength(1); // Only valid items parsed
      expect(result.individualResults[0].cycleWinnerSelectionId).toBe(123);
    });
  });

  describe('Legacy Format Support', () => {
    test('should parse legacy sender_item_id format', () => {
      const legacyResponse = {
        batch_header: {
          payout_batch_id: 'LEGACY_BATCH',
          batch_status: 'SUCCESS',
          amount: { value: '100.00', currency: 'USD' },
          fees: { value: '2.00', currency: 'USD' }
        },
        items: [
          {
            payout_item_id: 'LEGACY_ITEM',
            transaction_status: 'SUCCESS',
            payout_item: {
              sender_item_id: 'user_456_cycle_18_1234567890', // Legacy format
              amount: { value: '100.00', currency: 'USD' },
              receiver: 'legacy@example.com'
            }
          }
        ]
      };
      
      const result = parseEnhancedPayoutResponse(legacyResponse);
      expect(result.individualResults).toHaveLength(1);
      
      const legacyItem = result.individualResults[0];
      expect(legacyItem.cycleWinnerSelectionId).toBe(-1); // Legacy marker
      expect(legacyItem.userId).toBe(456);
      expect(legacyItem.errorMessage).toContain('[LEGACY_FORMAT: cycle_18]');
    });

    test('should handle mixed legacy and new formats', () => {
      const mixedResponse = {
        batch_header: {
          payout_batch_id: 'MIXED_BATCH',
          batch_status: 'SUCCESS',
          amount: { value: '200.00', currency: 'USD' },
          fees: { value: '4.00', currency: 'USD' }
        },
        items: [
          {
            payout_item_id: 'NEW_ITEM',
            transaction_status: 'SUCCESS',
            payout_item: {
              sender_item_id: 'winner-123-456', // New format
              amount: { value: '100.00', currency: 'USD' },
              receiver: 'new@example.com'
            }
          },
          {
            payout_item_id: 'LEGACY_ITEM',
            transaction_status: 'SUCCESS',
            payout_item: {
              sender_item_id: 'user_789_cycle_18_1234567890', // Legacy format
              amount: { value: '100.00', currency: 'USD' },
              receiver: 'legacy@example.com'
            }
          }
        ]
      };
      
      const result = parseEnhancedPayoutResponse(mixedResponse);
      expect(result.individualResults).toHaveLength(2);
      
      // New format item
      const newItem = result.individualResults[0];
      expect(newItem.cycleWinnerSelectionId).toBe(123);
      expect(newItem.userId).toBe(456);
      expect(newItem.errorMessage).toBeUndefined();
      
      // Legacy format item
      const legacyItem = result.individualResults[1];
      expect(legacyItem.cycleWinnerSelectionId).toBe(-1);
      expect(legacyItem.userId).toBe(789);
      expect(legacyItem.errorMessage).toContain('[LEGACY_FORMAT: cycle_18]');
    });
  });

  describe('PayPal Status Mapping', () => {
    test('should map all PayPal status variants correctly', () => {
      const statusMappingCases = [
        { paypalStatus: 'SUCCESS', expected: 'success' },
        { paypalStatus: 'COMPLETED', expected: 'success' },
        { paypalStatus: 'PENDING', expected: 'pending' },
        { paypalStatus: 'ONHOLD', expected: 'pending' },
        { paypalStatus: 'RETURNED', expected: 'pending' },
        { paypalStatus: 'UNCLAIMED', expected: 'unclaimed' },
        { paypalStatus: 'FAILED', expected: 'failed' },
        { paypalStatus: 'DENIED', expected: 'failed' },
        { paypalStatus: 'BLOCKED', expected: 'failed' },
        { paypalStatus: 'REFUNDED', expected: 'failed' },
        { paypalStatus: 'UNKNOWN_STATUS', expected: 'failed' }, // Default case
      ];

      statusMappingCases.forEach(({ paypalStatus, expected }) => {
        const testResponse = {
          batch_header: {
            payout_batch_id: 'STATUS_TEST_BATCH',
            batch_status: 'SUCCESS',
            amount: { value: '50.00', currency: 'USD' },
            fees: { value: '1.00', currency: 'USD' }
          },
          items: [
            {
              payout_item_id: 'STATUS_TEST_ITEM',
              transaction_status: paypalStatus,
              payout_item: {
                sender_item_id: 'winner-123-456',
                amount: { value: '50.00', currency: 'USD' },
                receiver: 'test@example.com'
              }
            }
          ]
        };

        const result = parseEnhancedPayoutResponse(testResponse);
        expect(result.individualResults[0].status).toBe(expected);
      });
    });
  });

  describe('Currency Conversion', () => {
    test('should convert dollar amounts to cents correctly', () => {
      const conversionCases = [
        { dollars: '0.00', expectedCents: 0 },
        { dollars: '1.00', expectedCents: 100 },
        { dollars: '50.00', expectedCents: 5000 },
        { dollars: '123.45', expectedCents: 12345 },
        { dollars: '0.01', expectedCents: 1 },
        { dollars: '999.99', expectedCents: 99999 },
      ];

      conversionCases.forEach(({ dollars, expectedCents }) => {
        const testResponse = {
          batch_header: {
            payout_batch_id: 'CONVERSION_TEST_BATCH',
            batch_status: 'SUCCESS',
            amount: { value: dollars, currency: 'USD' },
            fees: { value: '0.00', currency: 'USD' }
          },
          items: [
            {
              payout_item_id: 'CONVERSION_TEST_ITEM',
              transaction_status: 'SUCCESS',
              payout_item: {
                sender_item_id: 'winner-123-456',
                amount: { value: dollars, currency: 'USD' },
                receiver: 'test@example.com'
              }
            }
          ]
        };

        const result = parseEnhancedPayoutResponse(testResponse);
        expect(result.totalAmount).toBe(expectedCents);
        expect(result.individualResults[0].amount).toBe(expectedCents);
      });
    });
  });
});

export default {};