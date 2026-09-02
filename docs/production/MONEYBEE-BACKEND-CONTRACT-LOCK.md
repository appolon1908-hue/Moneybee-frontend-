# MoneyBee backend contract lock

Updated: 2026-09-02

The frontend release candidate is validated against one immutable backend revision:

```text
Repository: appolon1908-hue/Moneybee-Backend
Pull request: #42
Branch: release/moneybee-repository-complete-20260902
Commit: bb5e00016be80c036500fb8cb382b3c47fd88c9b
```

## Backend evidence at the locked revision

- `secure-scaffold-ci` run `33659262034`: application and deployment-policy jobs passed.
- `backend-ci` run `33659262045`: verification, PostgreSQL identity/tenancy, API image, worker image, and migration image jobs passed.
- Full tests, API smoke, OpenAPI/additive manifests, endpoint catalog, migration rollback, and root Docker build passed.
- PostgreSQL historical/current/empty migration paths, legacy credential-reference fail-closed paths, least-privilege runtime tests, and DDL-denial tests passed.
- API, worker, and migration images passed dependency checks and HIGH/CRITICAL vulnerability policy.
- API, worker, and migration SBOM artifacts were generated and uploaded.
- Canonical OpenAPI contains 175 paths and 55 reviewed additive entries.
- Alembic head remains `20260901_0026`.
- Codestra MoneyBee connector package is pinned to SDK commit `fd9a5c3fd49534a7f7492a452f53815c386687b9`.

## Frontend release rule

Frontend CI must check out exactly the backend commit above, verify the checkout SHA, export its runtime OpenAPI, validate every detected frontend route, run TypeScript checks and tests, build all four applications, and build/scan all four release images.

Changing the backend contract requires a new reviewed lock commit and a complete frontend revalidation. A moving branch, tag, or repository variable is not an acceptable production release authority.

This lock does not deploy either repository or enable any live provider, financial mutation, message, filing, lender submission, or money movement.
