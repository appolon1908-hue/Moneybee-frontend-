# MoneyBee Frontend SDK Boundary

Frontend applications may use only the MoneyBee API client and approved Keycloak/OIDC browser authentication. They must not contain or directly use Plaid secrets, KYB/credit/lender provider secrets, DocuSign secrets, SendGrid/Twilio secrets, Stripe/PayPal secrets, S3 credentials, Odoo credentials, database credentials, OpenBao tokens, or any provider master key.

Canonical browser path: MoneyBee frontend -> MoneyBee API -> reviewed Codestra SDK/server connectors -> approved downstream services.

Required production controls: Authorization Code + PKCE or approved BFF/session architecture, protected routes, session expiry, multi-tab logout, CSRF protection where cookie sessions are used, request timeouts/cancellation, offline mutation blocking, typed error handling, no provider-secret storage, production CSP/CORS alignment, staging E2E, and production read-only smoke.
