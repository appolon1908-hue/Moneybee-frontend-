# Keycloak Google sign-in for MoneyBee

MoneyBee browser applications continue to use the canonical authority:

```text
https://auth.codestra.co/realms/codestra
```

Google is configured as a Keycloak identity provider with alias `google`. The browser receives no Google client secret. The portal starts the normal Authorization Code + PKCE flow with `kc_idp_hint=google`; Keycloak performs Google authentication and issues the same MoneyBee audience token used for email sign-in.

## Required Keycloak and Google administration

Before staging validation:

1. Create a Google OAuth web client for the Keycloak broker callback URL displayed in the Keycloak identity-provider configuration.
2. Store the Google client ID and secret only in Keycloak or its external secret store.
3. Add and enable the Google identity provider in realm `codestra` with alias `google`.
4. Review the first-login flow, verified-email policy, account linking, and duplicate-email behavior.
5. Configure exact redirect URIs, post-logout URIs, and web origins for the borrower, lender, and administrator staging hosts.
6. Keep MoneyBee authorization bound to the local `issuer + subject` identity. Google email is profile information, not authorization.
7. Run login, callback, refresh, logout, account-linking, disabled-user, wrong-role, wrong-tenant, and inactive-membership tests.

## Frontend variables

```text
VITE_OIDC_AUTHORITY=https://auth.codestra.co/realms/codestra
VITE_GOOGLE_LOGIN_ENABLED=true
VITE_GOOGLE_IDP_ALIAS=google
```

Each portal also requires its own `VITE_OIDC_CLIENT_ID` and reviewed redirect allowlist.

## Security boundary

- The browser uses Authorization Code + PKCE S256.
- The Google client secret is never included in frontend source, environment variables, images, or browser storage.
- Keycloak brokers Google identity and issues the MoneyBee token.
- The MoneyBee backend validates issuer, audience, signature, local user binding, membership, permissions, tenant scope, and resource ownership.
- Frontend route guards do not replace backend authorization.

Google sign-in is not considered live until the Google OAuth client and Keycloak provider are configured and tested in staging.
