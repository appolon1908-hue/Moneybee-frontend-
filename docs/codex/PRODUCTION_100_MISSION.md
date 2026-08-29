# MoneyBee → 100% production mission (frontend)

Mission: `MB-100-PERCENT-PRODUCTION`. Frontend half of the tracked plan to
go from "reviewed and well-governed" (see
`docs/codex/SYSTEM_REVIEW_2026-08-28.md`) to spec-complete and
production-ready. Living checklist, updated pass by pass; each pass is
committed, pushed to PR #24, and reported.

Companion: `moneybee-backend/docs/codex/PRODUCTION_100_MISSION.md`
(backend checklist; Phase 0 and Phase 5 below are shared and kept
identical across both copies).

## What "100%/green light" means here

Checked against `docs/MONEYBEE_V3_FRONTEND_SPEC.md` (target app/feature
surface + its own gap note), `docs/codex/SYSTEM_REVIEW_2026-08-28.md`
(hardening gaps from direct code review), and the backend's Phase 2
(a frontend feature slice is only meaningful once its backend endpoint
exists — don't build ahead of the API). Same explicit boundary as the
backend doc: this mission reaches deploy-ready, not live-in-production —
see Phase 5.

## Phase 0 — Governance (shared, no code)

- [x] System review completed and pushed
- [x] PR #24 open on `claude/system-review-architecture-8vo66p`
- [ ] Every pass keeps PR #24's required checks green before the next pass
- [ ] This file's checkboxes match reality after every pass

## Phase 1 — Production hardening (from the system review, code-only, low risk)

**Status: closed.** All 5 items landed as code, verified with the repo's
actual local checks (typecheck/test/contracts/build) before each push, not
just claimed. One follow-up recorded above (remaining `.replaceAll`
call-sites), not hidden.

- [x] Content-Security-Policy at the edge (`deploy/Caddyfile.moneybee`) or
      per-app (`nginx.conf`) — top XSS/token-theft mitigation, currently
      absent end-to-end — landed per-app via `nginx-security-headers.conf`
      (pass: `9584805`). Also fixed a real bug found in the process: every
      nginx location block already set its own `add_header`, which per
      nginx's inheritance rule silently dropped the server-level security
      headers for every real response.
- [x] HSTS on the production edge (`deploy/Caddyfile.moneybee`) — backend
      staging edge already sets it, frontend production edge didn't;
      mirrored the same `(common)` snippet pattern (pass: `9584805`)
- [x] Test coverage for `apps/admin`, `apps/borrower`, `apps/lender`
      (was zero) — pass: `c0f546b`. Targeted the highest-value real bug
      class first: each app's `installPortalGuard()` requirement
      (membershipType/permission) extracted into a testable
      `portal-config.ts` and asserted exactly, since a copy-paste error
      between the three near-identical `main.ts` files would silently
      cross-wire portal access; plus route-table sanity (no duplicate
      paths, every `/auth/*` entry point stays reachable). Unplanned bonus
      found while wiring this up: converting routes to Vue Router's lazy
      `component: () => import(...)` pattern (needed to make the router
      importable under vitest without a real browser History object) also
      switched each app from one large bundle to per-route code-splitting
      — confirmed in build output.
- [x] Real shared component set in `packages/ui` (was one CSS file) —
      pass: `0d67ed0`. `BaseButton`/`BaseCard` plus `StatusBadge` built on
      two extracted, tested pure functions (`humanize`, `statusTone`)
      after finding 8 views independently reimplementing the same
      SNAKE_CASE-to-readable-text logic with zero status color-coding
      anywhere. Adopted in one real view per portal (borrower
      Conditions+Dashboard, admin Operations, lender Submissions) to
      prove it end-to-end rather than shipping unused. **Follow-up, not
      done**: the other ~5 files still inlining `.replaceAll("_", " ")`
      (grep for it) should migrate to `humanize()`/`StatusBadge` too, and
      the component set itself is intentionally minimal — a real Table/
      Input component is still worth adding once a second real usage
      pattern shows up (ResourceView.vue's table is the next obvious
      candidate).
- [ ] Confirm `pnpm contracts:check` and the backend's
      `verify_openapi_contract.py` are *required* status checks on their
      respective default branches, not merely present workflows

## Phase 2 — Frontend spec completion (per `docs/MONEYBEE_V3_FRONTEND_SPEC.md`)

Ordered so each slice is only started once its backend counterpart lands
in the backend mission's Phase 2:

- [x] **Lender portal** — was furthest behind target; all 9 spec slices now
      exist, pass: `5703010` + `5f2ef09`.
      Audited `PortalWorkspaceView` first per this doc's own note — it's a
      genuinely separate combined workspace (kept, mounted at `/workspace`),
      not a substitute for the individually-routed slices, so no
      duplication. Added `UnderwritingView` (bank review queue + decision
      recording), `ConditionsView` (request/approve/reject/waive),
      `ProgramsView` (list + edit eligibility rules), `ReportsView`
      (portfolio performance, composed from existing endpoints — no new
      backend needed), `SettingsView` (notification preferences via the
      shared `/me/notification-preferences` endpoint). Replaced the
      `OffersView`/`FundedView` placeholders (`/offers` and `/funded-deals`
      were reusing `SubmissionsView`/`DashboardView`) with real ones reading
      `/lender/portfolio` and `/lender/fundings`.
      While auditing `PortalWorkspaceView` found it was **shipping broken**:
      `packages/api-client/src/lender.ts`'s `LenderDecisionCreate`/
      `updateLenderProgram()` didn't match the real backend schemas at all
      (missing required `expected_version`, version sent as an `If-Match`
      header instead of in the body, a nonexistent `min_credit_score`
      field) — every decision-record and every program edit through that
      view was a guaranteed 422. Fixed the types, the PATCH payload, and
      `PortalWorkspaceView`'s decision form (real enum, `reason_codes`
      list, submission version threaded through); dropped the
      approved_amount/interest_rate/term_months decision fields since the
      backend never accepted them at decision time.
