# MoneyBee system review — architecture, code, API, security

Mission: full-system review across `moneybee-frontend-` and `moneybee-backend`
to identify the concrete gaps between the current codebase and a "top tier"
production fintech system. This is an assessment only; it makes no code
changes and grants no deployment authority.

Companion document: `moneybee-backend/docs/codex/SYSTEM_REVIEW_2026-08-28.md`
(backend-specific findings; §5-6 below are shared with that document).

Method: direct reading of `apps/*/src`, `packages/*/src`, `nginx*.conf`,
`deploy/`, `.github/workflows/`, and the backend's `openapi.json` /
`docs/API_CONTRACT.md` for cross-checking.

## Overall assessment

The frontend monorepo (pnpm workspaces, Vue 3 + Vite + TypeScript across
`apps/admin`, `apps/borrower`, `apps/lender`, `apps/marketing`, shared via
`packages/{api-client,auth,feature-access,ui}`) has real engineering
discipline in the places that matter most for a fintech SPA: `strict: true`
TypeScript with **zero** `any` in non-test code, a correct OIDC
Authorization-Code-with-PKCE implementation, and version-locked shared
dependencies across all four apps. The gaps are concentrated in shared UI
componentry, test coverage for the actual portal apps, and edge-level
security headers.

## 1. Monorepo & app structure

- **Framework/dependency versions are identical across all four apps**
  (`vue ^3.5.18`, `vue-router ^4.5.1`, `pinia ^3.0.3` in every
  `apps/*/package.json`) — no drift, which is easy to get wrong in a
  multi-app workspace and here isn't.
- **`packages/ui` is effectively empty**: it contains exactly one file,
  `styles.css` — there is no shared component library. With four apps that
  each need forms, buttons, tables, and status/badge components for the
  same underlying domain objects (applications, offers, conditions), the
  likely outcome is four independent implementations of the same widgets,
  which is both wasted effort and a source of UX drift between portals.
  **Medium-High** for a system aiming to be "top tier" — this is the
  highest-leverage frontend investment available: even a small shared set
  (Button, Input, Table, StatusBadge, Card, form field wrapper) pays for
  itself across four apps immediately.
- **`packages/feature-access` is a 14-line capability-flag reader**
  (`isFeatureAvailable`/`loadFeatureCapabilities` against the backend's
  `/me/capabilities`) — correctly thin and correctly server-driven (see
  §6), nothing to flag.
- Root `package.json` wires `typecheck`, `test` (vitest), and
  `contracts:check` (see §6) as workspace-level scripts — good baseline for
  CI to hook into.

## 2. API client & auth packages

- **`packages/api-client/src`** is organized by backend domain
  (`admin.ts`, `borrower.ts`, `lender.ts`, `finance.ts`, `banking.ts`,
  `plaid.ts`, `portal.ts`, `public.ts`), plus a `core.ts` for the shared
  fetch wrapper and explicit `legacy-admin.ts`/`legacy-portal.ts` modules —
  the "legacy" naming here is a good sign: it means old and new API
  surfaces are kept visibly distinct in the client rather than silently
  merged, which will make it obvious when it's safe to delete them.
- **Auth uses `oidc-client-ts` with Authorization Code + PKCE correctly**
  (`packages/auth/src/auth-manager.ts:80-98`): `response_type: "code"`,
  `automaticSilentRenew: true`, `monitorSession: true`, and — notably — the
  OIDC authority is hard-checked against the literal string
  `https://auth.codestra.co/realms/codestra` at runtime
  (`auth-manager.ts:54-56`), which prevents a misconfigured build from
  silently pointing at the wrong identity provider.
- **Tokens are stored in `sessionStorage` via `WebStorageStateStore`**
  (`auth-manager.ts:84`), not `localStorage` — the better of the two
  browser-storage choices (cleared on tab close, not shared across tabs),
  though still readable by any script that executes in-page, which is why
  the CSP gap in §4 matters specifically here: this app's primary token-
  theft threat model is XSS, and there is currently no CSP mitigating it.
