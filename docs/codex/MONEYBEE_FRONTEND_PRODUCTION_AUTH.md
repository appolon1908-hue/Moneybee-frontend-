# MoneyBee Frontend Production Authentication
## Codex Implementation Specification

Global production-hardening step: 1 of 12

First work package:

frontend/keycloak-pkce

---

# 1. Identity Provider

Authority:

https://auth.codestra.co/realms/codestra

Use:

OIDC Authorization Code + PKCE

Do not use:

password grant
implicit flow
debug-role headers
browser-stored client secret

---

# 2. Implement shared auth package

packages/auth/

Required:

AuthProvider

login()

logout()

handleCallback()

getAccessToken()

refreshSession()

getUser()

hasRole()

hasPermission()

isAuthenticated()

sessionExpired()

---

# 3. Token handling

Use OIDC library appropriate for Vue/browser PKCE.

Do not store refresh/access tokens in localStorage unless explicitly justified.

Prefer session-oriented secure library-managed browser storage.

Do not log tokens.

---

# 4. Required routes

Each authenticated app gets:

/auth/login

/auth/callback

/auth/logout

/auth/session-expired

/403

---

# 5. Router guards

Borrower:

requires authenticated borrower/local membership

Lender:

requires lender membership

Admin:

requires staff permission

Frontend guard is UX only.

Backend remains authoritative.

---

# 6. Capability guards

Use existing capability API.

A disabled capability may:

hide action

disable control

show status

But frontend must never assume hiding is security.

---

# 7. API client

For every request:

Authorization: Bearer <token>

X-Request-ID

X-Correlation-ID

On:

401
→ refresh/re-authentication behavior

403
→ access denied UI

409
→ concurrency conflict UI

428
→ reload resource/version

429
→ retry guidance

5xx
→ recoverable error component

---

# 8. Session behavior

Implement:

login redirect

callback validation

silent/refresh behavior supported by provider/library

logout

expired session

browser refresh

deep-link restore

multiple tabs

revoked session behavior

---

# 9. If-Match support

API resource wrappers must expose ETag/version.

Protected mutable calls send:

If-Match

On stale resource:

show:

"This record changed. Reload before continuing."

Never silently overwrite.

---

# 10. Idempotency support

Generate stable command key for one logical submit.

Do not generate a new key every time an HTTP retry occurs.

Applies to:

offer accept

lender submission admin operations

contract send

funding actions

integration retry/replay

---

# 11. Document UX

Implement:

request upload session

direct object upload

completion call

scan status

quarantine state

retry where allowed

controlled download

Do not consider upload successful until backend completion succeeds.

Display:

Uploading
Scanning
Clean
Review Required
Quarantined
Rejected

---

# 12. Admin operations

Add/complete:

/admin/integrations/outbox

/admin/integrations/inbox

/admin/integrations/dead-letter

/admin/operational-exceptions

/admin/documents/quarantine

/admin/documents/review

/admin/system/readiness

Recovery actions require explicit confirmation and reason.

Do not expose raw secrets.

---

# 13. Funding UI

Funding operations UI must show:

current version

current status

approved by

sent by

confirmed by

reconciliation status

Admin UI must not allow same operator to perform prohibited dual-control steps.

Backend remains authoritative.

---

# 14. Required E2E

Login

logout

session expiration

borrower tenant isolation

lender organization isolation

admin permission denial

403 screen

401 recovery

concurrent offer acceptance

document upload → scan → clean

quarantined document blocked

contract send flow

funding dual-control flow

integration retry permission

---

# FINAL REPORT

FINAL_STATUS

SOURCE_SHA

KEYCLOAK_PKCE_STATUS

LOGIN_STATUS

LOGOUT_STATUS

SESSION_STATUS

ROLE_GUARDS

CAPABILITY_GUARDS

401_STATUS

403_STATUS

409_STATUS

428_STATUS

DOCUMENT_UI_STATUS

OPERATIONS_UI_STATUS

FUNDING_UI_STATUS

E2E_STATUS

BLOCKERS

NEXT_SAFE_ACTION
