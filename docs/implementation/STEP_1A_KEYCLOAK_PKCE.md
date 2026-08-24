# Step 1A — Frontend Keycloak PKCE

Status: PLANNED / BLOCKED_ON_STEP0_MERGE
Branch (after Step-0 approval/merge): `frontend/keycloak-pkce`

## Hard gate

Do not create or implement this branch until the Step-0 frontend PR is approved and merged to `main`.

Do not start command context or any financial workflow from this work package.

## Authentication model

- Keycloak OIDC Authorization Code flow
- PKCE `S256`
- SPA client is public; never place a client secret in `VITE_*`
- no implicit flow
- no direct access grants
- no wildcard redirect URIs or wildcard web origins in staging/production
- bearer tokens remain in Keycloak runtime memory; application code must not persist them to localStorage or sessionStorage
- token refresh uses Keycloak `updateToken(...)`

## Required frontend structure

Implement within the existing Vue workspace using the shared auth/API packages and each protected portal shell:

- auth runtime (`keycloak.ts`)
- Pinia auth store
- auth/session types
- permission helpers
- authenticated API client
- route guards
- login page
- organization selector
- unauthorized page

## Active organization

The browser may persist only the selected organization identifier in session storage.

Send the selection as:

`X-MoneyBee-Organization: <organization-id>`

This header is selection only. It is never authorization. The backend must independently prove active membership and permissions.

## Required backend-facing endpoints

The frontend may consume, but must not implement the authority behind:

- `GET /api/v2/auth/me`
- `GET /api/v2/auth/context`

## UI authorization rule

Frontend role/permission checks exist only for navigation and presentation. They must never be relied on to authorize a resource, approve a lending action, determine financial state, or enable a live capability.

## Mandatory tests

- unauthenticated protected route -> `/login`
- authenticated user with one organization -> organization auto-selected
- multiple organizations -> `/select-organization`
- selection sends `X-MoneyBee-Organization`
- `401 IDENTITY_NOT_BOUND` -> access denied; no auto-provisioning
- inactive membership -> unauthorized
- missing permission -> protected UI inaccessible
- token expiration -> refresh attempted
- logout clears selected organization
- access token is never written to localStorage/sessionStorage

## Acceptance evidence

```text
BRANCH=frontend/keycloak-pkce
AUTH_CODE_FLOW=PASS
PKCE_S256=PASS
TOKEN_REFRESH=PASS
TOKEN_BROWSER_STORAGE=NONE
ROUTE_AUTH=PASS
ORGANIZATION_SELECTION=PASS
FRONTEND_TESTS=PASS
E2E_AUTH=PASS
LIVE_CAPABILITIES_ENABLED=NONE
PRODUCTION_DEPLOYED=NO
```

## Production configuration rule

Local development values may use localhost. Staging and production must use the repository-approved Keycloak authority/client configuration with explicit redirect URIs and explicit web origins. No wildcard origins and no browser client secret.

## Completion gate

Step 2 may not begin until Step 1A and Step 1B are both merged and integration evidence shows:

- `AUTH_E2E=PASS`
- `LOCAL_IDENTITY=PASS`
- `TENANT_ISOLATION=PASS`
- `AUTHORIZATION=PASS`

Live financial capabilities remain disabled.