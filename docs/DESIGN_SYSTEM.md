# MoneyBee Enterprise Design System

## Direction

MoneyBee uses a disciplined black-and-yellow visual system inspired by the restraint, spacing confidence and strong hierarchy associated with premium aerospace and enterprise technology sites. It does **not** copy third-party logos, proprietary assets, fonts, page structures or exact layouts.

Canonical palette:

- Primary background: `#080808`
- Deep background: `#050505`
- Primary accent: `#FFD700`
- Primary text: `#F7F8FA`
- Supporting text: `#C9CBD1`
- Muted text: `#979AA2`
- Surface borders: `#292B30`

All literal values live in `packages/design-system/src/styles/tokens.css`. Application pages consume semantic CSS variables only.

## Typography

The default enterprise UI stack is:

`Inter, "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif`

Inter is preferred when it is already available. System fallbacks keep first paint fast and avoid a render-blocking third-party font request. Headings use restrained weight, tight tracking and large responsive scales; UI labels use compact uppercase treatment only where hierarchy benefits from it.

## CTA hierarchy

- **Primary:** yellow surface, black text. One dominant conversion action per viewport region.
- **Secondary:** transparent surface with a precise neutral border.
- **Quiet:** low-priority navigation/account action.
- **Danger:** destructive action only; never repurpose it for marketing emphasis.

Controls use a 50px default height, 44px minimum compact target, 2–4px corner radius, visible focus treatment and short property-specific motion.

## Header and footer

`MarketingShell` owns public-site chrome. Marketing routes must never create their own header or footer. Desktop header height is 76px and mobile height is 70px. Navigation labels are concise, mobile navigation is keyboard reachable, and focus remains visible.

The footer owns funding, company, legal and authentication navigation. Legal/disclosure copy must remain backend/legal-authoritative rather than being invented in presentation components.

## Layout

- Maximum content width: 1200px.
- Fluid side gutters through the shared container token.
- Section rhythm uses the spacing scale only.
- Large fields of negative space are preferred over decorative card grids.
- Borders and alignment create structure; excessive shadows, gradients, pills and glass effects are not part of the brand.

## Governance

Run:

```bash
pnpm test:design
```

The guard rejects:

- literal hex/RGB/HSL colors outside the token file;
- page-level font declarations;
- inline visual styles;
- raw buttons in application pages;
- page-specific headers or footers;
- parallel global CSS systems;
- `transition: all`;
- removal of the shared `MarketingShell` boundary.

New visual tokens require review of this document and the canonical token file in the same pull request. Shared behavior belongs in `@moneybee/design-system`, not in individual landing pages.

## Product boundaries

The design system is presentation-only. Funding eligibility, disclosures, rankings, application state, permissions and financial calculations remain backend-authoritative. The frontend must not encode lender decision logic or send forms directly to CRM/vendor systems.
