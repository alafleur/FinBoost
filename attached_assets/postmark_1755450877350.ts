
import { ServerClient } from 'postmark';
import { renderTemplate } from '../render.js';
import type { EmailProvider, SendOptions, TemplateKey } from '../types.js';

function assertEnv(v: string | undefined, name: string): asserts v is string {
  if (!v) throw new Error(`[email] Missing env ${name}`);
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const TEMPLATE_FILES: Record<TemplateKey, string> = {
  'verify-email': 'verify_email.html',
  'password-reset': 'password_reset.html',
  'payout-processed': 'payout_processed.html',
  'amoe-receipt': 'amoe_receipt.html',
};

function defaultSubject(key: TemplateKey): string {
  switch (key) {
    case 'verify-email': return 'Verify your email';
    case 'password-reset': return 'Reset your FinBoost password';
    case 'payout-processed': return 'Your FinBoost payout has been processed';
    case 'amoe-receipt': return 'Your AMOE entry receipt';
    default: return 'Notification from FinBoost';
  }
}

export function createPostmarkProvider(): EmailProvider {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  assertEnv(token, 'POSTMARK_SERVER_TOKEN');
  const stream = process.env.POSTMARK_MESSAGE_STREAM || 'outbound';
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';

  const client = new ServerClient(token);

  async function send(templateKey: TemplateKey, { to, subject, model = {}, headers = {} }: SendOptions) {
    if (!to) throw new Error('[email] `to` required');
    const file = TEMPLATE_FILES[templateKey];
    const HtmlBody = await renderTemplate(file, model);
    const TextBody = stripHtml(HtmlBody);

    const payload: any = {
      From: from,
      To: to,
      Subject: subject || defaultSubject(templateKey),
      HtmlBody,
      TextBody,
      MessageStream: stream,
      Headers: Object.entries(headers || {}).map(([Name, Value]) => ({ Name, Value })),
    };

    const res = await client.sendEmail(payload);
    return res;
  }

  return { name: 'postmark', send };
}
