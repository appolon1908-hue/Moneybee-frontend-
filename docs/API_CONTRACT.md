# Frontend contract

The frontend talks only to `https://api.moneybeeloans.com/api/v1` and authenticates only through `https://auth.codestra.co/realms/codestra` using Authorization Code + PKCE.

Implemented calls:
- Public: `POST /leads` only.
- Authenticated: `POST /applications` with `Idempotency-Key` and consent version evidence.
- Authenticated: `GET /me`, `GET /applications/{id}`, `POST /applications/{id}/submit`.
- Operations/admin: `GET /applications`.

No lender rules, approval logic, secrets, CRM calls, provider credentials, regulated-data pulls, or financial execution are embedded in the browser.
