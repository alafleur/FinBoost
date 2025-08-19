import type { EmailProvider, SendOptions, TemplateKey } from './types.js';
import { createPostmarkProvider } from './providers/postmark.js';

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

  async send(template: TemplateKey, opts: SendOptions) {
    return this.provider.send(template, opts);
  }
}
