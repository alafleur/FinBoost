/**
 * Admin Payout Batches Router — v3 (Simple, Observable, Deterministic)
 *
 * NO GUESSING. Uses the known, working schema seen via /active:
 *   Table: payout_batches
 *   Columns: id, cycle_setting_id, status, sender_batch_id, created_at
 *
 * Optional: if table `payout_items(batch_id)` exists, we also return `item_count` via a subquery.
 */

const express = require('express');
const router = express.Router();

let pgPool = null;
try {
  const { pool } = require('../utils/pg');
  pgPool = pool || null;
  if (!pgPool) {
    console.error('[disb-overhaul:v3] PG pool not available. Set DATABASE_URL and install `pg`.');
  }
} catch (e) {
  console.error('[disb-overhaul:v3] Failed to load PG helper.', e);
}

/** Validate and coerce cycleId */
function parseCycleId(req) {
  const raw = req.query.cycleId ?? req.params.cycleId;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) return { error: 'Invalid cycleId', value: null };
  return { error: null, value: n };
}

/** Check if a table and (optionally) a column exists in public schema */
async function tableExists(table) {
  const q = `select 1 from information_schema.tables where table_schema='public' and table_name=$1`;
  const { rows } = await pgPool.query(q, [table]);
  return rows.length > 0;
}
async function columnExists(table, column) {
  const q = `select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`;
  const { rows } = await pgPool.query(q, [table, column]);
  return rows.length > 0;
}
async function hasItemsTable() {
  return (await tableExists('payout_items')) && (await columnExists('payout_items', 'batch_id'));
}

/** GET /api/admin/payout-batches?cycleId=18 */
router.get('/', async (req, res) => {
  if (!pgPool) return res.status(500).json({ error: 'Database not configured' });
  const { error, value: cycleId } = parseCycleId(req);
  if (error) return res.status(400).json({ error });

  try {
    const includeItems = await hasItemsTable();

    const baseFields = `b.id, b.cycle_setting_id, b.status, b.sender_batch_id, b.created_at`;
    const itemsField = includeItems ? `, (SELECT COUNT(*)::int FROM payout_items it WHERE it.batch_id = b.id) AS item_count` : ``;

    const sql = `
      SELECT ${baseFields}${itemsField}
      FROM payout_batches b
      WHERE b.cycle_setting_id = $1
      ORDER BY b.created_at DESC
      LIMIT 100
    `.replace(/\s+/g, ' ').trim();

    const { rows } = await pgPool.query(sql, [cycleId]);
    return res.json(rows);
  } catch (err) {
    console.error('[disb-overhaul:v3] /payout-batches error', err);
    return res.status(500).json({ error: 'Failed to fetch payout batches' });
  }
});

/** GET /api/admin/payout-batches/active */
router.get('/active', async (_req, res) => {
  if (!pgPool) return res.status(500).json({ error: 'Database not configured' });
  try {
    const includeItems = await hasItemsTable();

    const baseFields = `b.id, b.cycle_setting_id, b.status, b.sender_batch_id, b.created_at`;
    const itemsField = includeItems ? `, (SELECT COUNT(*)::int FROM payout_items it WHERE it.batch_id = b.id) AS item_count` : ``;

    const sql = `
      SELECT ${baseFields}${itemsField}
      FROM payout_batches b
      ORDER BY b.created_at DESC
      LIMIT 1
    `.replace(/\s+/g, ' ').trim();

    const { rows } = await pgPool.query(sql);
    if (!rows[0]) return res.status(404).json({ error: 'No active batch found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('[disb-overhaul:v3] /payout-batches/active error', err);
    return res.status(500).json({ error: 'Failed to fetch active batch' });
  }
});

module.exports = { adminPayoutBatchesRouter: router };