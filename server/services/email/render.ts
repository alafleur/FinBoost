import fs from 'fs';
import path from 'path';

const TPL_DIR = path.join(process.cwd(), 'server', 'services', 'email', 'templates');

function read(name: string): string {
  return fs.readFileSync(path.join(TPL_DIR, name), 'utf8');
}

function interpolate(str: string, model: Record<string, unknown>): string {
  return str.replace(/{{\s*([.\w]+)\s*}}/g, (_m, key) => {
    const val = String(key).split('.').reduce<any>((acc: any, k: string) => (acc && (acc as any)[k] != null ? (acc as any)[k] : ''), model);
    return String(val ?? '');
  });
}

/**
 * If a template starts with `{{> base.html}}` we wrap the remainder into base.html
 * by replacing base's `{{> body.html}}` token.
 */
export async function renderTemplate(file: string, model: Record<string, unknown> = {}): Promise<string> {
  let content = read(file);
  if (content.trimStart().startsWith('{{> base.html}}')) {
    const base = read('base.html');
    const body = content.replace('{{> base.html}}', '');
    const merged = base.replace('{{> body.html}}', body);
    return interpolate(merged, model);
  }
  return interpolate(content, model);
}