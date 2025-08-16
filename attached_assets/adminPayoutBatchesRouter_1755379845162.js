
/**
 * Admin Payout Batches Router (disbursements overhaul) — v2
 * Fixes schema detection for cycle column: now prefers `cycle_setting_id`.
 */

const express = require('express');
const router = express.Router();

let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('[disb-overhaul] Prisma detected.');
} catch (e) {
  console.log('[disb-overhaul] Prisma not detected, will use PG if available.');
}

let pgPool = null;
try {
  const { pool } = require('../utils/pg');
  pgPool = pool || null;
  if (pgPool) console.log('[disb-overhaul] PG pool ready.');
} catch (e) {
  console.log('[disb-overhaul] PG helper not available.');
}

let resolved = null;

async function detectTablesAndColumns() {
  if (resolved) return resolved;

  const batchTableCandidates = ['payout_batches', 'disbursement_batches', 'paypal_payout_batches'];
  const itemTableCandidates  = ['payout_items', 'disbursement_items', 'paypal_payout_items'];

  const colCandidates = {
    batch: {
      id: ['id', 'batch_id'],
      // IMPORTANT: prefer cycle_setting_id for your schema
      cycleId: ['cycle_setting_id', 'cycle_id', 'cycleId'],
      createdAt: ['created_at', 'createdAt', 'inserted_at'],
      status: ['status', 'state'],
      provider: ['payout_provider', 'provider', 'channel'],
      senderBatchId: ['sender_batch_id', 'senderBatchId']
    },
    item: {
      id: ['id', 'item_id'],
      batchId: ['batch_id', 'batchId', 'payout_batch_id'],
      amount: ['amount', 'payout_amount', 'value_cents', 'value'],
      currency: ['currency', 'currency_code'],
      receiver: ['receiver', 'recipient', 'receiver_email']
    }
  };

  const out = { batchTable: null, itemTable: null, cols: { batch: {}, item: {} } };

  if (!pgPool) { resolved = out; return out; }

  const q = (text, params) => pgPool.query(text, params);
  const tablesRes = await q(`select table_name from information_schema.tables where table_schema='public'`);
  const tables = tablesRes.rows.map(r => r.table_name);

  out.batchTable = batchTableCandidates.find(t => tables.includes(t)) || null;
  out.itemTable  = itemTableCandidates.find(t => tables.includes(t))  || null;

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
  const raw = req.query.cycleId ?? req.params.cycleId;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    return { error: 'Invalid cycleId', value: null };
  }
  return { error: null, value: n };
}

async function prismaFindBatchesByCycle(cycleId) {
  if (!prisma) return null;
  const modelNames = ['payoutBatch', 'PayoutBatch', 'disbursementBatch', 'DisbursementBatch', 'paypalPayoutBatch', 'PaypalPayoutBatch'];

  for (const m of modelNames) {
    const model = prisma[m];
    if (!model || typeof model.findMany !== 'function') continue;
    try {
      // include either field if it exists in the model
      const rows = await model.findMany({
        where: { OR: [{ cycleId }, { cycle_id: cycleId }, { cycle_setting_id: cycleId }] },
        orderBy: [{ createdAt: 'desc' }],
        take: 100
      });
      if (Array.isArray(rows)) return rows;
    } catch (e) {}
  }
  return null;
}

async function pgFindBatchesByCycle(cycleId) {
  if (!pgPool) return null;
  const spec = await detectTablesAndColumns();
  if (!spec.batchTable) return null;

  const b = spec.cols.batch;
  const i = spec.cols.item;
  const hasItems = !!spec.itemTable;

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

router.get('/', async (req, res) => {
  const { error, value: cycleId } = parseCycleId(req);
  if (error) return res.status(400).json({ error });

  try {
    const prismaRows = await prismaFindBatchesByCycle(cycleId);
    if (Array.isArray(prismaRows)) return res.json(prismaRows);

    const pgRows = await pgFindBatchesByCycle(cycleId);
    if (Array.isArray(pgRows)) return res.json(pgRows);

    return res.json([]);
  } catch (err) {
    console.error('[disb-overhaul] /payout-batches error', err);
    return res.status(500).json({ error: 'Failed to fetch payout batches' });
  }
});

router.get('/active', async (_req, res) => {
  try {
    if (prisma) {
      const model = prisma['payoutBatch'] || prisma['PayoutBatch'] || prisma['disbursementBatch'] || prisma['DisbursementBatch'];
      if (model && typeof model.findFirst === 'function') {
        const row = await model.findFirst({ orderBy: [{ createdAt: 'desc' }] });
        if (row) return res.json(row);
      }
    }

    if (pgPool) {
      const spec = await detectTablesAndColumns();
      if (spec.batchTable) {
        const b = spec.cols.batch;
        const text = `SELECT b.* FROM ${spec.batchTable} b ORDER BY b.${b.createdAt} DESC LIMIT 1`.replace(/\s+/g, ' ').trim();
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
