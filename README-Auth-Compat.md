# FinBoost — Auth Compatibility Router (TypeScript, ESM)

Fixes the **3 frontend API mismatches** without touching the frontend:
- `/api/auth/forgot-password`  → `/api/auth/password/request`
- `/api/auth/reset-password`   → `/api/auth/password/reset`
- `/api/auth/register`         → `/api/auth/signup`

## What this does
This router mounts your existing `authEmail` routes **and** provides legacy aliases that forward into the same handlers. No duplication of business logic, no HTTP sub-requests.

## Install
1) Add the file `server/routes/authCompat.ts` from this zip.
2) In `server/routes.ts`, replace the current mount:
```ts
// OLD
import authEmailRouter from './routes/authEmail.js';
app.use('/api/auth', authEmailRouter);

// NEW
import authCompatRouter from './routes/authCompat.js';
app.use('/api/auth', authCompatRouter);
```
> Nothing else changes. The "new" paths continue to work, and the "old" frontend paths start working immediately.

## Smoke tests (port 5000)
```bash
# Forgot → request
curl -X POST http://localhost:5000/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"you@txn.getfinboost.com"}'

# Reset → reset
curl -X POST http://localhost:5000/api/auth/reset-password -H "Content-Type: application/json" -d '{"token":"RAW","password":"NewStrongPass!23"}'

# Register → signup
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"email":"you@txn.getfinboost.com","password":"StrongPass!23"}'
```

## Notes
- Uses Express's internal router handling to forward the request to the real handler (method + body preserved).
- Safe to keep long-term; you can remove later once the frontend migrates to the new endpoints.