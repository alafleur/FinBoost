import { isSuppressed, checkSuppression } from './suppressions.js';

/**
 * Marketing Email Guard - ChatGPT QA Requirement #8
 * 
 * This service provides the interface between marketing email systems
 * and the email suppression system to protect sender reputation.
 * 
 * IMPORTANT: Only marketing emails should use this guard.
 * Transactional emails (verification, password reset, payout notifications) 
 * should bypass suppression checks and always be delivered.
 */

export interface MarketingEmailGuardResult {
  allowed: boolean;
  reason?: string;
  suppressionDetails?: {
    reason: string;
    source: string;
    lastEventAt?: Date;
  };
}

/**
 * Check if a marketing email can be sent to this address
 * Use this function before sending ANY marketing email
 */
export async function canSendMarketingEmail(email: string): Promise<MarketingEmailGuardResult> {
  try {
    const suppression = await checkSuppression(email);
    
    if (suppression.suppressed) {
      return {
        allowed: false,
        reason: `Email suppressed due to ${suppression.reason}`,
        suppressionDetails: {
          reason: suppression.reason || 'unknown',
          source: suppression.source || 'unknown',
          lastEventAt: suppression.lastEventAt
        }
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[MARKETING_GUARD] Error checking suppression:', error);
    // Fail closed - if we can't check suppression, don't send marketing email
    return {
      allowed: false,
      reason: 'Suppression check failed - failing closed for safety'
    };
  }
}

/**
 * Quick boolean check for marketing email permission
 * Use when you only need a simple yes/no answer
 */
export async function isMarketingEmailAllowed(email: string): Promise<boolean> {
  const result = await canSendMarketingEmail(email);
  return result.allowed;
}

/**
 * Example usage patterns:
 * 
 * // For marketing campaigns
 * if (await isMarketingEmailAllowed(userEmail)) {
 *   await sendNewsletterEmail(userEmail, content);
 * } else {
 *   console.log('Skipping marketing email to suppressed address');
 * }
 * 
 * // For detailed reporting
 * const guardResult = await canSendMarketingEmail(userEmail);
 * if (!guardResult.allowed) {
 *   console.log('Marketing blocked:', guardResult.reason);
 *   // Log suppression details for analysis
 * }
 * 
 * // For transactional emails (DO NOT USE GUARD)
 * // Always send transactional emails regardless of marketing suppression
 * await sendPasswordResetEmail(userEmail, resetToken); // No guard check!
 */