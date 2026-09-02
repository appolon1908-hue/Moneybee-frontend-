# Horizon portfolio-shell adoption

## Authority

- Horizon repository: `appolon1908-hue/SDK-repository`
- Foundation PR: `#73`
- Foundation exact head: `7db4c6549a0a007922355090f03c082a308f3855`
- Adoption branch: `feature/horizon-portfolio-shell-v1`
- Product theme: `moneybee`
- Runtime activation: **not included**

## Canonical domains

| Role | Domain |
|---|---|
| Public marketing | `https://moneybeeloan.com` |
| Borrower portal | `https://app.moneybeeloan.com` |
| Lender portal | `https://lenders.moneybeeloan.com` |
| Administration | `https://admin.moneybeeloan.com` |
| Public API | `https://api.moneybeeloan.com` |
| Shared identity | `https://auth.codestra.co` |
| Corporate authority | `https://codestra.co` |

These roles come from the repository's production environment contract. The public, borrower, lender, administration, API and identity hosts are not interchangeable.

## Scope

The local `@moneybee/ui` package is the monorepo presentation authority for all four applications. This branch:

- aligns canvas, typography, spacing, borders, controls, cards, tables, forms and page states with Horizon
- applies the same MoneyBee/domain identity to marketing, borrower, lender and admin surfaces
- adds one shared public footer with funding, resource, trust and Codestra product-network links
- adds compact portal headers and footers without replacing role or tenant controls
- adds canonical and noindex metadata appropriate to each application
- preserves existing secure inquiry, callback, prequalification, application, offer, finance, underwriting, CRM, integration and audit flows

## Safety

This branch does not:

- guarantee funding, approval, pricing or terms
- change lender matching, underwriting, offer, payment or disbursement logic
- change public-form payloads, idempotency, CRM delivery, authorization, organization selection or OIDC
- expose API or identity hosts as marketing applications
- change DNS, deployment, credentials, providers or production runtime

## Validation

```bash
pnpm install --frozen-lockfile
pnpm contracts:check
pnpm typecheck
pnpm test
pnpm build
pnpm e2e:launch
```

Representative visual and accessibility checks must cover marketing landing pages, public inquiry forms, prequalification, cookie consent, borrower application pages, lender programs, admin operations, tables, mobile navigation and error/degraded states.
