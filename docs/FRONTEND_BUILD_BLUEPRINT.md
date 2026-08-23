# MoneyBee Frontend Build Blueprint

This blueprint adds implementation detail to the approved frontend specification. The API contract remains authoritative whenever an illustrative example differs.

## Repository layout

```text
apps/
  marketing/
    src/
      pages/
      features/
        prequalification/
      layouts/
      router/
      content/
  client-portal/
    src/
      pages/
      features/
      router/
  lender-portal/
    src/
      pages/
      features/
      router/
  admin-portal/
    src/
      pages/
      features/
      router/
packages/
  api-client/
  auth/
  ui/
  forms/
  validation/
  analytics/
  moneybee-theme/
  test-utils/
package.json
pnpm-workspace.yaml
turbo.json
```

TanStack Query owns remote/server state: applications, offers, documents, lender records, dashboards, and integration logs. Pinia owns session presentation, effective UI permissions, active tenant/context, navigation, and ephemeral UI state. Do not duplicate API entities into long-lived Pinia stores.

## Shared API client

Generate typed operations from the backend OpenAPI artifact. A small transport layer adds authentication, request IDs, idempotency, consistent problem details, and safe retry behavior.

```ts
export type RequestOptions = RequestInit & {
  idempotencyKey?: string
  requestId?: string
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const accessToken = await auth.getAccessToken()
  const requestId = options.requestId ?? crypto.randomUUID()

  const response = await fetch(`${runtime.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
      ...(options.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw await toMoneyBeeProblem(response, requestId)
  }

  return response.status === 204
    ? (undefined as T)
    : await response.json()
}
```

Requirements:

- runtime configuration is public-only and environment-specific;
- token acquisition uses the shared OIDC/PKCE package;
- no tokens or sensitive payloads are logged;
- only idempotent reads retry automatically;
- mutations retry only with an idempotency key and explicit policy;
- field errors from `422` map to VeeValidate paths;
- stale versions from `409` offer reload/merge recovery;
- `401` triggers controlled reauthentication, not an infinite loop;
- `403` provides a safe permission message;
- `429` respects server retry guidance.

## Marketing implementation

Use a typed configuration registry for intent-specific facts, but each page must supply unique content sections rather than only a different headline.

```ts
export type LandingPageKey =
  | "business-loans"
  | "working-capital"
  | "business-line-of-credit"
  | "equipment-financing"
  | "sba-loans"
  | "fast-business-funding"
  | "restaurant-financing"
  | "trucking-business-loans"
  | "construction-business-loans"
  | "retail-business-loans"

export interface LandingPageContent {
  path: `/${LandingPageKey}`
  title: string
  description: string
  pageId: LandingPageKey
  useCases: readonly string[]
  eligibilityTopics: readonly string[]
  faqKeys: readonly string[]
  productDisclosureKey: string
}
```

The registry must cover all ten required routes. Page composition uses shared Header, Hero, Trust, Process, ProductDetails, Eligibility, UseCases, WhyMoneyBee, FAQ, FinalCTA, and LegalDisclosure components. Legal copy is rendered from approved versioned content/configuration, not improvised in Vue.

### Prequalification feature

One `PrequalForm` serves every landing page. Break it into:

```text
PrequalForm
  FundingAmountStep
  UseOfFundsStep
  TimeInBusinessStep
  MonthlyRevenueStep
  ContactAndConsentStep
  SubmissionStatus
