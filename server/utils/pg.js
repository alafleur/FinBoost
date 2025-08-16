/**
 * Minimal PG pool helper.
 * Uses DATABASE_URL and supports both SSL/no-SSL (Replit often uses no strict certs).
 * If DATABASE_URL is missing or pg is not installed, the module exports { pool: null }.
 */
let Pool = null;
try {
  const pg = await import('pg');
  Pool = pg.Pool;
} catch (e) {
  console.warn('[disb-overhaul] `pg` package not found. Skipping PG pool creation.');
}

const makePool = () => {
  if (!Pool) return null;
  const { DATABASE_URL, PGSSLMODE } = process.env;
  if (!DATABASE_URL) {
    console.warn('[disb-overhaul] DATABASE_URL not set. PG pool disabled.');
    return null;
  }
  // Allow self-signed when PGSSLMODE=require but CERT isn't provided
  const ssl =
    (PGSSLMODE === 'require' || DATABASE_URL.includes('sslmode=require'))
      ? { rejectUnauthorized: false }
      : false;
  try {
    const pool = new Pool({ connectionString: DATABASE_URL, ssl });
    pool.on('error', (err) => console.error('[disb-overhaul] PG pool error', err));
    return pool;
  } catch (err) {
    console.error('[disb-overhaul] Failed to create PG pool', err);
    return null;
  }
};

const pool = makePool();

export { pool };