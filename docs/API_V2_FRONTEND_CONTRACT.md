# MoneyBee API V2 Frontend Contract

The frontend connects to the backend only through `https://api.moneybeeloan.com/api/v2` and the generated OpenAPI contract.

## Repository boundary

Frontend code may contain presentation, local form state, validation feedback, typed API calls, route guards, analytics, and accessibility behavior. It must never contain PostgreSQL/Redis credentials, provider secrets, underwriting rules, fraud decisions, credit rules, commission calculations, funding logic, or direct CRM/lender/bank/KYB/e-sign calls.

## Capability-aware features

The shared `@moneybee/feature-access` package loads `GET /me/capabilities`. Applications may use the result to hide or disable unavailable features.

Frontend hiding is not authorization. Every sensitive backend command must independently check permission, record ownership/organization scope, capability state, provider readiness, credentials, and application state.

The admin System route provides a read-only view of effective capability flags and provider connections. High-risk activation is intentionally not exposed as an unrestricted UI toggle.

## Typed API target

CI should generate `packages/generated-api` from the backend `/openapi.json`. Feature code should consume named typed operations instead of creating arbitrary URLs. Contract drift must fail CI before deployment.

## Application structure

- Marketing: pages, acquisition features, reusable components, router, app shell
- Borrower: application, business, owners, banking, documents, conditions, offers, contracts, funding, renewals, messages
- Lender: submissions, underwriting, conditions, offers, programs, funded files, reports
- Admin: leads, applications, fraud, matching, lenders, funding, commissions, integrations, compliance, audit, and system readiness

## Current status

API v2 is now the frontend default. The v1 route remains a temporary backend compatibility alias and is not included in the canonical OpenAPI document. Capability consumption and the read-only admin readiness view are implemented. Generated API code, full PKCE session handling, feature-level integration, Playwright coverage, and the remaining application screens are still open work.
