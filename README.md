# MoneyBee Frontend

Separate Vue frontend workspace for MoneyBeeLoans.

Applications:

- marketing
- borrower
- lender
- admin

## Current status

PARTIAL

Step 0 provides only the frontend production foundation.

Authenticated portals are intentionally NOT considered production-authenticated yet.

Next PR: `frontend/keycloak-pkce`

Canonical Keycloak authority: `https://auth.codestra.co/realms/codestra`

## Install

```bash
corepack enable
pnpm install
```

Commit `pnpm-lock.yaml`.

## Development

```bash
pnpm dev:marketing
pnpm dev:borrower
pnpm dev:lender
pnpm dev:admin
```

## Checks

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Capability freeze

No financial capability is activated from this repository.
