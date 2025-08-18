# FinBoost — Email Workflow Integration (TypeScript, ESM)

This patch adds **email verification**, **password reset**, and ready hooks for **payout notifications** using your existing Postmark setup.

## Files added by this patch
- `server/routes/authEmail.ts` — new router with:
  - `POST /api/auth/verify/request` — send verification email
  - `GET  /api/auth/verify`         — verify token, mark user verified
  - `POST /api/auth/password/request` — send password reset email
  - `POST /api/auth/password/reset`   — apply new password
- `shared/patches/schema.emailVerification.ts` — copy into your `@shared/schema.ts` to add the verification token table and (optional) `emailVerified/verifiedAt` on `users`.
- `server/services/email/templates/verify_email.html` — template (same include style as your existing emails).

## 1) Schema changes (Drizzle)
Open `@shared/schema.ts` and add this block (or merge fields if they already exist):

```ts
// 1) Users: add verification flags (optional but recommended)
export const users = pgTable("users", {
  // ...your existing fields
  emailVerified: boolean("email_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
});

// 2) Email Verification Tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"),
});
export type EmailVerificationToken = InferSelectModel<typeof emailVerificationTokens>;
export type InsertEmailVerificationToken = InferInsertModel<typeof emailVerificationTokens>;
```

Then run your Drizzle migration to create the table (and fields, if added).

## 2) Mount the router
In `server/routes.ts`, add near your other routers:
```ts
import authEmailRouter from './routes/authEmail.js';
app.use('/api/auth', authEmailRouter);
```

## 3) Env (you likely have these already)
```
EMAIL_PROVIDER=postmark
POSTMARK_SERVER_TOKEN=****
POSTMARK_MESSAGE_STREAM=outbound
EMAIL_FROM=FinBoost <no-reply@txn.getfinboost.com>
SUPPORT_EMAIL=support@getfinboost.com
BRAND_ADDRESS=FinBoost Inc., Toronto, ON
POSTMARK_WEBHOOK_SECRET=****
VERIFY_BASE_URL=https://getfinboost.com/verify
RESET_BASE_URL=https://getfinboost.com/reset
```

## 4) Local tests (port 5000)
```bash
curl -X POST http://localhost:5000/api/auth/verify/request -H "Content-Type: application/json" -d '{"email":"you@example.com"}'
curl "http://localhost:5000/api/auth/verify?token=YOUR_TOKEN"
curl -X POST http://localhost:5000/api/auth/password/request -H "Content-Type: application/json" -d '{"email":"you@example.com"}'
curl -X POST http://localhost:5000/api/auth/password/reset -H "Content-Type: application/json" -d '{"token":"YOUR_TOKEN","password":"NewStrongPass!23"}'
```

## 5) Note
Router uses `bcryptjs` for hashing; if not installed: `npm i bcryptjs`.
