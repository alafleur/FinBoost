
let Pool = null;
try { ({ Pool } = require('pg')); } catch (e) { console.warn('[disb-overhaul] `pg` not installed.'); }
const makePool = () => {
  if (!Pool) return null;
  const { DATABASE_URL, PGSSLMODE } = process.env;
  if (!DATABASE_URL) { console.warn('[disb-overhaul] DATABASE_URL not set.'); return null; }
  const ssl = (PGSSLMODE === 'require' || DATABASE_URL.includes('sslmode=require')) ? { rejectUnauthorized: false } : false;
  try {
    const pool = new Pool({ connectionString: DATABASE_URL, ssl });
    pool.on('error', (err) => console.error('[disb-overhaul] PG pool error', err));
    return pool;
  } catch (err) { console.error('[disb-overhaul] Failed to create PG pool', err); return null; }
};
const pool = makePool();
module.exports = { pool };
