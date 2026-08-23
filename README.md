# MoneyBee Frontend

Vue 3/TypeScript monorepo for **MoneyBeeLoans** — “Business funding that keeps you moving.”

## Repository ownership

This repository owns four user experiences:

- Marketing website with ten distinct landing pages
- Borrower/client portal
- Lender portal
- Admin/operations portal

Shared packages own the MoneyBee design system, API client, authentication helpers, forms, validation, analytics capture, and accessibility patterns. The frontend never contains lender logic, approval decisions, secrets, direct CRM/vendor calls, or authoritative financial calculations.

## Canonical boundaries

- API: `https://api.moneybeeloan.com/api/v1`
- Identity issuer: `https://auth.codestra.co/realms/codestra`
- Portal authentication: Authorization Code + PKCE
- All forms submit to MoneyBee FastAPI; no form posts directly to a CRM
- No reference to `auth.codestra.agency` is permitted
- Disclosures, eligibility, matching, statuses, permissions, and offer ranking come from the backend

See [docs/FRONTEND_IMPLEMENTATION_SPEC.md](docs/FRONTEND_IMPLEMENTATION_SPEC.md) and [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

Detailed build sequence and implementation patterns: [Frontend build blueprint](docs/FRONTEND_BUILD_BLUEPRINT.md).

Mandatory launch gaps and evidence gates: [Production readiness requirements](docs/PRODUCTION_READINESS_REQUIREMENTS.md).
