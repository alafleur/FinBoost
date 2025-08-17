
let postmark = null;
try { postmark = require('postmark'); } catch (e) { console.warn('[email] postmark SDK not installed. Run: npm i postmark'); }
const { renderTemplate } = require('../render');
function assertEnv(v, name) { if (!v) throw new Error(`[email] Missing env ${name}`); }

function createPostmarkProvider() {
  const token = process.env.POSTMARK_SERVER_TOKEN; assertEnv(token, 'POSTMARK_SERVER_TOKEN');
  const stream = process.env.POSTMARK_MESSAGE_STREAM || 'outbound';
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const client = new postmark.ServerClient(token);

  const TEMPLATE_FILES = {
    'verify-email': 'verify_email.html',
    'password-reset': 'password_reset.html',
    'payout-processed': 'payout_processed.html',
    'amoe-receipt': 'amoe_receipt.html'
  };

  async function send(templateKey, { to, subject, model = {}, headers = {} }) {
    if (!to) throw new Error('[email] `to` required');
    const file = TEMPLATE_FILES[templateKey];
    if (!file) throw new Error(`[email] Unknown template ${templateKey}`);
    const htmlBody = await renderTemplate(file, model);
    const TextBody = (htmlBody || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const payload = {
      From: from, To: to, Subject: subject || buildDefaultSubject(templateKey, model),
      HtmlBody: htmlBody, TextBody, MessageStream: stream,
      Headers: Object.entries(headers || {}).map(([Name, Value]) => ({ Name, Value }))
    };
    const res = await client.sendEmail(payload);
    return res;
  }

  function buildDefaultSubject(key, model) {
    switch (key) {
      case 'verify-email': return 'Verify your email';
      case 'password-reset': return 'Reset your FinBoost password';
      case 'payout-processed': return 'Your FinBoost payout has been processed';
      case 'amoe-receipt': return 'Your AMOE entry receipt';
      default: return 'Notification from FinBoost';
    }
  }
  return { name: 'postmark', send };
}
module.exports = { createPostmarkProvider };
