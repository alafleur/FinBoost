# Disbursement History — dedicated page

This adds a **separate section** for browsing and exporting payout history across **any cycle**.

## Files

Place these files:

- `client/src/components/admin/DisbursementHistory.tsx`
- `server/routes/admin-payout-export.ts`
- `server/routes/admin-cycles.ts`

Then update `server/routes.ts` to register the routes:

```ts
import { registerAdminPayoutExportRoutes } from "./routes/admin-payout-export";
import { registerAdminCyclesRoutes } from "./routes/admin-cycles";

// after app is created
registerAdminPayoutExportRoutes(app);
registerAdminCyclesRoutes(app);
```

And update your admin UI routing/navigation so this page is reachable (examples):

```tsx
// client/src/pages/Admin.tsx (example)
import DisbursementHistory from "@/components/admin/DisbursementHistory";

// add a tab or route
{activeTab === "disbursements" && <DisbursementHistory />}
```

## What you get

- A **full-width page** (not a side drawer).
- Pick any **cycle** → see all **batches**.
- Click **View** to see a live **summary**.
- Click **Export CSV** to download all items for that batch.

## Notes

- The CSV uses only snake_case columns that exist in your DB.
- If your storage method names differ, adjust the few storage calls:
  - `storage.getAllCycles()`
  - `storage.getPayoutBatchItems(batchId)`
- The page expects your auth token in `localStorage.token` (same as your other admin routes).
