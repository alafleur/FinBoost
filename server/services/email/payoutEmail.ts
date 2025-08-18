import { getEmail } from './EmailService.js';

export async function sendPayoutProcessedEmail(args: { to: string; cycleId: number | string; amountPretty: string }) {
  const { to, cycleId, amountPretty } = args;
  await getEmail().send('payout-processed', {
    to,
    model: {
      cycleId,
      amountPretty,
      supportEmail: process.env.SUPPORT_EMAIL,
      brandAddress: process.env.BRAND_ADDRESS
    }
  });
}