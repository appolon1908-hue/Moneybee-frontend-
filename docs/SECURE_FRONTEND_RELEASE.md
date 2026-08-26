# Secure frontend image ownership

This repository exclusively builds and publishes:

```text
ghcr.io/appolon1908-hue/moneybee-marketing
ghcr.io/appolon1908-hue/moneybee-borrower
ghcr.io/appolon1908-hue/moneybee-lender
ghcr.io/appolon1908-hue/moneybee-admin
```

The backend repository must never use a sibling frontend checkout or a frontend `build:` context. At runtime it may combine this repository's exact-SHA `deploy/compose.frontend.yml` with the backend-owned Compose fragment after checking its SHA-256.

## Required repository variables

```text
NODE_BASE_IMAGE=node@sha256:<reviewed digest>
NGINX_BASE_IMAGE=nginx@sha256:<reviewed digest>
MARKETING_OIDC_CLIENT_ID=<public client or blank when not used>
BORROWER_OIDC_CLIENT_ID=<public Keycloak client>
LENDER_OIDC_CLIENT_ID=<public Keycloak client>
ADMIN_OIDC_CLIENT_ID=<public Keycloak client>
VITE_GOOGLE_LOGIN_ENABLED=true
VITE_GOOGLE_IDP_ALIAS=google
```

The Google OAuth client secret remains only in Keycloak or its approved secret store. It is never a frontend variable.

The release workflow builds from an exact protected SHA, pushes only SHA-addressed images, creates SBOM and provenance attestations, scans the published digest, signs it keylessly with GitHub OIDC, verifies the workflow identity, and records release evidence. It does not contact `49.12.145.107`.
