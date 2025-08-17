import type { EmailProvider, SendOptions, TemplateKey } from '../types.js';

export function createMockProvider(): EmailProvider {
  async function send(templateKey: TemplateKey, { to, subject, model = {} }: SendOptions) {
    const preview = { templateKey, to, subject, model };
    // eslint-disable-next-line no-console
    console.log('[email:mock] send', JSON.stringify(preview, null, 2));
    return { ErrorCode: 0, Message: 'OK (mock)' };
  }
  return { name: 'mock', send };
}