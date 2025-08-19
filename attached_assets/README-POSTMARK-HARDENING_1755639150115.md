
# FinBoost – Postmark Deliverability Hardening

This bundle contains drop‑in files to reduce bounces and keep your Postmark
bounce rate < 10% and spam complaint rate < 0.1%.

**What changed**

- Central suppression checks before *every* send.
- Proper Transactional vs Broadcast stream selection (per template or override).
- Input validation of recipient emails (7‑layer validator).
- Robust webhook that stores events and creates suppressions for hard bounces/complaints.
- Safer dev testing route (protected by `DEV_EMAIL_TEST_SECRET`).

**Files**

- `server/services/email/types.ts`
- `server/services/email/render.ts`
- `server/services/email/suppressions.ts`
- `server/services/email/providers/postmark.ts`
- `server/services/email/EmailService.ts`
- `server/routes/postmarkWebhook.ts`
- `server/routes/devEmailTest.ts`
- `.env.example`

**How to install**

1. Copy these files into your project preserving the folders.
2. Ensure your `shared/schema.ts` has `email_events` and `email_suppressions` tables (it does in your repo).
3. Set the ENV vars from `.env.example` with your real values.
4. Mount the webhook in your main `routes.ts`:

```ts
import { registerPostmarkWebhook } from './routes/postmarkWebhook.js';
import { registerDevEmailTest } from './routes/devEmailTest.js';
// inside initRoutes(app):
registerPostmarkWebhook(app);
registerDevEmailTest(app); // optional in dev
```

5. Point Postmark to `POST https://<your-host>/api/webhooks/postmark`.

**Safety**

- If Postmark responds with "Inactive recipient" or a hard bounce error (codes 300/406),
  the address is added to `email_suppressions` to prevent future sends.
- Soft bounces do **not** suppress but are logged.

**Notes**

- Keep transactional emails on `outbound`; use `broadcast` only for bulk.
- Always verify and warm your sender domain & DKIM in Postmark.
- Never send to placeholders or test lists through the production server.

Generated: 2025-08-19T21:28:50.556405Z
