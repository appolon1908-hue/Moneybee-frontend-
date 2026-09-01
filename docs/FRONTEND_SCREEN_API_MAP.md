# MoneyBee frontend screen/API map

Updated: 2026-09-01

The frontend is a four-application Vue workspace. All protected applications use the shared authentication package, the centralized typed API client and the canonical backend `/api/v2` contract.

## Application shells

| Application | Audience | Primary purpose | API boundary |
| --- | --- | --- | --- |
| `apps/marketing` | Public prospects and partners | Explain MoneyBee and collect prequalification/contact/partner intake | Public `/public/*` writes only |
| `apps/borrower` | Business applicants | Complete an application, upload evidence, review offers/conditions/disclosures and track funding | Borrower-owned application and portal endpoints |
| `apps/lender` | Participating lenders | Review assigned submissions, bank evidence, conditions, decisions, offers and portfolio | Lender membership and permission-scoped endpoints |
| `apps/admin` | MoneyBee operations | Operate marketplace, finance, compliance, integrations, exceptions and system readiness | MoneyBee administrative permissions |

## Shared client boundary

Every screen imports functions from `@moneybee/api-client`. The shared client owns:

- canonical `VITE_API_BASE_URL` validation ending in `/api/v2`;
- bearer token and active organization headers;
- request/correlation IDs;
- idempotency and optimistic version headers;
- normalized problem responses;
- safe session recovery after 401;
- backend contract drift checks.

Screens must not call `fetch` directly, invent backend response types, calculate authoritative money or rewrite disclosure text.

## Marketing screens

| Screen/flow | Client operation | Backend endpoint | Required UI states |
| --- | --- | --- | --- |
| Prequalification form | Public intake service | `POST /public/prequalifications` | editing, validation errors, submitting, accepted, idempotent replay, conflict, rate limited, unavailable |
| Contact request | Public intake service | `POST /public/contact-requests` | editing, submitting, accepted, validation error, unavailable |
| Callback request | Public intake service | `POST /public/callback-requests` | editing, submitting, accepted, validation error, unavailable |
| Lender partner inquiry | Public intake service | `POST /public/lender-partner-inquiries` | editing, submitting, accepted, validation error, unavailable |
| Referral partner inquiry | Public intake service | `POST /public/referral-partner-inquiries` | editing, submitting, accepted, validation error, unavailable |
| Deal submission inquiry | Public intake service | `POST /public/deal-submission-inquiries` | editing, submitting, accepted, validation error, unavailable |

Public success means MoneyBee accepted durable intake evidence. It must not claim lender approval, guaranteed funding or provider delivery.

## Borrower screens

| Screen/route area | Shared client operation | Canonical endpoint(s) | Authority shown to the user |
| --- | --- | --- | --- |
| Dashboard/overview | borrower overview | `GET /borrower/overview` | Current applications, next tasks and alerts |
| Application list/detail | application services | application collection/item endpoints | Backend application state/version |
| Business information | application update | application business endpoint | Validated canonical business record |
| Financial profile | application update | application financial-profile endpoint | Decimal financial data stored by backend |
| Owners | owner collection/item services | application owner endpoints | Authorized beneficial-owner records |
| Requirements | requirements service | `GET /applications/{id}/requirements` | Missing/complete sections calculated by backend |
| Timeline | timeline service | `GET /applications/{id}/timeline` | Server event/state history |
| Submit application | submission service | `POST /applications/{id}/submit` | Guarded state transition; duplicate-click protection |
| Documents | borrower document/upload services | borrower application document and upload-session endpoints | Upload, checksum and scan state |
| Bank connection | banking service | link/exchange/sync/accounts/analysis endpoints | Provider/capability state and normalized bank evidence |
| Offers | offer service | `GET /applications/{id}/offers` | Backend amount, term, payment and availability |
| Financing disclosure | compliance service | `GET /borrower/offers/{offer_id}/commercial-financing-disclosure` | Exact immutable backend disclosure snapshot |
| Acknowledge disclosure | compliance service | `POST /borrower/offers/{offer_id}/commercial-financing-disclosure/acknowledge` | Authenticated actor and acknowledgment timestamp; idempotency key required |
| Accept offer | offer service | `POST /offers/{offer_id}/accept` | Separate guarded action after disclosure review |
| Conditions | borrower condition service | application condition list and condition submit endpoints | Required evidence and current condition status |
| Funding status | funding service | application funding endpoint | Backend funding lifecycle only; no client inference |
| Tasks/notifications/messages | portal services | borrower task, notification and conversation endpoints | User-owned operational work and communication history |

