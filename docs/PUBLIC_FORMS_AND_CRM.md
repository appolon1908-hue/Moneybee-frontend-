# Public forms and controlled CRM delivery

The marketing application sends public forms only to the canonical MoneyBee `/api/v2` API. It never calls Codestra, Odoo, n8n, a lender, or a provider directly.

## Public forms

- business-funding prequalification;
- contact request;
- callback request;
- lender/bank partner inquiry;
- broker/referral partner application;
- controlled deal-submission inquiry.

Each mutation includes an idempotency key, versioned consent evidence, attribution, request/correlation IDs, accessible error handling, and a MoneyBee reference on acceptance.

## Delivery boundary

```text
browser -> MoneyBee API -> authoritative transaction + outbox
        -> Codestra middleware -> Odoo CRM projection
        -> signed receipt -> MoneyBee inbox
```

The initial staging release keeps external delivery disabled. Forms may create MoneyBee records and pending outbox entries, but no external worker may send them until the middleware runtime, DNS/TLS, Keycloak service account, HMAC keys, durable inbox, Odoo sandbox bridge, replay/collision handling, and rollback have been verified.

## Authentication

Email and Google sign-in both terminate at Keycloak. Google uses Keycloak identity brokering; no Google client secret is present in frontend code or images. Backend local identity, membership, permissions, tenant scope, and ownership remain authoritative.
