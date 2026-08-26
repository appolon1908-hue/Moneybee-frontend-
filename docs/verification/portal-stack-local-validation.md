# Portal stack local validation

This branch is validated through `.github/workflows/portal-stack-ci.yml` and the stacked draft pull requests.

The verification contract requires:

- frozen-lockfile dependency installation;
- lint;
- TypeScript and Vue type checking;
- unit tests;
- production builds for all portal applications;
- no deployment and no capability activation.

Local execution reports generated during publication are retained outside the repository as review artifacts. GitHub Actions remains the merge-gating source of truth for the exact pushed commit.
