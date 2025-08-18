# FinBoost — Email Hardening & UX Kit (TypeScript, ESM)

This patch addresses top priorities:
1) Wire verification into signup (hook + banner)
2) Security wins: rate limiting + token hashing
3) Payout email helper

Includes:
- server/routes/authEmail.secure.ts
- server/services/email/payoutEmail.ts
- client/src/components/VerificationBanner.tsx

Install:
npm i express-rate-limit bcryptjs
