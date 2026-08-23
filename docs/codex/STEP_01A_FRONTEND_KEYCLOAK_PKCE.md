# Step 1A — Frontend Keycloak PKCE

Work package:

frontend/keycloak-pkce

Repository:

Moneybee-frontend-

## Identity Provider

Authority:

https://auth.codestra.co/realms/codestra

Flow:

OIDC Authorization Code + PKCE

Do not use:

password grant
implicit flow
client secret in browser
production debug-role headers

## Shared Package

Create/update:

packages/auth/

Required responsibilities:

login
logout
callback
session
access token
claims
role helpers
permission helpers
session expiry
auth errors

## Routes

/auth/login

/auth/callback

/auth/logout

/auth/session-expired

/403

## Protect

Borrower app

Lender app

Admin app

Marketing remains public.

## API Client

Wire existing token-provider mechanism to the auth package.

Send:

Authorization: Bearer <token>

X-Request-ID

X-Correlation-ID

Add:

ETag parsing

If-Match support

stable MoneyBee error parsing

## HTTP Behavior

401:

recover valid session if possible
otherwise reauthenticate

403:

show access denied

409 CONCURRENT_MODIFICATION:

show stale-resource warning and reload option

428 PRECONDITION_REQUIRED:

reload resource/version

429:

respect retry guidance

5xx:

recoverable error component

## Security

Frontend route guards improve UX only.

Backend authorization is authoritative.

Do not store:

service credentials
client secret
provider secrets

Do not log access tokens.

## Required E2E

login

logout

callback

session expiration

page refresh

deep link

borrower route guard

lender route guard

admin route guard

401 recovery

403 screen

409 handling

428 handling

429 handling

## Completion Evidence

WORK_PACKAGE=frontend/keycloak-pkce

SOURCE_SHA=

KEYCLOAK_PKCE=

LOGIN=

LOGOUT=

SESSION=

ROUTE_GUARDS=

TOKEN_PROVIDER=

401_STATUS=

403_STATUS=

409_STATUS=

428_STATUS=

429_STATUS=

E2E_STATUS=

LIVE_CAPABILITIES_ENABLED=NONE

OVERALL_SYSTEM_STATUS=PARTIAL