- Route guards resolve the principal from the **backend**, not from
  locally-decoded token claims (`packages/auth/src/auth.test.ts:178`,
  "guards routes with backend-resolved principal instead of pre-reading
  token state") — this is the right call: it means a revoked/stale local
  token state can't grant UI access the backend would actually reject.

## 3. Testing

- Only **3 of 8** packages/apps have any test files at all:
  `packages/api-client` (3 files), `packages/auth` (3 files), and
  `apps/marketing` (1 file). **`apps/admin`, `apps/borrower`, `apps/lender`
  — the three apps that actually handle loan applications, funding
  decisions, and lender submissions — have zero test files.**
  `packages/feature-access` and `packages/ui` also have none, though both
  are currently small enough that this matters less than the three portal
  apps. **High** — the portal apps are where the business logic (form
  flows, conditional fields, status transitions) actually lives; right now
  regressions there are caught only by manual QA or by the OpenAPI
  contract check (which validates shapes, not behavior).
- Where tests do exist, they're meaningful rather than superficial —
  `auth.test.ts` explicitly tests the backend-resolved-principal guard
  behavior described in §2, not just "does it render."

## 4. Build, deploy & security headers

- **No Content-Security-Policy anywhere in the delivery chain.**
  `nginx.conf` (the per-app site config baked into every app's Docker
  image) sets `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, and `Permissions-Policy` — good baseline — but no
  `Content-Security-Policy`. The production edge (`deploy/Caddyfile.moneybee`,
  which fronts all four domains plus the API) adds no headers at all,
  only `reverse_proxy`. Since bearer tokens live in `sessionStorage` (§2),
  CSP is the primary defense-in-depth control against token exfiltration
  via XSS, and it's currently absent end-to-end. **High.**
- **No HSTS on the frontend production edge.** The *backend's*
  `deploy/Caddyfile.staging` sets
  `Strict-Transport-Security: max-age=31536000; includeSubDomains`, but
  `deploy/Caddyfile.moneybee` (this repo's production edge, covering
  `moneybeeloan.com`, `app.`, `lenders.`, `admin.`) sets no headers at all.
  Caddy auto-provisions TLS but does not add HSTS unless told to.
  **Medium-High** — add HSTS at minimum to the apex/marketing site (it
  controls the redirect surface for the other subdomains) and ideally to
  all five host blocks.
- Static assets are cached `immutable` for 7 days while `index.html` is
  `Cache-Control: no-store` (`nginx.conf`) — the correct pattern for a
  Vite-hashed-asset SPA; no stale-build risk from over-caching the shell.
- `VITE_`-prefixed env vars are build-time-baked per Vite convention;
  spot-checked `.env.example`/`.env.production.example` and found nothing
  that looks like a server-only secret exposed under a `VITE_` prefix — the
  client only carries public OIDC client IDs, the API base URL, and feature
  flags, which is correct (a `VITE_*` secret would ship in the compiled
  bundle for anyone to read).

## 5-6. Cross-cutting: contract alignment, auth end-to-end, shared security posture

*(Shared with `moneybee-backend/docs/codex/SYSTEM_REVIEW_2026-08-28.md`.)*

- **Contract checking is real and two-sided.** `scripts/check-api-contracts.mjs`
  (wired to `pnpm contracts:check`) exists specifically to validate this
  repo's API client against the backend's published contract, and the
  backend independently runs `scripts/verify_openapi_contract.py` in its
  own CI against the same `openapi.json`/manifest files
  (`docs/openapi/{account-lifecycle,admin-workspace,lender-frontend-compat,
  provider-webhook-aliases,public-intake}-manifest.json`). Confirm both
  jobs are in the *required* status checks for their respective default
  branches (not just present) — a contract check that can be merged around
  provides false confidence.
- **OIDC realm/client configuration is consistent across repos**: the
  backend's `borrower/lender/admin_oidc_client_ids_csv` settings and this
  repo's `deploy/OIDC_CLIENTS.md` describe the same three-client,
  same-realm (`auth.codestra.co/realms/codestra`) setup, and the backend
  additionally *enforces at startup* that the three client-ID sets are
  disjoint (`app/config.py`'s `secure_environment` validator) — so even if
  this repo's build config drifted, the backend would refuse to conflate
  two portals' tokens. That backend-side enforcement is what makes the
  frontend's route-guard-based portal separation safe to rely on rather
  than a purely cosmetic UX affordance.
- **CORS is an explicit allowlist matching this repo's real domains**:
  backend's `.env.production.example` lists exactly
  `moneybeeloan.com, www., app., lenders., admin.` — the same five hosts
  `deploy/Caddyfile.moneybee` routes. No wildcard, no drift found.
- **Recommendation**: given tokens live in browser storage on this side and
  CSP/HSTS are absent (§4), and the backend already applies
  `X-Content-Type-Options`/`Referrer-Policy` at the app layer
  (`moneybee-backend/app/main.py:67-74`) — treat closing the CSP/HSTS gap
  as the single highest-leverage *cross-repo* security fix: it's a frontend
  deploy-config change, but it's mitigating a backend-issued bearer token.

## Top recommendations, in priority order

1. **Add a Content-Security-Policy** at the edge (`Caddyfile.moneybee`) or
   per-app (`nginx.conf`) — this is the top XSS/token-theft mitigation
   currently missing.
2. **Add HSTS to the production edge** (`deploy/Caddyfile.moneybee`) to
   match what the backend staging edge already does.
3. **Write tests for `apps/admin`, `apps/borrower`, `apps/lender`** —
   currently zero coverage on the three apps carrying the actual business
   logic; start with the form/status-transition flows, not just smoke tests.
4. **Build out `packages/ui`** into a real shared component set — one file
   of global CSS is not a design system for four apps sharing one domain
   model.
5. **Confirm `contracts:check` (frontend) and `verify_openapi_contract.py`
   (backend) are required CI checks**, not merely present workflows.

None of these are blockers to what's already shipped — they're the specific
list to close the gap between "solid, well-typed frontend" and "top tier."
