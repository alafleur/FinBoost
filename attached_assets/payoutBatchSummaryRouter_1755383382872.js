
/**
 * Payout Batch Summary Router — minimal & deterministic
 *
 * Contract (guaranteed):
 * - Table used: payout_batches
 * - Columns used: id, cycle_setting_id, status, sender_batch_id, created_at
 * - Optional items table: payout_items
 *   - We ONLY use columns that actually exist (verified via information_schema).
 *   - If columns don't exist, related fields are simply omitted.
 *
 * Routes:
 *   GET /api/admin/payout-batches/:id/summary
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../utils/pg');

if (!pool) {
  console.error('[payout-batch-summary] PG pool not available. Set DATABASE_URL and install `pg`.');
}

/** helpers */
async function tableExists(table) {
  const q = `select 1 from information_schema.tables where table_schema='public' and table_name=$1`;
  const { rows } = await pool.query(q, [table]);
  return rows.length > 0;
}
async function columnExists(table, column) {
  const q = `select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`;
  const { rows } = await pool.query(q, [table, column]);
  return rows.length > 0;
}

router.get('/:id/summary', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 0) return res.status(400).json({ error: 'Invalid id' });
  if (!pool) return res.status(500).json({ error: 'Database not configured' });

  try {
    const client = await pool.connect();
    try {
      // 1) Batch meta (deterministic)
      const batchSql = `
        SELECT id, cycle_setting_id, status, sender_batch_id, created_at
        FROM payout_batches
        WHERE id = $1
      `.replace(/\s+/g, ' ').trim();
      const batchR = await client.query(batchSql, [id]);
      const b = batchR.rows[0];
      if (!b) return res.status(404).json({ error: 'Batch not found' });

      // 2) Items rollups (only for columns that actually exist)
      const hasItemsTable = await tableExists('payout_items');
      let counts = null;
      let totals = null;
      let failures = [];

      if (hasItemsTable) {
        const hasBatchId   = await columnExists('payout_items', 'batch_id');
        if (hasBatchId) {
          const hasStatus    = await columnExists('payout_items', 'status');
          const hasAmount    = await columnExists('payout_items', 'amount');
          const hasCurrency  = await columnExists('payout_items', 'currency');
          const hasErrCode   = await columnExists('payout_items', 'error_code');

          // counts
          if (hasStatus) {
            const countsSql = `
              SELECT
                COUNT(*)                                                   AS total,
                COUNT(*) FILTER (WHERE status = 'SUCCESS')                 AS success,
                COUNT(*) FILTER (WHERE status = 'FAILED')                  AS failed,
                COUNT(*) FILTER (WHERE status IN ('PENDING','PROCESSING')) AS pending
              FROM payout_items
              WHERE batch_id = $1
            `.replace(/\s+/g, ' ').trim();
            const r = await client.query(countsSql, [id]);
            const c = r.rows[0] || {};
            counts = {
              total: Number(c.total || 0),
              success: Number(c.success || 0),
              failed: Number(c.failed || 0),
              pending: Number(c.pending || 0),
            };
          } else {
            const totalSql = `SELECT COUNT(*)::int AS total FROM payout_items WHERE batch_id = $1`;
            const r = await client.query(totalSql, [id]);
            counts = { total: Number((r.rows[0] && r.rows[0].total) || 0) };
          }

          // totals
          if (hasAmount) {
            if (hasStatus) {
              const totalsSql = `
                SELECT
                  COALESCE(SUM(amount), 0)                                   AS total_amount,
                  COALESCE(SUM(amount) FILTER (WHERE status='SUCCESS'), 0)   AS success_amount,
                  ${hasCurrency ? 'MAX(currency)' : 'NULL'}                  AS currency
                FROM payout_items
                WHERE batch_id = $1
              `.replace(/\s+/g, ' ').trim();
              const r = await client.query(totalsSql, [id]);
              const t = r.rows[0] || {};
              totals = {
                all: Number(t.total_amount || 0),
                success: Number(t.success_amount || 0),
                currency: t.currency || null
              };
            } else {
              const totalsSql = `
                SELECT COALESCE(SUM(amount),0) AS total_amount, ${hasCurrency ? 'MAX(currency)' : 'NULL'} AS currency
                FROM payout_items WHERE batch_id = $1
              `.replace(/\s+/g, ' ').trim();
              const r = await client.query(totalsSql, [id]);
              const t = r.rows[0] || {};
              totals = { all: Number(t.total_amount || 0), currency: t.currency || null };
            }
          }

          // failures
          if (hasStatus && hasErrCode) {
            const failSql = `
              SELECT COALESCE(error_code, 'UNKNOWN') AS code, COUNT(*)::int AS count
              FROM payout_items
              WHERE batch_id = $1 AND status = 'FAILED'
              GROUP BY COALESCE(error_code, 'UNKNOWN')
              ORDER BY count DESC
            `.replace(/\s+/g, ' ').trim();
            const r = await client.query(failSql, [id]);
            failures = r.rows.map(row => ({ code: row.code, count: Number(row.count) }));
          }
        }
      }

      // Build response
      const out = {
        batchId: b.id,
        cycleSettingId: b.cycle_setting_id,
        status: b.status,
        senderBatchId: b.sender_batch_id,
        createdAt: b.created_at,
      };
      if (counts)  out.counts = counts;
      if (totals)  out.totals = totals;
      if (failures && failures.length) out.failures = failures;

      return res.json(out);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[payout-batch-summary] error', err);
    return res.status(500).json({ error: 'Failed to build batch summary' });
  }
});

module.exports = { payoutBatchSummaryRouter: router };
