import { Pool } from 'pg';

let pgPool = null;

const makePool = () => {
  if (!Pool) return null;
  const { DATABASE_URL, PGSSLMODE } = process.env;
  if (!DATABASE_URL) { console.warn('[disb-overhaul:v3] DATABASE_URL not set.'); return null; }
  const ssl = (PGSSLMODE === 'require' || (DATABASE_URL || '').includes('sslmode=require')) ? { rejectUnauthorized: false } : false;
  try {
    const pool = new Pool({ connectionString: DATABASE_URL, ssl });
    pool.on('error', (err) => console.error('[disb-overhaul:v3] PG pool error', err));
    return pool;
  } catch (err) { console.error('[disb-overhaul:v3] Failed to create PG pool', err); return null; }
};

try {
  pgPool = makePool();
  if (!pgPool) {
    console.error('[disb-overhaul:v3] PG pool not available. Set DATABASE_URL and install `pg`.');
  }
} catch (e) {
  console.error('[disb-overhaul:v3] Failed to load PG helper.', e);
}

export const pool = pgPool;