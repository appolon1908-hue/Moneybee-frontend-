# MoneyBee production OIDC clients

The MoneyBee portals use Codestra Keycloak at:

`https://auth.codestra.co/realms/codestra`

Canonical MoneyBee runtime domain: `moneybeeloan.com`.

Forbidden runtime/redirect domains:

- `moneybeeloans.com`
- `moneybee.loan`

Do not create or use `auth.moneybeeloan.com`.

## Borrower

- Public PKCE client: `moneybee-borrower`
- Origin: `https://app.moneybeeloan.com`
- Login callback: `https://app.moneybeeloan.com/auth/callback`
- Silent callback: `https://app.moneybeeloan.com/auth/silent-callback`
- Post logout: `https://app.moneybeeloan.com/auth/login`
- Web origin: `https://app.moneybeeloan.com`

## Lender

- Public PKCE client: `moneybee-lender`
- Origin: `https://lenders.moneybeeloan.com`
- Login callback: `https://lenders.moneybeeloan.com/auth/callback`
- Silent callback: `https://lenders.moneybeeloan.com/auth/silent-callback`
- Post logout: `https://lenders.moneybeeloan.com/auth/login`
- Web origin: `https://lenders.moneybeeloan.com`

## Admin

- Public PKCE client: `moneybee-admin`
- Origin: `https://admin.moneybeeloan.com`
- Login callback: `https://admin.moneybeeloan.com/auth/callback`
- Silent callback: `https://admin.moneybeeloan.com/auth/silent-callback`
- Post logout: `https://admin.moneybeeloan.com/auth/login`
- Web origin: `https://admin.moneybeeloan.com`

All clients must use Authorization Code flow with PKCE S256. Implicit flow, Direct Access Grants, Service Accounts, wildcard redirects, and client-secret-dependent browser authentication are prohibited.

The matching Keycloak GitOps contract is maintained in the `appolon1908-hue/Keycloak` repository at `config/identity/moneybee-oidc-clients.json`.
