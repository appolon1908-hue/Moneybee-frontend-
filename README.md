# MoneyBee Frontend

Vue 3/TypeScript frontend for **MoneyBeeLoans** — “Business funding that keeps you moving.”

## Included baseline
- Marketing home and application intake
- Borrower, lender and operations routes
- Authorization Code + PKCE via `oidc-client-ts`
- Runtime role guards and typed/Zod-validated MoneyBee API client
- Responsive UI, Docker/Nginx security headers and CI build/typecheck

## Local start
```bash
cp .env.example .env
npm install
npm run dev
```

The browser never contains lender decision logic, provider secrets, CRM credentials or authoritative financial calculations. See `docs/PRODUCTION_READINESS.md` before launch.
