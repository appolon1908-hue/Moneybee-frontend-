# Repository Profile — `Moneybee-frontend-`

## Identity

- **Repository:** `appolon1908-hue/Moneybee-frontend-`
- **Category:** Product frontend — business funding
- **Visibility:** `public`
- **Default branch:** `main`
- **Authority:** Primary MoneyBee frontend authority
- **Status:** Vue 3 and TypeScript monorepo for marketing, borrower, lender, and operations experiences.

## Purpose

Delivers the MoneyBeeLoans public website and portals for business-funding discovery, application intake, borrower servicing, lender workflows, and administration.

## Owns

- Marketing website and landing pages
- Borrower, lender, and administration portals
- Shared design system, typed API client, forms, validation, analytics capture, and accessibility patterns

## Does not own

- Underwriting, approval, eligibility, matching, status, or offer-ranking authority
- Authoritative financial calculations
- Direct CRM, lender, credit, payment, or provider calls

## Key integrations

- `Moneybee-Backend` API v2
- Keycloak Authorization Code + PKCE
- Same-origin form/API boundary
- Approved analytics and communications contracts

## Current priorities

1. Complete typed API and capability integration
2. Build safe application, document, offer, and servicing workflows
3. Prove mobile, accessibility, session-expiration, and error states
4. Keep all financial actions backend-authoritative and capability-gated

## Governance and safety

- Promotion model: `feature/docs/fix/security/upgrade -> development -> test -> staging -> production -> main`.
- Use pull requests with exact-head and merge-result validation; source merge never authorizes deployment.
- Never place secrets, provider credentials, authoritative financial logic, or customer records in browser configuration.
- Production assets must be immutable and live actions require separate approval.
- This document does not activate credit, lender, e-sign, funding, payment, or production workflows.

## Account-wide catalog

See `appolon1908-hue/documentaions/REPOSITORY_CATALOG.md`.
