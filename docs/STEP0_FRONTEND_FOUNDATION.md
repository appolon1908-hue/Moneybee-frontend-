# Step 0B — Frontend foundation

Status: PARTIAL / NON-PRODUCTION.

Creates the Vue 3 + TypeScript + Vite pnpm workspace for marketing, borrower, lender and admin surfaces plus shared API, auth, generated-contract, UI, form, validation, error and feature-access packages.

Protected authentication is intentionally not faked. `frontend/keycloak-pkce` is the next authentication workstream.

All production-sensitive capabilities fail closed in `.env.example` and `packages/feature-access`.

## Lockfile gate

The complete resolved `pnpm-lock.yaml` is committed. CI is read-only and must start from `pnpm install --frozen-lockfile`; Docker builds must also use the frozen lockfile. A lockfile mismatch is therefore a hard failure rather than something repaired during release verification.

Do not deploy this branch. Do not auto-merge. Step 0 completion does not activate any production capability.
