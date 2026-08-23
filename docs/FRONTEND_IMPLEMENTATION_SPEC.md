# MoneyBee Frontend Implementation Specification

Status: approved planning baseline  
Repository: `appolon1908-hue/Moneybee-frontend-`  
Backend dependency: `appolon1908-hue/Moneybee-Backend`

## 1. Mission and hard boundary

Build a production-grade Vue 3/TypeScript monorepo for the MoneyBeeLoans marketing site, borrower portal, lender portal, and admin portal.

Frontend answers only: **what does an authorized user see and click?**

It must not:

- connect directly to the CRM, database, Plaid secret APIs, KYB/KYC, credit, e-sign, email, SMS, or lender APIs;
- implement lender eligibility, matching, underwriting, permissions, disclosures, financial calculations, or offer ranking;
- store secrets or full sensitive identifiers;
- infer access from hidden buttons—backend authorization is authoritative.

All reads and writes use the versioned MoneyBee API over HTTPS. Every mutation must support request IDs and idempotency where defined by the API contract.

## 2. Technology and monorepo

- Vue 3 Composition API
- TypeScript in strict mode
- Vite
- Vue Router
- Pinia
- TanStack Query Vue
- Tailwind CSS
- shadcn-vue
- Zod and VeeValidate
- ECharts
- VueUse
- Vitest and Vue Testing Library
- Playwright
- pnpm workspaces and Turborepo
- ESLint, Prettier, Stylelint, commit linting

```text
apps/
  marketing/
  client-portal/
  lender-portal/
  admin-portal/
packages/
  ui/
  api-client/
  auth/
  forms/
  validation/
  analytics/
  moneybee-theme/
  test-utils/
```

Each application owns routes and page composition. Shared packages must not import from application folders.

## 3. Brand and accessibility

Brand: **MoneyBeeLoans**  
Tagline: **Business funding that keeps you moving.**

| Token | Value |
|---|---:|
| Deep Navy | `#10243E` |
| Honey Gold | `#F5B942` |
| Warm Amber | `#E69A18` |
| Cream | `#FFF9ED` |
| Slate | `#64748B` |
| Success Green | `#159447` |
| Danger Red | `#D63C3C` |
| White | `#FFFFFF` |

The bee motif must be professional: subtle hexagonal geometry and an abstract MB/bee mark. Gold is an accent, not the dominant page color.

Required quality:

- WCAG 2.2 AA color contrast and keyboard operation
- semantic landmarks, headings, inputs, error summaries, and focus management
- minimum 44×44 CSS-pixel touch targets
- reduced-motion support
- responsive layouts from 320px through desktop
- screen-reader announcements for form progress, uploads, status changes, and errors
- no color-only status communication

## 4. Marketing application

### Required landing pages

| Route | Page | Hero |
|---|---|---|
| `/business-loans` | Small Business Loans | Business funding built around your business. |
| `/working-capital` | Working Capital | Give your business more room to move. |
| `/business-line-of-credit` | Business Line of Credit | Capital when you need it—not when you don't. |
| `/equipment-financing` | Equipment Financing | Get the equipment. Keep your cash working. |
| `/sba-loans` | SBA Loans | Longer-term financing for your next stage of growth. |
| `/fast-business-funding` | Fast Business Funding | Need capital quickly? Start with one simple application. |
| `/restaurant-financing` | Restaurant Financing | Funding built for restaurants that never stop moving. |
| `/trucking-business-loans` | Trucking Financing | Keep your trucks—and your business—on the road. |
| `/construction-business-loans` | Construction Financing | Fund the next job before the last invoice clears. |
| `/retail-business-loans` | Retail Financing | Stock up, expand and keep selling. |

These are ten intent-specific pages, not duplicated pages with only a swapped title. Each needs unique product/industry content, use cases, eligibility explanation, FAQs, metadata, schema markup, canonical URL, and analytics page identifier.

Shared conversion structure:

1. Header: Funding Solutions, Industries, How It Works, Resources, Login, Check My Options.
2. Hero with supportable credibility treatment and embedded prequalification start.
3. Trust: secure application, multiple financing options, human specialists.
4. Four-step MoneyBee process.
5. Intent-specific product details, eligibility, use cases, and reasons to choose MoneyBee.
6. FAQ.
7. Final CTA: “See what funding may fit your business.”
8. legal and jurisdiction-aware disclosures from the backend/content configuration.

Never claim approval times, rates, funding amounts, lender counts, approval percentages, guaranteed approval, or “best” terms without approved and supportable source data.

### Shared prequalification form

Implement one reusable `MoneyBeePrequalForm` component across all ten routes.

1. Funding amount: $5K, $10K, $25K, $50K, $100K, $250K, $500K+.
2. Use of funds: working capital, equipment, expansion, inventory, marketing, payroll, debt refinance, other.
3. Time in business: under 6 months, 6–12 months, 1–2 years, 2–5 years, 5+ years.
4. Approximate monthly revenue: under $10K, $10–25K, $25–50K, $50–100K, $100–250K, $250K+.
5. Business name, first name, last name, email, phone, ZIP, required disclosures/consents.

Submit only to `POST /api/v1/public/prequalifications`.

Requirements:

