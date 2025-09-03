#!/usr/bin/env tsx

/**
 * Step 4 - Transactional Template Smoke Tests
 * 
 * Sends all 4 transactional templates to both test recipients:
 * - verify-email
 * - password-reset 
 * - payout-processed
 * - amoe-receipt
 */

import { EmailService } from './services/email/EmailService.js';

const recipients = [
  'andrew@getfinboost.com',
  'ac.lafleur@gmail.com'
];

const prodBaseUrl = 'https://getfinboost.com';

async function runTransactionalTests() {
  const emailService = new EmailService();
  const results: Array<{
    template: string;
    recipient: string;
    messageId?: string;
    status: string;
    webhookResult: string;
  }> = [];

  console.log('🧪 Starting transactional template smoke tests...\n');

  for (const recipient of recipients) {
    console.log(`📧 Testing recipient: ${recipient}`);
    
    // 1. verify-email template
    try {
      console.log('  → Sending verify-email...');
      const verifyResult = await emailService.send('verify-email', {
        to: recipient,
        model: {
          verificationLink: `${prodBaseUrl}/verify?token=TEST_TOKEN`,
          firstName: 'Test User'
        },
        stream: 'transactional',
        tag: 'test-verify'
      });
      results.push({
        template: 'verify-email',
        recipient,
        messageId: verifyResult.id || 'N/A',
        status: verifyResult.id ? 'Sent' : 'Failed',
        webhookResult: 'Pending'
      });
      console.log(`    ✅ Message ID: ${verifyResult.id}`);
    } catch (error) {
      console.error(`    ❌ Failed: ${error}`);
      results.push({
        template: 'verify-email',
        recipient,
        messageId: 'N/A',
        status: 'Failed',
        webhookResult: 'N/A'
      });
    }

    // 2. password-reset template
    try {
      console.log('  → Sending password-reset...');
      const resetResult = await emailService.send('password-reset', {
        to: recipient,
        model: {
          resetLink: `${prodBaseUrl}/reset?token=TEST_TOKEN`,
          firstName: 'Test User'
        },
        stream: 'transactional',
        tag: 'test-reset'
      });
      results.push({
        template: 'password-reset',
        recipient,
        messageId: resetResult.id || 'N/A',
        status: resetResult.id ? 'Sent' : 'Failed',
        webhookResult: 'Pending'
      });
      console.log(`    ✅ Message ID: ${resetResult.id}`);
    } catch (error) {
      console.error(`    ❌ Failed: ${error}`);
      results.push({
        template: 'password-reset',
        recipient,
        messageId: 'N/A',
        status: 'Failed',
        webhookResult: 'N/A'
      });
    }

    // 3. payout-processed template
    try {
      console.log('  → Sending payout-processed...');
      const payoutResult = await emailService.send('payout-processed', {
        to: recipient,
        model: {
          amount: '$12.34',
          currency: 'USD',
          cycleStart: '2025-09-15',
          cycleEnd: '2025-09-22',
          payoutRef: 'TEST-PAYOUT-001',
          firstName: 'Test User'
        },
        stream: 'transactional',
        tag: 'test-payout'
      });
      results.push({
        template: 'payout-processed',
        recipient,
        messageId: payoutResult.id || 'N/A',
        status: payoutResult.id ? 'Sent' : 'Failed',
        webhookResult: 'Pending'
      });
      console.log(`    ✅ Message ID: ${payoutResult.id}`);
    } catch (error) {
      console.error(`    ❌ Failed: ${error}`);
      results.push({
        template: 'payout-processed',
        recipient,
        messageId: 'N/A',
        status: 'Failed',
        webhookResult: 'N/A'
      });
    }

    // 4. amoe-receipt template
    try {
      console.log('  → Sending amoe-receipt...');
      const amoeResult = await emailService.send('amoe-receipt', {
        to: recipient,
        model: {
          entryId: 'AMOE-TEST-001',
          submittedAt: '2025-09-03T15:00:00Z',
          firstName: 'Test User'
        },
        stream: 'transactional',
        tag: 'test-amoe'
      });
      results.push({
        template: 'amoe-receipt',
        recipient,
        messageId: amoeResult.id || 'N/A',
        status: amoeResult.id ? 'Sent' : 'Failed',
        webhookResult: 'Pending'
      });
      console.log(`    ✅ Message ID: ${amoeResult.id}`);
    } catch (error) {
      console.error(`    ❌ Failed: ${error}`);
      results.push({
        template: 'amoe-receipt',
        recipient,
        messageId: 'N/A',
        status: 'Failed',
        webhookResult: 'N/A'
      });
    }

    console.log('');
  }

  // Display results table
  console.log('📊 RESULTS SUMMARY');
  console.log('==================');
  console.log('Template'.padEnd(18) + 'Recipient'.padEnd(25) + 'Message ID'.padEnd(40) + 'Status'.padEnd(10) + 'Webhook');
  console.log('-'.repeat(110));
  
  for (const result of results) {
    const template = result.template.padEnd(18);
    const recipient = result.recipient.padEnd(25);
    const messageId = (result.messageId || 'N/A').padEnd(40);
    const status = result.status.padEnd(10);
    const webhook = result.webhookResult;
    
    console.log(`${template}${recipient}${messageId}${status}${webhook}`);
  }

  console.log('\n⏰ Webhook results will be updated as delivery confirmations arrive.');
  console.log('🔍 Check Postmark Activity dashboard for delivery status and DKIM authentication.');
  
  return results;
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runTransactionalTests().catch(console.error);
}

export { runTransactionalTests };