## Lender screens

| Screen/route area | Shared client operation | Canonical endpoint(s) | Required behavior |
| --- | --- | --- | --- |
| Workspace | lender workspace | `GET /lender/workspace` | Loading, empty queue, partial/degraded, success, error |
| Submission queue | lender submissions | `GET /lender/submissions` | Filters and backend assignment/visibility |
| Submission workspace | workspace detail | `GET /lender/submissions/{id}/workspace` | One authoritative application review context |
| Assignment | assignment service | lender submission assignment endpoint | Optimistic/current assignment state |
| Bank review | bank-review services | lender bank-review queue and transaction endpoints | Never expose provider credentials |
| Conditions | lender condition commands | create/approve/reject/waive endpoints | Confirmation and explicit illegal-state errors |
| Decisions | lender decision command | lender submission decision endpoint | Reason codes and authoritative result |
| Offers | lender offer command | lender submission offer endpoint | Backend validates amounts and terms |
| Portfolio/fundings | lender portfolio services | lender portfolio and funding endpoints | Read-only or capability-gated actions as returned |

## Admin screens and navigation

The admin shell groups navigation by the operator’s task rather than presenting one undifferentiated route list:

- **Work:** dashboard, operations portal, applications, underwriting, offers, SLA alerts.
- **Marketplace:** leads, lender programs, matches, submissions, lifecycle operations.
- **Finance & compliance:** financial ledger and compliance records.
- **Integrations:** public intakes, CRM deliveries, integration inbox, operational exceptions and CRM control.
- **Administration:** users, audit and system readiness.

| Admin screen | Route | Typed client/backend sources | Main operator outcome |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | admin dashboard/workspace | See current workload and system state |
| Operations portal | `/operations-portal` | admin workspace, queues and commands | Process assigned operational work |
| Applications/underwriting/offers | respective routes | admin catalog and decision endpoints | Review authoritative commercial state |
| Financial ledger | `/finance` | finance accounts, periods, journals, postings, trial balance | Review and control double-entry evidence |
| Compliance records | `/compliance` | compliance overview, paginated notices, disclosures and tax records | Resolve missing acknowledgment/delivery/TIN/filing evidence |
| Public intakes | `/public-intakes` | admin public-intake endpoints | Inspect durable public submissions |
| CRM deliveries | `/crm-deliveries` | CRM delivery endpoints | Review and safely requeue integration delivery |
| Integration inbox | `/integration-inbox` | admin integration inbox | Inspect authenticated/deduplicated inbound work |
| Operational exceptions | `/operational-exceptions` | exception list/resolve endpoints | Record explicit recovery evidence |
| System readiness | `/system` | capability/provider/readiness endpoints | See unavailable, configured, ready or degraded capability state |

## Compliance workspace behavior

`ComplianceView.vue` presents four clear operator regions:

1. action summary for unacknowledged disclosures, notices pending delivery evidence and 1099 records missing TIN;
2. commercial-financing disclosures with exact backend amounts/text and authenticated acknowledgment;
3. adverse-action notices with creditor, principal reasons, status and delivery evidence;
4. commission tax records with generation, encrypted write-only TIN and external filing-reference evidence.

The screen explicitly says that generating records or recording filing evidence does not transmit a tax filing or move money.

## UI state contract

Every data screen must intentionally render the relevant states rather than fall back to a permanent spinner or blank table:

- loading: contextual skeleton or disabled action with progress label;
- success: current backend data and last refresh context;
- empty: what is absent and the safe next step;
- validation failure: field-level message plus problem detail;
- permission denied: no data leakage and a clear access message;
- conflict/stale version: reload resource before repeating a mutation;
- rate limited: show retry context without automatic mutation replay;
- offline/network failure: preserve unsent form state and block ambiguous financial/compliance mutation retries;
- provider unavailable/degraded: honest capability message, never simulated success;
- partial data: identify the unavailable section while preserving usable authoritative data.

## Contract validation

Frontend CI checks out the configured backend contract ref, records its exact SHA, exports OpenAPI, runs route drift validation, TypeScript checks, unit tests, all four application builds and all four release-container vulnerability scans. The OpenAPI artifact and backend SHA are retained as workflow evidence.
