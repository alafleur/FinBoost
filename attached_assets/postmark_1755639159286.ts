import fetch from 'node-fetch';
import { renderTemplate } from '../render.js';
import type { EmailProvider, MessageStream, SendOptions, TemplateKey } from '../types.js';
import { isSuppressed, normalizeEmail, upsertSuppression } from '../suppressions.js';
import { EmailValidationService } from '../../../email-validation-service.js';

const POSTMARK_API = 'https://api.postmarkapp.com/email';

const TEMPLATE_FILE: Record<TemplateKey, string> = {
  'verify-email': 'verify-email.html',
  'password-reset': 'password-reset.html',
  'payout-processed': 'payout-processed.html',
  'amoe-receipt': 'amoe-receipt.html',
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

function chooseStream(template: TemplateKey, explicit?: MessageStream): MessageStream {
  return explicit || TEMPLATE_STREAM_HINT[template] || 'transactional';
}

function mask(email: string) {
  const at = email.indexOf('@');
  if (at < 1) return '***';
  const left = email.slice(0, Math.min(3, at));
  return `${left}***${email.slice(at)}`;
}

export function createPostmarkProvider(): EmailProvider {
  const token = env('POSTMARK_SERVER_TOKEN');
  const from = env('EMAIL_FROM');
  const defaultReplyTo = process.env.EMAIL_REPLY_TO || from;
  const transactionalStream = process.env.POSTMARK_MESSAGE_STREAM_TRANSACTIONAL || 'outbound';
  const broadcastStream = process.env.POSTMARK_MESSAGE_STREAM_BROADCAST || 'broadcast';

  const validator = new EmailValidationService();

  async function send(template: TemplateKey, opts: SendOptions) {
    const to = normalizeEmail(opts.to);
    const validation = validator.validate(to);
    if (!validation.isValid) {
      console.warn(`[EMAIL] ❌ Blocked send due to invalid address: ${to} (${validation.errorCode})`);
      // Don't throw — treat as sent to avoid retries, but log clearly
      return { message: `invalid-email:${validation.errorCode}` };
    }

    if (await isSuppressed(to)) {
      console.warn(`[EMAIL] ⛔ Skipping send to suppressed address ${mask(to)}`);
      return { message: 'suppressed' };
    }

    const streamKey = chooseStream(template, opts.stream);
    const messageStream = streamKey === 'broadcast' ? broadcastStream : transactionalStream;

    const subject = opts.subject || subjectForTemplate(template);
    const htmlBody = await renderTemplate(TEMPLATE_FILE[template], opts.model || {});

    const payload: any = {
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      MessageStream: messageStream,
    };

    if (opts.replyTo || defaultReplyTo) payload.ReplyTo = opts.replyTo || defaultReplyTo;
    if (opts.tag) payload.Tag = opts.tag;
    if (opts.metadata) payload.Metadata = opts.metadata;

    // Extra safety headers for Postmark classification
    payload.Headers = Object.entries({
      'X-PM-Message-Stream': messageStream,
      ...(opts.headers || {}),
    }).map(([Name, Value]) => ({ Name, Value }));

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
      // Postmark hard-bounce or inactive recipient -> add to suppressions
      const code = data?.ErrorCode;
      const msg = data?.Message || `HTTP ${res.status}`;
      if (code === 406 || code === 300 || /inactive|suppressed|bounced/i.test(msg)) {
        await upsertSuppression(to, 'bounce', new Date());
      }
      console.error(`[EMAIL] Postmark send failed (${res.status}): ${msg}`);
      return { message: `error:${code || res.status}` };
    }

    console.log(`[EMAIL] ✅ Sent '${template}' to ${mask(to)} via ${messageStream}`);
    return { id: data?.MessageID, message: data?.Message };
  }

  return { name: 'postmark', send };
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
