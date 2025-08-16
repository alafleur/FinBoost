
# Payout Batch Summary Router — Minimal Implementation

**No guessing.** Uses only confirmed columns:
- `payout_batches(id, cycle_setting_id, status, sender_batch_id, created_at)`

For `payout_items`, the router first checks that the table and the needed columns exist. If they don't, the corresponding fields are simply omitted from the response.

## Files
- `server/routes/payoutBatchSummaryRouter.js`

## Register the route
```js
const { payoutBatchSummaryRouter } = require('./routes/payoutBatchSummaryRouter');
app.use('/api/admin/payout-batches', payoutBatchSummaryRouter);
```

## Endpoint
`GET /api/admin/payout-batches/:id/summary`
