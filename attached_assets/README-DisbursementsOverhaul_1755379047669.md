
# FinBoost — Disbursements Overhaul Patch (Backend)

**Goal:** Fix `/api/admin/payout-batches?cycleId=<n>` returning `[]` even when the batch exists (while `/active` works).  
**Root Cause:** The route was filtering with a **string** `cycleId`, which many ORMs (including Prisma) treat as a non-matching type for numeric columns — yielding empty arrays.  

This patch:
1. Forces a **numeric** `cycleId` (the critical fix).
2. Adds a **Postgres fallback** with light schema introspection so the endpoint still works if Prisma models differ from table names.
3. Retains `/active` support.

---

## Files

- `server/utils/pg.js` — tiny PG helper (uses `DATABASE_URL`).  
- `server/routes/adminPayoutBatchesRouter.js` — new router with the numeric filter fix and PG fallback.

---

## Install

From your project root:

```bash
npm i pg            # if not already installed
# or
yarn add pg
```

Ensure `DATABASE_URL` is set in your environment (Replit Secrets). If your DB enforces SSL, set `PGSSLMODE=require`.

---

## Wire Up the Router

In your server bootstrap (e.g., `server/index.js` or wherever you create the Express app):

```js
const { adminPayoutBatchesRouter } = require('./routes/adminPayoutBatchesRouter');
app.use('/api/admin/payout-batches', adminPayoutBatchesRouter);
```

Remove/disable the old payout-batches route to avoid conflicts.

---

## Verify

1. Start server with logging enabled.
2. Hit:
   - `GET /api/admin/payout-batches?cycleId=18`
   - `GET /api/admin/payout-batches/active`
3. Expect the first call to now **return rows**, not `[]` (assuming batches exist for cycle 18).

**Tip:** If your DB uses different table names/columns, the PG fallback auto-detects among common variants. If your schema is unique, update the candidates at the top of `adminPayoutBatchesRouter.js`.

---

## Notes

- This patch does **not** change your frontend. The “Loading…” card should now show actual batch rows once the endpoint responds with data.
- If both Prisma and PG exist, Prisma is used first with the **numeric** filter fix. If Prisma models are missing/mismatched, the PG fallback handles it.
- If you want an aggregated response (e.g., totals), the PG query already returns `item_count` and, when an amount column exists, `total_amount`.
