
import { createPostmarkProvider } from './providers/postmark.js';
import { createMockProvider } from './providers/mock.js';
import type { EmailProvider } from './types.js';

function getProviderName(): string {
  return process.env.EMAIL_PROVIDER || 'postmark';
}

function createProvider(): EmailProvider {
  const name = getProviderName();
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
