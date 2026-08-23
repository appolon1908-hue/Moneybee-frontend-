# Step 0B — Frontend foundation

Status: PARTIAL / NON-PRODUCTION.

Creates the Vue 3 + TypeScript + Vite pnpm workspace for marketing, borrower, lender and admin surfaces plus shared API, auth, generated-contract, UI, form, validation, error and feature-access packages.

Protected authentication is intentionally not faked. `frontend/keycloak-pkce` is the next authentication workstream.

All production-sensitive capabilities fail closed in `.env.example` and `packages/feature-access`.

## Lockfile gate

The committed `pnpm-lock.yaml` is a bootstrap seed because this execution environment cannot resolve npm packages. CI resolves the complete graph and then proves a frozen second install. This PR must remain draft until the complete generated lock snapshot is committed and `pnpm install --frozen-lockfile` passes from a clean checkout.

Do not deploy this branch. Do not auto-merge.
