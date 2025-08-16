
/**
 * Admin Payout Batches Router (disbursements overhaul)
 * - FIXES: empty result for /api/admin/payout-batches?cycleId=18 due to string vs int filtering.
 * - ADDS: robust Postgres fallback with schema introspection.
 * - KEEPS: /active endpoint to fetch most recent batch.
 *
 * Drop-in usage in your server:
 *   const { adminPayoutBatchesRouter } = require('./routes/adminPayoutBatchesRouter');
 *   app.use('/api/admin/payout-batches', adminPayoutBatchesRouter);
 */

const express = require('express');
const router = express.Router();

// Optional: use existing prisma client if available
let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('[disb-overhaul] Prisma detected.');
} catch (e) {
  console.log('[disb-overhaul] Prisma not detected, will use PG if available.');
}

// Optional: PG fallback
let pgPool = null;
try {
  const { pool } = require('../utils/pg');
  pgPool = pool || null;
  if (pgPool) console.log('[disb-overhaul] PG pool ready.');
} catch (e) {
  console.log('[disb-overhaul] PG helper not available.');
}

// Cache table + column resolution
let resolved = null;

async function detectTablesAndColumns() {
  if (resolved) return resolved;

  // Candidate table/column names to be resilient to naming drift
  const batchTableCandidates = ['payout_batches', 'disbursement_batches', 'paypal_payout_batches'];
  const itemTableCandidates  = ['payout_items', 'disbursement_items', 'paypal_payout_items'];

  const colCandidates = {
    batch: {
      id: ['id', 'batch_id'],
      cycleId: ['cycle_id', 'cycleId'],
      createdAt: ['created_at', 'createdAt', 'inserted_at'],
      status: ['status', 'state'],
      provider: ['payout_provider', 'provider', 'channel'],
      senderBatchId: ['sender_batch_id', 'senderBatchId']
    },
    item: {
      id: ['id', 'item_id'],
      batchId: ['batch_id', 'batchId'],
      amount: ['amount', 'payout_amount', 'value_cents', 'value'],
      currency: ['currency', 'currency_code'],
      receiver: ['receiver', 'recipient', 'receiver_email']
    }
  };

  const out = {
    batchTable: null,
    itemTable: null,
    cols: { batch: {}, item: {} }
  };

  // If PG not available, just return null and let prisma path handle it.
  if (!pgPool) {
    resolved = out;
    return out;
  }

  const q = (text, params) => pgPool.query(text, params);

  const tablesRes = await q(
    `select table_name from information_schema.tables where table_schema='public'`
  );
  const tables = tablesRes.rows.map(r => r.table_name);

  out.batchTable = batchTableCandidates.find(t => tables.includes(t)) || null;
  out.itemTable  = itemTableCandidates.find(t => tables.includes(t))  || null;

  // helper to choose first existing column
  async function pickCols(table, candidatesMap) {
    if (!table) return {};
    const colsRes = await q(
      `select column_name from information_schema.columns where table_schema='public' and table_name=$1`,
      [table]
    );
    const cols = colsRes.rows.map(r => r.column_name);
    const chosen = {};
    Object.entries(candidatesMap).forEach(([logical, candList]) => {
      chosen[logical] = candList.find(c => cols.includes(c)) || candList[0];
    });
    return chosen;
  }

  out.cols.batch = await pickCols(out.batchTable, colCandidates.batch);
  out.cols.item  = await pickCols(out.itemTable,  colCandidates.item);

  resolved = out;
  console.log('[disb-overhaul] Resolved schema:', out);
  return out;
}

function parseCycleId(req) {
  // Fix: enforce number — prior implementation treated it as string, causing zero matches in ORMs.
  const raw = req.query.cycleId ?? req.params.cycleId;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    return { error: 'Invalid cycleId', value: null };
  }
  return { error: null, value: n };
}

