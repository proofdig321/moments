# Issue: CI/CD and deployment playbooks

Priority: P1

Summary:
Add CI, ensure tests run in PRs, and document deployment flows for Vercel and Railway. Provide environment templates and rollback runbooks.

Acceptance criteria:
- `.github/workflows/ci.yml` runs tests and builds.
- `env.example` present and documented in `DEPLOYMENT.md`.
- A staging deploy checklist exists.
