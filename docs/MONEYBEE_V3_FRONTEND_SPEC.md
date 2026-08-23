# MoneyBee V3 Frontend Specification

This document applies the V3 architecture to the dedicated frontend repository. It is an implementation contract; features not present in code remain follow-up scope.

## Production applications

| Application | Domain | Responsibility |
| --- | --- | --- |
| Marketing | `moneybeeloan.com` | Ten acquisition pages, attribution, consent, prequalification |
| Borrower | `app.moneybeeloan.com` | Application, owners, banking, documents, conditions, offers, contracts, renewals |
| Lender | `lenders.moneybeeloan.com` | Submissions, underwriting, conditions, offers, programs, funded files |
| Admin | `admin.moneybeeloan.com` | Leads, operations, fraud review, matching, funding, commissions, compliance, audit |

All applications call `https://api.moneybeeloan.com/api/v2`. Human authentication uses Authorization Code + PKCE against `https://auth.codestra.co/realms/codestra`.

## Repository boundary

The frontend owns presentation, accessible interaction, local form state, route guards, analytics capture, and typed API consumption. It must not contain database credentials, vendor secrets, underwriting rules, fraud decisions, lender eligibility logic, commission calculations, or authoritative financial calculations.

## Target shared packages

- `api-client`: authenticated requests, request IDs, idempotency keys, problem details
- `auth`: Keycloak PKCE session and permission helpers
- `ui`: tokens, layout, components, accessibility primitives
- `forms`: resumable application form components
- `validation`: client-side feedback matching API constraints
- `analytics`: consent-aware acquisition and funnel events
- `types`: generated OpenAPI models

## Borrower feature slices

`dashboard`, `application`, `business`, `owners`, `banking`, `documents`, `conditions`, `offers`, `contracts`, `funding`, `renewals`, and `messages`.

The requirements endpoint is authoritative. Vue renders `completion_percentage`, `requirements`, and `next_action`; it does not invent completion rules.

Each section saves independently through versioned endpoints so a borrower can resume after closing the browser.

## Lender feature slices

`dashboard`, `submissions`, `underwriting`, `conditions`, `offers`, `programs`, `funded`, `reports`, and `settings`.

## Admin feature slices

`dashboard`, `leads`, `applications`, `fraud`, `underwriting`, `matching`, `lenders`, `funding`, `commissions`, `crm`, `integrations`, `compliance`, `complaints`, `affiliates`, `reporting`, `users`, and `audit`.

## API client rules

- One base URL ending in `/api/v2`
- Bearer tokens supplied by the auth package
- `X-Request-ID` on every request
- `Idempotency-Key` for supported commands
- JSON by default, with correct `FormData` handling
- RFC problem responses normalized into a typed error
- Generated types from the backend OpenAPI contract as the target state

## Completion flow

The acceptance path is acquisition → prequalification → account → resumable application → banking/documents → verification/fraud review → matching → lender submissions → conditions → normalized offers → accepted offer → contract/e-sign → funding → commission → renewal.

## Current implementation status

The repository currently provides the four runnable shells, ten marketing routes, prequalification, borrower requirements/offers views, lender programs, admin metrics/outbox visibility, a shared API client, container builds, and CI. Full PKCE wiring and the remaining feature slices above are not yet complete.
