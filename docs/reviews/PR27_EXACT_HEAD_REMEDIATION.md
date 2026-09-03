# PR #27 exact-head review remediation

Updated: 2026-09-03

Backend authority is the protected PR #42 merge `474ab4eb96898f2d428b03b5fcee989b5b4182f9`.

The frontend release branch now:

- paginates disclosures, adverse-action notices, and commission tax records;
- preserves successful compliance sections when another independent read fails;
- ignores results from superseded refresh generations;
- retains mutation idempotency keys after network/retryable ambiguity and releases them only after a definitive outcome;
- requires `compliance.read` for the route and hides the sidebar link without that backend-returned permission;
- renders legal and financial amounts with two decimal places;
- requires borrowers to retrieve and review the disclosure, record acknowledgment separately, and only then accept an offer;
- validates against the protected backend merge rather than an unmerged candidate;
- replaces conflicting contract evidence with one protected source authority.

Required exact-head validation remains the normal `secure-frontend-ci` workflow. No production deployment or external effect is authorized.
