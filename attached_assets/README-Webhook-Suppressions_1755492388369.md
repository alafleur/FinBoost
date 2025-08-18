
# FinBoost — Postmark Webhook Ingestion & Suppressions (TypeScript, ESM)

Adds:
1) Webhook ingestion for Delivery, Bounce, SpamComplaint, Open, Click
2) Suppressions: auto-suppress **marketing** to bounced/complaint emails (transactional unaffected)
3) Minimal admin endpoints for inspection

## Files
- server/routes/postmarkWebhook.enhanced.ts
- server/services/email/suppressions.ts
- shared/patches/schema.emailEvents.ts
- server/routes/adminEmail.ts (optional)

## Mount
```ts
import postmarkWebhookEnhanced from './routes/postmarkWebhook.enhanced.js';
app.use('/api/webhooks/postmark', postmarkWebhookEnhanced);
```
(Replace your previous webhook route with this one.)

## Admin (optional)
```ts
import adminEmailRouter from './routes/adminEmail.js';
app.use('/api/admin/email', adminEmailRouter);
```

## Schema
Copy `shared/patches/schema.emailEvents.ts` into `@shared/schema.ts` and run migrations.
