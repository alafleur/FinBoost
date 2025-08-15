# Replit integration notes

## Files to replace / add
- Replace `client/src/components/admin/CycleOperationsTab.tsx` with the provided file.
- Replace `server/routes/admin-payout-batches.ts` with the provided file.
- Add new `server/routes/admin-payout-history.ts` with the provided file.
- In `server/routes.ts`, ensure:
  ```ts
  import { registerAdminPayoutBatchRoutes } from "./routes/admin-payout-batches";
  import { registerAdminPayoutHistoryRoutes } from "./routes/admin-payout-history";

  // later, when mounting routes
  registerAdminPayoutBatchRoutes(app);
  registerAdminPayoutHistoryRoutes(app);
  ```

## Storage helpers (already present if you added earlier)
If not present, append methods to `server/storage.ts`:
- `listBatchesForCycle(cycleId)`
- `getBatchItemStats(batchId)`
- `createRetryBatchFromFailed(batchId)`
- `markBatchCompletedIfTerminal(batchId)` (optional)

All SQL must use your snake_case columns:
- `payout_batches`: id, status, cycle_setting_id, created_at, updated_at, completed_at, paypal_batch_id, total_chunks, processed_chunks
- `payout_batch_items`: id, batch_id, user_id, paypal_email, amount, currency, status, created_at, updated_at, cycle_winner_selection_id

## Smoke tests
1. Refresh with a previously completed batch: no modal, green ribbon shows; CTA not stuck on "Processing...".
2. Start a new batch: modal opens, progresses, auto-closes on completion; ribbon updates.
3. Open History: list renders; viewing a batch shows summary; Retry Failed creates a new batch.
4. Auth: routes return 401 without a token; work when authorized.

## Notes
- The UI uses plain `<button>` tags to avoid dependency on your design system.
- If you have a toast system, add notifications where commented.
- No JSX appears inside hooks—compile should be clean.
