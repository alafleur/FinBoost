
export type TemplateKey = 'verify-email' | 'password-reset' | 'payout-processed' | 'amoe-receipt';

export interface SendOptions {
  to: string;
  subject?: string;
  model?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface EmailProvider {
  name: 'postmark' | 'mock';
  send: (templateKey: TemplateKey, options: SendOptions) => Promise<any>;
}
