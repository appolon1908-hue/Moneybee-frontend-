# MoneyBee Frontend Authority Boundaries

Status: architectural contract for implementation. This document does not implement authentication and does not enable any live financial capability.

## Backend authority

The MoneyBee backend is authoritative for authentication binding, tenancy, authorization, lending state, financial decisions, concurrency, idempotency, audit, provider commands, and release readiness.

Frontend checks are UX/navigation controls only. They must never be treated as proof of authorization.

The browser must not decide or persist authoritative values for:

- lending eligibility
- lender selection
- accepted offer state
- condition satisfaction/waiver
- contract readiness/signature truth
- funding readiness, approval, send, confirmation, or reconciliation
- commission truth
- tenant/resource access
- readiness or capability activation

## Authentication

The approved authentication implementation is Keycloak Authorization Code + PKCE in the dedicated `frontend/keycloak-pkce` PR.

The frontend may bootstrap the user session, handle token renewal/expiry, handle 401/403 responses, protect routes, and allow selection of an active organization. The backend must still validate the token, bind `issuer + subject` to a local identity, resolve active membership/permissions, and authorize every protected resource/action.

Do not implement fake production authentication.

## API contract

The frontend uses the backend's canonical `/api/v2` contract. Generated/typed clients should be derived from the committed OpenAPI contract where possible. Financial writes must pass required `Idempotency-Key` and `If-Match` values supplied by the backend contract; the frontend does not weaken or bypass those requirements.

## System of record

MoneyBee owns lending truth. Odoo is a CRM projection. Codestra is an integration/control plane. External providers are accessed through backend-controlled adapters and durable event processing. The frontend must never write directly to those systems to create authoritative lending or financial state.

## Capability freeze

The frontend must not expose or activate live high-risk financial behavior while the corresponding backend capability remains disabled:

```text
credit.live_pull=false
lenders.live_submission=false
esign.live_send=false
funding.live_confirmation=false
payments=false
payouts=false
```

UI availability is not capability authorization. The backend remains the final gate.
