import fetch from 'node-fetch';
import { renderTemplate } from '../render.js';
import type { EmailProvider, MessageStream, SendOptions, TemplateKey } from '../types.js';
import { upsertSuppression } from '../suppressions.js';

const POSTMARK_API = 'https://api.postmarkapp.com/email';

const TEMPLATE_FILE: Record<TemplateKey, string> = {
  'verify-email': 'verify_email.html',
  'password-reset': 'password_reset.html',
  'payout-processed': 'payout_processed.html',
  'amoe-receipt': 'amoe_receipt.html',
  'generic': 'generic.html',
};

const TEMPLATE_STREAM_HINT: Partial<Record<TemplateKey, MessageStream>> = {
  'verify-email': 'transactional',
  'password-reset': 'transactional',
  'payout-processed': 'transactional',
  'amoe-receipt': 'broadcast',
};

function env(name: string, fallback?: string) {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required ENV ${name}`);
}

function subjectForTemplate(template: TemplateKey): string {
  switch (template) {
    case 'verify-email': return 'Verify your email for FinBoost';
    case 'password-reset': return 'Reset your FinBoost password';
    case 'payout-processed': return 'Your FinBoost reward has been processed';
    case 'amoe-receipt': return 'Your AMOE entry receipt';
    default: return 'A message from FinBoost';
  }
}

export function createPostmarkProvider(): EmailProvider {
  const token = env('POSTMARK_SERVER_TOKEN');
  const from = env('EMAIL_FROM');
  const fromDomain = from.split('@').pop() || '';
  const allowedFromDomain = (process.env.POSTMARK_ALLOWED_DOMAIN || fromDomain).toLowerCase();
  const defaultReplyTo = process.env.EMAIL_REPLY_TO || from;
  const transactionalStream = process.env.POSTMARK_MESSAGE_STREAM_TRANSACTIONAL || 'outbound';
  const broadcastStream = process.env.POSTMARK_MESSAGE_STREAM_BROADCAST || 'broadcast';
  const unsubscribeLink = process.env.EMAIL_UNSUBSCRIBE_LINK || 'https://getfinboost.com/unsubscribe';

  async function send(template: TemplateKey, opts: SendOptions) {
    // Domain safety: enforce verified domain
    if (!fromDomain.endsWith(allowedFromDomain)) {
      console.warn(`[EMAIL] ⚠️ From domain mismatch: ${fromDomain} vs allowed ${allowedFromDomain}`);
    }

    const streamKey = (opts.stream || TEMPLATE_STREAM_HINT[template] || 'transactional') as MessageStream;
    const messageStream = streamKey === 'broadcast' ? broadcastStream : transactionalStream;

    const subject = opts.subject || subjectForTemplate(template);
    const htmlBody = await renderTemplate(TEMPLATE_FILE[template], opts.model || {});

    const payload: any = {
      From: from,
      To: opts.to,
      Subject: subject,
      HtmlBody: htmlBody,
      MessageStream: messageStream,
      ReplyTo: opts.replyTo || defaultReplyTo,
      Tag: opts.tag,
      Metadata: opts.metadata,
      Headers: Object.entries({
        'X-PM-Message-Stream': messageStream,
        ...(streamKey === 'broadcast'
          ? {
              'List-Unsubscribe': `<${unsubscribeLink}>, <mailto:support@getfinboost.com?subject=unsubscribe>`,
            }
          : {}),
        ...(opts.headers || {}),
      }).map(([Name, Value]) => ({ Name, Value })),
    };

    const res = await fetch(POSTMARK_API, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = data?.ErrorCode;
      const msg = data?.Message || `HTTP ${res.status}`;
      if (code === 406 || code === 300 || /inactive|suppressed|bounced|recipient/i.test(msg)) {
        await upsertSuppression(opts.to, 'bounce', new Date());
      }
      console.error(`[EMAIL] Postmark send failed (${res.status}): ${msg}`);
      return { message: `error:${code || res.status}` };
    }

    console.log(`[EMAIL] ✅ Sent '${template}' to ${opts.to} via ${messageStream}`);
    return { id: data?.MessageID, message: data?.Message };
  }

  return { name: 'postmark', send };
}