- Zod schema aligned with the OpenAPI schema
- E.164 phone normalization feedback, email validation, US postal validation where applicable
- preserve first touch, last touch, page, referrer, UTM fields, GCLID, FBCLID, device, affiliate, and call-tracking ID
- explicit consent copy/version from backend configuration
- anti-bot token support without exposing secret keys
- prevent accidental duplicate submissions while allowing safe server-side idempotent retry
- accessible inline and summary errors
- confirmation uses returned lead/reference ID; never invent an approval result
- offline/network failure retains entered non-sensitive values locally and explains retry

## 5. Borrower portal

Target host: `app.moneybeeloans.com`.

Navigation:

- Dashboard
- Application
- Documents
- Bank Connection
- Funding Offers
- Messages
- Funding History
- Profile
- Support

Implement:

- dashboard progress and authoritative next action
- progressive business, financial, ownership, document, and consent application
- save/resume with conflict handling
- multiple-owner management
- upload sessions directly to approved object-storage URLs returned by the API
- Plaid Link UI using backend-issued link tokens; public token exchange goes to the backend
- application requirements and status history
- messages and notification preferences
- offer comparison and detail
- funding history
- secure profile and session controls

Owner sensitive values must be masked. Full SSN must never be rendered after initial secure collection; use a backend-approved tokenization/hosted-field flow.

Offer details display backend-provided amount, product, term, payment frequency, estimated payment, APR/factor rate when applicable, origination/other fees, total repayment, prepayment terms, collateral, personal guarantee, expiration, and product/jurisdiction disclosure. Ranking labels must come from transparent backend criteria, never frontend compensation logic.

## 6. Lender portal

Target host: `lenders.moneybeeloans.com`.

Navigation:

- Dashboard
- Applications
- Matches
- Underwriting
- Offers
- Conditions
- Documents
- Funded Deals
- Programs
- Reporting
- Users
- API
- Settings

Implement role-aware lender dashboards and queues, server-driven filters, application detail, authorized document access, conditions, decline/request-documents actions, offer creation, lender program editing, funded-deal views, reporting, API credentials metadata, and user administration.

Offer form: funding amount, product, term, rate/factor, APR where applicable, payment amount/frequency, origination/other fees, guarantee, collateral, expiration, and conditions. Validate client-side for usability, but treat backend validation and authorization as final.

Never expose applications, owners, documents, bank data, or credit information belonging to another lender/tenant.

## 7. Admin portal

Target host: `admin.moneybeeloans.com`.

Navigation:

- Control Center
- Leads, Applications, Businesses, Borrowers
- Pipeline, Underwriting, Lender Matching, Offers
- Lenders, Programs, Routing Rules
- Documents, Bank Data, Verification
- CRM, Integrations, Webhook Logs
- Communications
- Funding, Commissions, Accounting
- Compliance, Disclosures, Adverse Actions, Consents
- Landing Pages, Campaigns, Analytics
- Users, Roles, Permissions
- Audit Logs
- System

Implement server-authorized pages for funnel dashboards, pipeline operations, manual underwriting, matching explanations, offer review, lender/program management, routing rules, document review, bank/KYB status, integration health, webhook/DLQ inspection and retry, communications, funding, commissions, disclosure/adverse-action workflows, analytics, user/RBAC administration, immutable audit inspection, and system status.

Destructive or sensitive actions require explicit confirmation, reason capture where required, and optimistic UI only when safely reversible. PII remains masked by default.

## 8. Authentication and API behavior

- Canonical issuer: `https://auth.codestra.co/realms/codestra`
- Authorization Code + PKCE S256 for humans
- separate OIDC clients and redirect allowlists per application/environment
- access token in memory; secure refresh/session design approved by backend
- route guards use `GET /me` and `GET /me/permissions`
- a hidden UI element is not an authorization control
- API client handles correlation IDs, RFC 9457 problem details, 401 reauthentication, 403 permission messaging, 409 conflicts, 422 field errors, 429 backoff, and safe retry rules
- never log tokens, bank data, document contents, DOB, SSN, credit details, or unmasked PII
- CSP, frame-ancestors, trusted origins, dependency controls, and production source-map policy are required

## 9. Analytics

Capture page and funnel events without sensitive financial or identity fields. Preserve:

- original and current referrer
- first-touch and last-touch attribution
- UTM source, medium, campaign, content, term
- GCLID and FBCLID
- page/landing-page ID, device, campaign, affiliate, call-tracking ID
- consent state

Analytics failures must never block form submission. Consent mode and privacy controls must be implemented. Backend reporting remains authoritative for leads, applications, offers, funding, revenue, and commissions.

## 10. Testing and delivery gates

Required CI:

- format, lint, typecheck
- unit/component tests
- accessibility tests
- API-schema compatibility tests against committed OpenAPI
- production builds for all four apps
- Playwright responsive journeys
- dependency and secret scanning

Minimum end-to-end fixtures:

1. Every landing route loads unique content and submits the shared form.
2. Attribution survives multi-step navigation and reaches the request payload.
3. Borrower creates/resumes/submits an application, uploads a document, connects mock bank data, and views/accepts a mock offer.
4. Lender sees only assigned/authorized applications, requests documents, and submits an offer.
5. Admin assigns a lead, reviews matching, retries a failed CRM event, and inspects its audit event.
6. Unauthorized cross-tenant and cross-role routes fail closed.
7. Network, 409, 422, and 429 paths provide accessible recovery.

Frontend completion means the four applications consume only documented APIs, pass these checks, contain no secrets or backend decision logic, and can execute the full V1 journey using mock/staging services.
