
# FinBoost — Disbursements Overhaul — v3 (Simple & Deterministic)

**What this does:** Returns batches for a cycle using the **known schema** you already verified through `/active`:
- Table: `payout_batches`
- Columns: `id`, `cycle_setting_id`, `status`, `sender_batch_id`, `created_at`

No guessing, no dynamic mappings. It also optionally returns `item_count` **only if** `payout_items(batch_id)` exists.

## Files
- `server/routes/adminPayoutBatchesRouter.js`
- `server/utils/pg.js`

## Install
```bash
npm i pg
# or
yarn add pg
```
Set `DATABASE_URL` (and optionally `PGSSLMODE=require`) in Replit Secrets.

## Register the router
```js
const { adminPayoutBatchesRouter } = require('./routes/adminPayoutBatchesRouter');
app.use('/api/admin/payout-batches', adminPayoutBatchesRouter);
```

## Verify
- `GET /api/admin/payout-batches/active` → returns latest row (same fields as before)
- `GET /api/admin/payout-batches?cycleId=18` → returns the rows for that cycle (Batch #13 etc.)

This is intentionally minimal and matches your live schema exactly.