```

The feature:

- loads initial attribution once and preserves first touch;
- updates last-touch attribution on subsequent visits;
- validates through the schema generated/aligned with OpenAPI;
- generates one idempotency key per intended submission;
- posts to `/api/v2/public/prequalifications`;
- treats the returned state as `RECEIVED`, never approved;
- navigates only to the backend-provided allowlisted next-action URL;
- retains non-sensitive draft data after a recoverable network failure;
- does not retain anti-bot tokens, consent evidence, or sensitive fields;
- announces step, validation, submission, and recovery states accessibly.

Attribution fields: page ID, original/current referrer, UTM source/medium/campaign/content/term, GCLID, FBCLID, affiliate ID, call-tracking ID, session ID, and consent mode. Analytics events must exclude contact, revenue, requested amount, bank, credit, document, and identity data.

## Borrower portal routes and API mapping

| Route | Feature | Primary API |
|---|---|---|
| `/dashboard` | dashboard/next action | `GET /client/dashboard` |
| `/application` | application overview | `GET /applications/{id}` |
| `/application/business` | business information | `GET/PUT /applications/{id}/business` |
| `/application/owners` | owners | `GET/POST/PATCH/DELETE /applications/{id}/owners...` |
| `/application/financials` | financial information | `PATCH /applications/{id}` |
| `/documents` | requirements/uploads | `/applications/{id}/documents` |
| `/banking` | bank connection | `POST /banking/link-token` |
| `/verification` | verification status | `/applications/{id}/business-verification` |
| `/offers` | comparison | `GET /applications/{id}/offers` |
| `/offers/:id` | offer detail/decision | `GET /offers/{id}` |
| `/contracts` | e-sign status | `GET /applications/{id}/contracts` |
| `/funding` | funding status/history | application funding endpoints |
| `/messages` | communications | `GET /applications/{id}/messages` |
| `/profile` | profile/session | identity/profile endpoints |
| `/security` | sessions/security | identity/session endpoints |

Render completion exclusively from `GET /applications/{id}/requirements`. Render timeline exclusively from `GET /applications/{id}/timeline`. The frontend cannot set arbitrary pipeline statuses.

Document uploads follow: request upload session → validate returned restrictions → upload directly to authorized storage URL → confirm/status poll as defined → display scan/classification state. Never mark a document complete before backend confirmation.

Bank connection follows: request link token → launch approved Link component → send public token to backend exchange → await backend/webhook-derived status. Vendor secrets never enter Vue.

## Lender portal routes

```text
/dashboard
/applications
/applications/:id
/underwriting
/conditions
/offers
/funded-deals
/programs
/reports
/users
/api
/settings
```

Primary APIs:

- `GET /lender/dashboard`
- `GET /lender/applications`
- `GET /lender/applications/{id}`
- `POST /lender/applications/{id}/decision`
- `POST /lender/applications/{id}/conditions`
- `POST /lender/applications/{id}/offers`
- `GET /lender/offers`
- `GET /lender/fundings`
- lender program and user endpoints

The application page must show only backend-authorized fields. Credit/PII/document sections use separate permission checks and masked defaults. All lists use server filtering/pagination. Offer creation is validated locally for usability and by the backend authoritatively.

## Admin portal modules and APIs

Modules:

```text
Control Center
Leads
Applications
Pipeline
Businesses
Borrowers
Underwriting
Lender Matching
Lenders
Programs
Submissions
Offers
Documents
Bank Analysis
Verification
CRM
Integration Logs
Webhook Logs
Funding
Commissions
Compliance
Consents
Disclosures
Adverse Actions
Communications
Marketing
Landing Pages
Campaigns
Reports
Users
Roles
Permissions
Audit Log
System Health
```

Dashboard APIs:

- `GET /admin/dashboard`
- `GET /admin/pipeline`
- `GET /admin/funnel`
- `GET /admin/funding-summary`
- `GET /admin/marketing-performance`
- `GET /admin/integration-health`

CRM control center:

- `GET /admin/crm/events`
- `GET /admin/crm/events/{id}`
- `POST /admin/crm/events/{id}/retry`
- `POST /admin/crm/events/{id}/replay`
- `GET/PUT /admin/crm/mappings`

Show counts and sanitized status only. Retry/replay requires confirmation, reason, permission, idempotency, and audit correlation. Never display raw authorization headers, provider secrets, unbounded response bodies, or sensitive CRM payloads.

## Authentication and route authorization

Roles may include client, lender, and MoneyBee operational roles, but UI gates consume backend-returned effective permissions such as:

```text
lead.read
lead.assign
application.read
application.edit
application.submit
document.read
document.upload
lender.manage
program.manage
offer.create
offer.accept
underwriting.review
funding.approve
compliance.read
compliance.1071.read
user.manage
```

Each application has its own OIDC client and exact redirect/logout URI allowlist. The canonical authority is `https://auth.codestra.co/realms/codestra`. No legacy `auth.codestra.agency` configuration is allowed.

Route guards improve navigation but never replace backend authorization. On tenant/context change, clear cached server state before loading the new scope.

## Runtime variables

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v2
VITE_OIDC_AUTHORITY=https://auth.codestra.co/realms/codestra
VITE_OIDC_CLIENT_ID=
VITE_OIDC_AUDIENCE=
VITE_APP_ENV=local
```

Only public identifiers/configuration belong in frontend variables. Do not add CRM, lender, database, Plaid, KYB, credit, e-sign, email, or SMS secrets.

## Build order

1. pnpm/Turborepo and shared theme/UI.
2. generated API client and problem handling.
3. OIDC/PKCE session and permission gates.
4. marketing shell and ten content configurations.
5. shared prequalification form and attribution.
6. borrower portal and progressive application.
7. documents, banking, verification, offers, contracts, and messages.
8. lender portal and offer/program workflows.
9. admin portal, CRM/integration health, reporting, compliance, and audit.
10. accessibility, unit, contract, responsive E2E, and security testing.
11. staging certification against the pinned backend OpenAPI artifact.

Completion requires all four applications to execute the synthetic V1 journey with mock/staging providers and zero direct vendor/CRM calls or frontend-owned financial decisions.
