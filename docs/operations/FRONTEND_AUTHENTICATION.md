# Frontend Authentication Operations

## Purpose

The borrower, lender, and administrator portals use OIDC Authorization Code with PKCE against `https://auth.codestra.co/realms/codestra`. Marketing remains public. The backend remains authoritative for local identity, membership, permissions, and record access.

## Required configuration

Each deployed portal requires:

```text
VITE_API_BASE_URL
VITE_OIDC_AUTHORITY=https://auth.codestra.co/realms/codestra
VITE_OIDC_CLIENT_ID=moneybee-web
VITE_OIDC_AUDIENCE=moneybee-api
```

The Keycloak client must be public, require PKCE S256, and allow only each portal's exact
`/auth/callback`, `/auth/silent-callback`, and post-logout URI. No client secret or service-account
credential belongs in a browser bundle.

## Normal operation

Unauthenticated portal navigation redirects to `/auth/login`, which redirects to Keycloak. `/auth/callback` completes the code exchange. The portal then calls `/api/v2/me` and fails closed unless MoneyBee returns an active local user with the required membership and permission.

Tokens are managed by `oidc-client-ts` using browser session storage. Tokens must never be logged or written to local storage. A 401 triggers one silent recovery attempt; failure routes to `/auth/session-expired`. A 403 routes to `/403`.

Users with multiple active organization memberships must select an organization. The selected UUID
is stored only in session storage and sent as `X-Organization-ID`; it requests a tenant but never
grants tenant access. The backend validates the membership on every request.

## Health and monitoring

Monitor:

- login redirect and callback success rate;
- `/api/v2/me` 401 and 403 rates;
- token refresh failures;
- callback loops and invalid-state errors;
- Keycloak discovery/JWKS availability.

Do not include authorization codes, tokens, cookies, or raw claims in logs.

## Failure modes and recovery

- **Keycloak unavailable:** keep portal protected and display session/login failure. Do not introduce a bypass.
- **Identity not bound:** provision the user through the approved backend identity process; do not trust email or browser roles.
- **Wrong membership/permission:** verify the local MoneyBee membership and role binding.
- **Callback URI mismatch:** correct the Keycloak client allowlist and redeploy the exact reviewed frontend image.
- **Repeated 401:** remove the local browser session and require a new login.

Operators must not edit browser storage or the production database as normal recovery.

## Rollback

Rollback to the previous immutable frontend images. The change has no database migration. Rolling back removes portal login enforcement and therefore is not an acceptable production emergency bypass; production must remain unavailable until a protected version is restored.

## Ownership

Identity/security owns Keycloak configuration. MoneyBee application owners own portal guards and `/api/v2/me` compatibility. Recovery requires identity administration or deployment permissions; it never enables lending, e-sign, funding, payment, or payout capabilities.
