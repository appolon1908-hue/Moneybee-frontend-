# MoneyBee backend contract lock

Updated: 2026-09-03

The frontend release candidate is validated against the protected backend merge produced by PR #42:

```text
Repository: appolon1908-hue/Moneybee-Backend
Pull request: #42
Protected source head: f19f3560c1abebee6f8ff7b5bcafec0e3ab07809
Protected merge commit: 474ab4eb96898f2d428b03b5fcee989b5b4182f9
Branch authority: main
```

## Backend evidence at the locked revision

- `backend-ci` run `33752672777`: verification, PostgreSQL identity/tenancy, least-privilege runtime, API/worker/migrate builds, vulnerability gates, and SBOM publication passed.
- `secure-scaffold-ci` run `33752672812`: application and deployment-policy validation passed.
- Focused final-review remediation run `33752432983` passed before the temporary remediation workflow was removed.
- Every PR #42 review thread was resolved before the protected merge.
- Canonical OpenAPI contains 176 version-2 paths; version-1 compatibility aliases remain intentionally excluded from the canonical document.
- Alembic head is `20260902_0028`.
- The final OpenAPI artifact is `9892179357`, digest `sha256:9844bd703e893ede5f6bbe6d8831e3321d75c454ee6ecd41536bba3fd3cb1932`.
- API SBOM artifact `9892280718` has digest `sha256:8436ab4fe1bc7d8ba102a8b59f9b18acd802f14a0140c8dfce307bd334a33923`.
- Worker SBOM artifact `9892267172` has digest `sha256:67548a47066b47fb787dca1a1b54b9c4b563f49a2b64a3a48e2b0b0e093eb64c`.
- Migrator SBOM artifact `9892283084` has digest `sha256:0caf6013cd535f53caf5ea7b29a0db3ab63565373c684cfcad947c72d9ff25af`.
- Codestra MoneyBee connector package remains pinned to SDK commit `fd9a5c3fd49534a7f7492a452f53815c386687b9`.
- No provider, delivery, filing, funding, payout, payment, Odoo, n8n, object-storage, or dialing capability was enabled by the merge.

## Frontend release rule

Frontend CI must check out exactly `474ab4eb96898f2d428b03b5fcee989b5b4182f9`, verify the checkout SHA, export its runtime OpenAPI, validate every detected frontend route, run TypeScript checks and tests, build all four applications, and build/scan all four release images.

Changing the backend contract requires a new reviewed lock commit and complete frontend revalidation. A moving branch, tag, repository variable, PR head, or unmerged candidate is not an acceptable production release authority.

This lock does not deploy either repository or authorize a production or external provider mutation.