// Prisma path (if project defines a matching model)
async function prismaFindBatchesByCycle(cycleId) {
  if (!prisma) return null;
  // We don't know the exact model name; try a few common ones dynamically.
  const modelNames = ['payoutBatch', 'PayoutBatch', 'disbursementBatch', 'DisbursementBatch', 'paypalPayoutBatch', 'PaypalPayoutBatch'];
  const order = [{ createdAt: 'desc' }, { created_at: 'desc' }];

  for (const m of modelNames) {
    const model = prisma[m];
    if (!model || typeof model.findMany !== 'function') continue;
    try {
      const rows = await model.findMany({
        where: { OR: [{ cycleId }, { cycle_id: cycleId }] },
        orderBy: order,
        take: 100
      });
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      // try next
    }
  }
  return null;
}

// PG path
async function pgFindBatchesByCycle(cycleId) {
  if (!pgPool) return null;
  const spec = await detectTablesAndColumns();
  if (!spec.batchTable) return null;

  const b = spec.cols.batch;
  const i = spec.cols.item;
  const hasItems = !!spec.itemTable;

  // Build a safe query that doesn't depend on optional amounts
  const text = `
    SELECT
      b.${b.id}               AS id,
      b.${b.cycleId}          AS cycle_id,
      b.${b.status}           AS status,
      b.${b.senderBatchId}    AS sender_batch_id,
      b.${b.provider}         AS provider,
      b.${b.createdAt}        AS created_at,
      ${hasItems ? `COUNT(it.${i.id})::int` : `0`} AS item_count
      ${hasItems && i.amount ? `, COALESCE(SUM(CASE WHEN it.${i.amount} IS NULL THEN 0 ELSE it.${i.amount} END),0) AS total_amount` : ``}
    FROM ${spec.batchTable} b
    ${hasItems ? `LEFT JOIN ${spec.itemTable} it ON it.${i.batchId} = b.${b.id}` : ``}
    WHERE b.${b.cycleId} = $1
    GROUP BY b.${b.id}, b.${b.cycleId}, b.${b.status}, b.${b.senderBatchId}, b.${b.provider}, b.${b.createdAt}
    ORDER BY b.${b.createdAt} DESC
    LIMIT 100
  `.replace(/\s+/g, ' ').trim();

  const { rows } = await pgPool.query(text, [cycleId]);
  return rows;
}

// GET /api/admin/payout-batches?cycleId=18
router.get('/', async (req, res) => {
  const { error, value: cycleId } = parseCycleId(req);
  if (error) return res.status(400).json({ error });

  try {
    // 1) Try Prisma with numeric filter (fixes previous bug when value was string)
    const prismaRows = await prismaFindBatchesByCycle(cycleId);
    if (Array.isArray(prismaRows)) {
      return res.json(prismaRows);
    }

    // 2) Fallback to PG with schema introspection
    const pgRows = await pgFindBatchesByCycle(cycleId);
    if (Array.isArray(pgRows)) {
      return res.json(pgRows);
    }

    // 3) As a last resort return empty (but at least we tried the numeric filter)
    return res.json([]);
  } catch (err) {
    console.error('[disb-overhaul] /payout-batches error', err);
    return res.status(500).json({ error: 'Failed to fetch payout batches' });
  }
});

// GET /api/admin/payout-batches/active  => latest batch (any cycle)
router.get('/active', async (_req, res) => {
  try {
    // Try Prisma generic path
    if (prisma) {
      const model = prisma['payoutBatch'] || prisma['PayoutBatch'] || prisma['disbursementBatch'] || prisma['DisbursementBatch'];
      if (model && typeof model.findFirst === 'function') {
        const row = await model.findFirst({
          orderBy: [{ createdAt: 'desc' }, { created_at: 'desc' }]
        });
        if (row) return res.json(row);
      }
    }

    // PG fallback
    if (pgPool) {
      const spec = await detectTablesAndColumns();
      if (spec.batchTable) {
        const b = spec.cols.batch;
        const text = `
          SELECT b.* FROM ${spec.batchTable} b
          ORDER BY b.${b.createdAt} DESC
          LIMIT 1
        `.replace(/\s+/g, ' ').trim();
        const { rows } = await pgPool.query(text);
        if (rows[0]) return res.json(rows[0]);
      }
    }

    return res.status(404).json({ error: 'No active batch found' });
  } catch (err) {
    console.error('[disb-overhaul] /payout-batches/active error', err);
    return res.status(500).json({ error: 'Failed to fetch active batch' });
  }
});

module.exports = { adminPayoutBatchesRouter: router };
