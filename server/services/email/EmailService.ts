import type { EmailProvider, SendOptions, TemplateKey } from './types.js';
import { createPostmarkProvider } from './providers/postmark.js';
import { createMockProvider } from './providers/mock.js';

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

  async send(template: TemplateKey, opts: SendOptions) {
    return this.provider.send(template, opts);
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