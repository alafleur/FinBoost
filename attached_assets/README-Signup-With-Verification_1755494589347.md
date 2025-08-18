# FinBoost — Drop-in Signup with Email Verification (TypeScript, ESM)

This file replaces your `server/routes/signup.ts` and wires **email verification** directly into the signup flow.

## What it does
- Creates the user (with bcrypt password hash, lowercase email)
- Generates a **24h verification token** (SHA-256 hash stored in DB)
- Sends the **verify-email** template via your existing EmailService/Postmark
- Returns `201 { success: true, userId, needVerification: true }`

## Route
`POST /api/auth/signup`

Request body:
```json
{ "email": "user@example.com", "password": "StrongPass!23", "username": "optional" }
```

## Mount (server/routes.ts)
If you already mount your signup router at `/api/auth`, nothing else to change. Otherwise:
```ts
import signupRouter from './routes/signup.js';
app.use('/api/auth', signupRouter);
```

## Env required
- EMAIL_PROVIDER=postmark
- POSTMARK_SERVER_TOKEN=****
- POSTMARK_MESSAGE_STREAM=outbound
- EMAIL_FROM="FinBoost <no-reply@txn.getfinboost.com>"
- SUPPORT_EMAIL=support@getfinboost.com
- BRAND_ADDRESS="FinBoost Inc., Toronto, ON"
- VERIFY_BASE_URL=https://getfinboost.com/verify

## Smoke test (port 5000)
```bash
curl -X POST http://localhost:5000/api/auth/signup   -H "Content-Type: application/json"   -d '{"email":"you@example.com","password":"StrongPass!23","username":"you"}'
```
You should receive a verification email. The token row will appear in `email_verification_tokens` (hash stored).
