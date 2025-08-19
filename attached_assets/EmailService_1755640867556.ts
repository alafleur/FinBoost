import type { EmailProvider, SendOptions, TemplateKey } from './types.js';
import { createPostmarkProvider } from './providers/postmark.js';
import { EmailValidationService } from '../../email-validation-service.js';
import { isSuppressed, normalizeEmail } from './suppressions.js';

const validator = new EmailValidationService();

export class EmailService {
  private provider: EmailProvider;

  constructor() {
    const providerName = process.env.EMAIL_PROVIDER || 'postmark';
    switch (providerName) {
      case 'postmark':
      default:
        this.provider = createPostmarkProvider();
    }
  }

  /** All sends pass through validation + suppression once here (provider-agnostic). */
  async send(template: TemplateKey, opts: SendOptions) {
    const to = normalizeEmail(opts.to);
    const v = validator.validate(to);
    if (!v.isValid) {
      console.warn(`[EMAIL] ❌ Blocked invalid: ${to} (${v.errorCode})`);
      return { message: `invalid-email:${v.errorCode}` };
    }
    if (await isSuppressed(to)) {
      console.warn(`[EMAIL] ⛔ Suppressed: ${to}`);
      return { message: 'suppressed' };
    }
    return this.provider.send(template, { ...opts, to });
  }
}
