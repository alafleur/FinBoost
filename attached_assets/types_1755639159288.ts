export type MessageStream = 'transactional' | 'broadcast';

export type TemplateKey =
  | 'verify-email'
  | 'password-reset'
  | 'payout-processed'
  | 'amoe-receipt'
  | 'generic';

export interface SendOptions {
  to: string;
  subject?: string;
  model?: Record<string, any>;
  headers?: Record<string, string>;
  stream?: MessageStream;
  replyTo?: string;
  tag?: string;
  metadata?: Record<string, string>;
}

export interface EmailProvider {
  name: string;
  send: (template: TemplateKey, opts: SendOptions) => Promise<{ id?: string; message?: string }>;
}
