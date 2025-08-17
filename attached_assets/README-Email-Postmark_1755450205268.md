
# FinBoost — Transactional Email (Postmark)
Install:
```bash
npm i postmark
```

Env:
```
EMAIL_PROVIDER=postmark
POSTMARK_SERVER_TOKEN=xxxx
POSTMARK_MESSAGE_STREAM=outbound
EMAIL_FROM="FinBoost <no-reply@txn.finboost.app>"
POSTMARK_WEBHOOK_SECRET=optional-secret
SUPPORT_EMAIL=support@finboost.app
BRAND_ADDRESS="FinBoost Inc., 123 Example St, Toronto, ON"
```

Mount:
```js
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev/email', require('./routes/devEmailTest'));
}
app.use('/api/webhooks/postmark', require('./routes/postmarkWebhook'));
```

Send:
```js
const EmailService = require('../services/email/EmailService');
await EmailService.get().send('verify-email', {
  to: 'user@example.com',
  model: {
    firstName: 'Alex',
    verifyUrl: 'https://finboost.app/verify?token=...',
    supportEmail: process.env.SUPPORT_EMAIL,
    brandAddress: process.env.BRAND_ADDRESS
  }
});
```
Templates: `verify-email`, `password-reset`, `payout-processed`, `amoe-receipt`.
