# MoneyBee final contract evidence

Updated: 2026-09-03

## Contract source

- Backend repository: `appolon1908-hue/Moneybee-Backend`
- Backend protected source head: `f19f3560c1abebee6f8ff7b5bcafec0e3ab07809`
- Backend protected merge commit: `474ab4eb96898f2d428b03b5fcee989b5b4182f9`
- Backend pull request: `#42`
- Canonical API prefix: `/api/v2`
- Canonical version-2 endpoint count: `176`
- Alembic head: `20260902_0028`
- Codestra connector SDK commit: `fd9a5c3fd49534a7f7492a452f53815c386687b9`

## Backend validation bound to this frontend review

The exact protected source head completed:

- `backend-ci` run `33752672777`: PASS
- `secure-scaffold-ci` run `33752672812`: PASS
- focused final-review remediation run `33752432983`: PASS
- static/source integrity: PASS
- private-key scan: PASS
- exactly one migration head: PASS
- empty and historical PostgreSQL upgrades: PASS
- migration downgrade/forward-fix guards: PASS
- least-privilege runtime and DDL denial: PASS
- application tests and API smoke: PASS
- OpenAPI contract and endpoint catalog: PASS
- API, worker, and migration release-target builds: PASS
- HIGH/CRITICAL vulnerability policy: PASS
- API, worker, and migrator SBOM publication: PASS
- all review threads resolved before protected merge: PASS

## Frontend validation requirement

The exact frontend head produced by this evidence update must:

1. check out backend protected merge `474ab4eb96898f2d428b03b5fcee989b5b4182f9`;
2. assert `git rev-parse HEAD` equals that value;
3. export OpenAPI from that checkout;
4. verify every detected frontend route against the canonical backend contract;
5. run TypeScript checks and unit tests;
6. prove pagination, partial-read failure isolation, stale-refresh suppression, retained idempotency keys, route-specific compliance authorization, exact-cent formatting, and borrower disclosure-before-acceptance behavior;
7. build marketing, borrower, lender, and admin applications;
8. build and scan all four release-container targets;
9. publish the exact frontend/backend contract artifact.

## Safety boundary

This evidence binds source and tests only. It does not deploy software, contact the production host, alter SSH, or enable payment, funding, lender submission, e-sign, email, SMS, tax filing, Odoo, n8n, storage, or any other external effect.
