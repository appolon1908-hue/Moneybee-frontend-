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

- [ ] Content-Security-Policy at the edge (`deploy/Caddyfile.moneybee`) or
      per-app (`nginx.conf`) — top XSS/token-theft mitigation, currently
      absent end-to-end
- [ ] HSTS on the production edge (`deploy/Caddyfile.moneybee`) — backend
      staging edge already sets it, frontend production edge doesn't
- [ ] Test coverage for `apps/admin`, `apps/borrower`, `apps/lender`
      (currently zero) — start with the form/status-transition flows that
      carry real business logic, not smoke tests
- [ ] Real shared component set in `packages/ui` (currently one CSS file)
      — Button, Input, Table, StatusBadge, Card, form-field wrapper at
      minimum, consumed by all four apps
- [ ] Confirm `pnpm contracts:check` and the backend's
      `verify_openapi_contract.py` are *required* status checks on their
      respective default branches, not merely present workflows

## Phase 2 — Frontend spec completion (per `docs/MONEYBEE_V3_FRONTEND_SPEC.md`)

Ordered so each slice is only started once its backend counterpart lands
in the backend mission's Phase 2:

- [ ] **Lender portal** — furthest behind target. Spec wants `dashboard`,
      `submissions`, `underwriting`, `conditions`, `offers`, `programs`,
      `funded`, `reports`, `settings`. Today: `DashboardView`,
      `SubmissionsView`, `PortalWorkspaceView` only. Needs dedicated
      `UnderwritingView`, `ConditionsView`, `OffersView`, `ProgramsView`,
      `FundedView`, `ReportsView`, `SettingsView` (or confirm
      `PortalWorkspaceView` genuinely covers several as internal tabs —
      audit before assuming a gap and building a duplicate).
- [ ] **Admin portal** — confirm each target slice
      (`leads`, `fraud`, `underwriting`, `matching`, `lenders`, `funding`,
      `commissions`, `crm`, `integrations`, `compliance`, `complaints`,
      `affiliates`, `reporting`, `users`, `audit`) maps to a real view or
      a generic config-driven view (`ResourceView`/`OperationsView`
      already look like they're meant to be reused this way — verify
      before adding one-off view files that duplicate that pattern).
- [ ] **Borrower portal** — `contracts`, `funding`, `renewals` slices are
      not yet present as views; blocked on backend Phase 2's contracts/
      e-sign and funding/commission/renewal engines landing first.
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