- [ ] **Admin portal** — confirm each target slice
      (`leads`, `fraud`, `underwriting`, `matching`, `lenders`, `funding`,
      `commissions`, `crm`, `integrations`, `compliance`, `complaints`,
      `affiliates`, `reporting`, `users`, `audit`) maps to a real view or
      a generic config-driven view (`ResourceView`/`OperationsView`
      already look like they're meant to be reused this way — verify
      before adding one-off view files that duplicate that pattern).
- [x] **Borrower portal** — `contracts`, `funding`, `renewals` slices added
      now that the backend engines they depend on have landed, pass:
      `3e7dac9`. `FundingView` and `RenewalsView` read straight off the
      existing `GET /applications/{id}/funding` and
      `/renewal-opportunities` endpoints. `ContractsView` shows
      status-specific guidance per contract state rather than a fake
      in-app signing action, since no signing-link endpoint exists yet —
      signing happens through DocuSign's own email flow once
      `ESIGN_LIVE_SEND` is turned on.
- [ ] **Shared packages still missing** per spec target: `forms`
      (resumable application form components — currently built ad hoc per
      app), `validation` (client-side feedback matching API constraints),
      `analytics` (consent-aware funnel events), `types` (generated from
      the backend's OpenAPI contract instead of hand-maintained).

## Phase 3 — See backend companion doc for API/domain completion

Do not start a Phase 2 view here until the backend endpoint it renders
exists and is contract-tested (`scripts/check-api-contracts.mjs` should
fail loudly if it doesn't).

## Phase 4 — Test & CI green-light criteria

- [ ] `pnpm typecheck` clean across all apps/packages
- [ ] `pnpm test` (vitest) green, including new tests added in Phase 1/2
- [ ] `pnpm contracts:check` passes against the backend's current
      `openapi.json`
- [ ] Backend `pytest`/`ruff`/migration/OpenAPI-contract checks green (see
      backend companion doc)
- [ ] PR #24 shows all required status checks green, no unresolved review
      threads

## Phase 5 — What a human operator does from here (not part of this mission)

Identical to the backend companion doc's Phase 5 — named operator, real
provider/DNS/OIDC production values, digest-pinned images, backup/restore
evidence, staged capability-freeze flips. Frontend-specific additions:

1. Confirm the four production domains
   (`moneybeeloan.com`/`app.`/`lenders.`/`admin.`) and `api.moneybeeloan.com`
   all resolve to the real edge before `deploy/Caddyfile.moneybee` is
   activated — this mission only edits the file, it doesn't touch DNS.
2. Confirm `VITE_OIDC_AUTHORITY`/`VITE_OIDC_CLIENT_ID` and friends are set
   to real production values at build time for each app's image (these
   are baked in at build, not runtime-injectable — a wrong value here
   means rebuilding, not just restarting).

## Working method

Same as the backend doc: small, testable chunk → implement → run real
local checks (`pnpm typecheck && pnpm test && pnpm contracts:check`) →
commit → push to PR #24 → report what changed/what's next → check the box
→ next pass. No pass merges its own PR or touches production.
