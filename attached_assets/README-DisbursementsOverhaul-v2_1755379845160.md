
# FinBoost — Disbursements Overhaul Patch (Backend) — v2

**Fix:** Schema detection now prefers `cycle_setting_id` for your batches table and still falls back to `cycle_id` / `cycleId`. Numeric `cycleId` parsing retained.

## Install & Wire

1. Copy files:
   - `server/routes/adminPayoutBatchesRouter.js`
   - `server/utils/pg.js`
2. `npm i pg` (if not present)
3. In server bootstrap:
   ```js
   const { adminPayoutBatchesRouter } = require('./routes/adminPayoutBatchesRouter');
   app.use('/api/admin/payout-batches', adminPayoutBatchesRouter);
   ```
4. Ensure `DATABASE_URL` (and optionally `PGSSLMODE=require`) in env.

## Verify
- `GET /api/admin/payout-batches?cycleId=18` should now return rows (Batch #13, etc.).
- Admin → Disbursements tab should populate the **Batches** list.
