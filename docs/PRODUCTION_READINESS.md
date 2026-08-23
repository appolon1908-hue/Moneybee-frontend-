# Frontend production readiness gate

Before production launch:
1. Register the production `moneybee-web` Keycloak public client with exact redirect/logout origins and PKCE S256.
2. Pin dependency lockfile and verify SCA/license policy in CI.
3. Add automated unit, component, accessibility and end-to-end tests for application, authentication, portal, lender and operations flows.
4. Add production error reporting and privacy-safe analytics with consent controls.
5. Review CSP against the final domains and remove every unnecessary origin.
6. Validate all legal disclosures, privacy notices, consent copy, accessibility and jurisdiction-specific content.
7. Run browser/device performance and security tests against staging behind the production ingress path.
