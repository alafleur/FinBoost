
# FinBoost — Transactional Email (Postmark) — TypeScript ES Modules

## 1) Install deps
```bash
npm i postmark
# types are bundled with the SDK
```

## 2) Env vars
```
EMAIL_PROVIDER=postmark          # or 'mock' for local no-send
POSTMARK_SERVER_TOKEN=xxxxxxxx   # sandbox or live server token
POSTMARK_MESSAGE_STREAM=outbound # default
EMAIL_FROM="FinBoost <no-reply@txn.finboost.app>"
POSTMARK_WEBHOOK_SECRET=optional-shared-secret
SUPPORT_EMAIL=support@finboost.app
BRAND_ADDRESS="FinBoost Inc., 123 Example St, Toronto, ON"
```

## 3) Mount routes (in your Express TS app)
```ts
import devEmailTest from './routes/devEmailTest.js';
import postmarkWebhook from './routes/postmarkWebhook.js';

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev/email', devEmailTest);
}
app.use('/api/webhooks/postmark', postmarkWebhook);
```

## 4) Send from your code
```ts
import { getEmail } from '../services/email/EmailService.js';

await getEmail().send('verify-email', {
  to: 'user@example.com',
  model: {
    firstName: 'Alex',
    verifyUrl: 'https://finboost.app/verify?token=...',
    supportEmail: process.env.SUPPORT_EMAIL,
    brandAddress: process.env.BRAND_ADDRESS
  }
});
```

## Notes
- All files are `.ts` with **ES module** imports/exports and `"type":"module"` compatibility.
- Templates are HTML with a tiny mustache-like renderer. Each template begins with `{{> base.html}}` and gets injected into `base.html` at `{{> body.html}}`.
- Switch to local no-send: `EMAIL_PROVIDER=mock`.
- If you prefer Postmark **Template IDs**, we can swap to `sendEmailWithTemplate` easily.
