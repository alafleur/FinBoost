# FinBoost — Frontend Pages for Email Workflows

This adds two user-facing pages:
- `Verify.tsx` — consumes `?token=` and calls **GET** `/api/auth/verify?token=...`
- `Reset.tsx`  — consumes `?token=` and calls **POST** `/api/auth/password/reset`

## Files
- `client/src/pages/Verify.tsx`
- `client/src/pages/Reset.tsx`

## Router wiring
In your app router (e.g., `client/src/App.tsx` or wherever you define routes), add:
```tsx
import Verify from "@/pages/Verify";
import Reset from "@/pages/Reset";

// Example with react-router
<Route path="/verify" element={<Verify />} />
<Route path="/reset" element={<Reset />} />
```

## Notes
- Uses **relative** `/api/...` endpoints (same origin). If your frontend calls a different API origin, adjust `fetch` base.
- Shows clean success/error UI and disables buttons while loading.
- No assumptions about global user context.
