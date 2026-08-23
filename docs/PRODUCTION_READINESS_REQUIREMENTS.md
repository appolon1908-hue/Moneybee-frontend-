# MoneyBee Frontend Production Readiness Requirements

This document defines frontend screens and behavior required by the production-readiness specification. Backend authorization, state machines, requirements, financial decisions, compliance rules, and calculations remain authoritative.

## 1. Account and security experiences

All four applications use the canonical Keycloak issuer `https://auth.codestra.co/realms/codestra`.

Required UI flows:

- borrower enrollment from a backend-issued, single-use application link;
- lender and employee/admin invitation acceptance;
- login, MFA enrollment/challenge, password reset, and approved account recovery;
- security page with active sessions/devices, last activity, current-session marker, and remote revoke;
- forced reauthentication/step-up for sensitive actions;
- lockout, rate-limit, expired-link, revoked-session, and recovery messaging;
- logout that clears application caches and completes server/provider revocation.

Never expose recovery secrets or imply a hidden button grants authorization. Privileged lender and MoneyBee roles must not bypass MFA.

## 2. Lead, attribution, and duplicate review

Marketing continues to preserve source/page/referrer, first/last touch, UTM fields, GCLID, FBCLID, affiliate, call-tracking, and session identifiers without placing PII in analytics.

Admin lead pages add a Possible Duplicate queue and comparison:

- candidates and safe match reasons;
- side-by-side record history;
- merge preview with downstream impact;
- `Merge`, `Keep Separate`, and escalation actions;
- structured reason and confirmation;
- permission/step-up handling;
- resulting audit reference.

The frontend does not compute duplicate confidence or merge records locally.

## 3. Borrower application and progress

Progressive sections:

- business identity and formation;
- funding amount, purpose, product preference, desired timing;
- revenue, deposits, balances, debt/positions, expenses;
- required owners and tokenized identity collection;
- documents, bank connection, verification, consents/disclosures.

The requirements endpoint supplies authoritative completion, blockers, and next action. Vue renders those values and never marks application readiness itself.

Sensitive identifiers use approved hosted/tokenized collection. Read screens display masked values only. Editing high-risk identity/bank/address fields may require step-up authentication and clear downstream-review messaging.

## 4. Fraud and manual review

Borrowers receive neutral status/next-step messaging without vendor details or exploitable risk signals.

Authorized admin/risk users receive:

- fraud-review queue;
- risk level and versioned reason categories;
- evidence links governed by field permissions;
- related applications/accounts;
- request-information, clear, block, escalate, and override actions;
- structured reason, confirmation, and approval state;
- false-positive and final-outcome tracking.

The UI never independently produces a fraud score or uses protected characteristics.

## 5. Document center

Display the server-owned lifecycle:

```text
Upload authorized
Uploaded
Security scanning
Classification/extraction
Needs review
Approved
Rejected
Expired
```

Required UI:

- document requirements by category;
- constrained drag/drop and accessible file picker;
- upload progress/cancel/retry;
- quarantine/scanning status without unsafe preview;
- rejection reason and replacement flow;
- extracted-field review only for authorized users;
- document version/history and verified badge;
- short-lived authorized view/download;
- visible warning when access is audited.

Never trust extensions client-side, render active untrusted content, or mark uploads approved before backend confirmation.

## 6. Lender portal and submissions

Lender navigation includes dashboard, new/under-review applications, documents, conditions, offers, funded deals, programs, reporting, API/webhooks, users, and settings.

Actions:

- review only explicitly submitted applications;
- request documents/conditions;
- decline with approved structured reasons;
- create/update/withdraw offers;
- mark funding actions through backend-defined transitions;
- view submission status/history and safe delivery errors.

Submission states `QUEUED`, `SENT`, `RECEIVED`, `UNDER_REVIEW`, `CONDITIONS`, `OFFERED`, `DECLINED`, `FAILED`, and `WITHDRAWN` are displayed from the backend. Retry buttons require permission and idempotency.

## 7. Offer comparison and contracting

Offer comparison presents, side by side:

- lender/product;
- amount and term;
- payment amount/frequency;
- APR and/or factor rate where applicable;
- origination and other fees;
- total repayment;
- prepayment terms;
- guarantee/collateral;
- expiration and conditions;
- backend-provided jurisdiction/product disclosures.

Do not label an offer “recommended” unless the backend returns an approved transparent explanation.

Contract screens host the approved e-sign experience and show template/version, signer/order, current state, executed date, and final agreement access. Vue never generates or modifies the authoritative contract.

## 8. Funding and commission operations

Borrower timeline distinguishes:

```text
Offer accepted
Conditions pending/complete
Contract signed
Approved for funding
Funds sent
Funding confirmed
Funded
```

Do not display “Funded” based solely on offer acceptance.

Admin/finance views include funding reconciliation cases, matched/unmatched lender reports, variances, expected/received commission, outstanding balances, salesperson/affiliate splits, payment history, and audit references. Financial calculations and adjustments come from backend read models and commands.

## 9. Compliance and complaint operations

Admin/compliance screens:

- required disclosure and consent evidence;
- exact version/hash and acceptance metadata;
- adverse-action workflow, structured reasons, notice preview, approval, delivery, archive;
- restricted-data indicators and permission boundaries;
- retention/legal-hold status;
- complaint queue/detail.

Complaint UI stores category, priority, application/lender, assignee, SLA, state, communications, escalation, and resolution. States: `OPEN`, `INVESTIGATING`, `WAITING_ON_PARTNER`, `ESCALATED`, `RESOLVED`.

Broad admin navigation must not reveal restricted compliance fields without the explicit permission returned by the backend.

## 10. Renewals and affiliates

Borrower renewal experience:

- eligible/not-yet-eligible state;
- data that must be refreshed;
- fresh disclosure/consent requirements;
- clear creation of a linked new/refreshed application;
- communication preferences and opt-out.

No automatic credit pull, bank refresh, lender submission, or marketing send is initiated by Vue.

Admin affiliate views manage partner status, approved campaigns/creative, lead/application/funding linkage, payout/reconciliation, conversion, fraud, and complaint rates. Affiliates cannot access borrower data except through an explicitly authorized partner scope.

## 11. Dashboards

Implement permissioned, server-defined dashboards:

- Marketing: leads, CPL, applications, offers, funded, cost/funded deal, volume, revenue, ROAS.
- Sales: leads/contacts, application starts/completions, offers, funding, representative conversion.
- Lender: submissions, offer/approval rates, funded volume, average deal, turnaround.
- Finance: funded amount, expected/received/outstanding commission, revenue by lender/product/representative/source/page/affiliate.

Every view displays active filters, currency/timezone, data-through timestamp, and metric definitions/tooltips. Never calculate authoritative funnel/funding/commission values from partial browser data.

## 12. Frontend production gates

Release is blocked until evidence confirms:

- MFA, recovery, session/device and step-up flows;
- route/field permission and cross-tenant tests;
- masked PII and no sensitive analytics/logging;
- duplicate, fraud-review, document, compliance, complaint, funding, and commission flows;
- all state labels driven by backend responses;
- accessible error/recovery/confirmation handling;
- CSP, dependency/secret checks, production source-map policy;
- responsive keyboard/screen-reader journeys;
- contract compatibility with the pinned OpenAPI artifact;
- complete synthetic borrower, lender, admin, and finance journeys in staging.

A visually complete page without authorized APIs, negative-path tests, and accessible recovery does not satisfy a production gate.
