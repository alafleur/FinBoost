import type { EmailProvider, SendOptions, TemplateKey } from './types.js';
import { createPostmarkProvider } from './providers/postmark.js';
import { createMockProvider } from './providers/mock.js';
import { EmailValidationService } from '../../email-validation-service.js';
import { isSuppressed, normalizeEmail } from './suppressions.js';

const validator = new EmailValidationService();

export class EmailService {
  private provider: EmailProvider;

  constructor() {
    const providerName = process.env.EMAIL_PROVIDER || 'postmark';
    switch (providerName) {
      case 'mock':
        this.provider = createMockProvider();
        break;
      case 'postmark':
      default:
        this.provider = createPostmarkProvider();
    }
  }

  /** All sends pass through validation + suppression once here (provider-agnostic). */
  async send(template: TemplateKey, opts: SendOptions) {
    const to = normalizeEmail(opts.to);
    const v = validator.validateEmail(to);
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

// Legacy function for backward compatibility
function createProvider(): EmailProvider {
  const name = process.env.EMAIL_PROVIDER || 'postmark';
  if (name === 'mock') return createMockProvider();
  return createPostmarkProvider();
}

/** Singleton */
let _inst: EmailProvider | null = null;
export function getEmail(): EmailProvider {
  if (_inst) return _inst;
  _inst = createProvider();
  return _inst;
}