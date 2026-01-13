# Amazon Q — Missions Guide

Purpose
- Provide step-by-step instructions for Amazon Q to execute verification missions for the `moments` repository and infrastructure.
- Ensure admin API endpoints, edge functions, MCP, and n8n are production-ready and align with SYSTEM.md.

Prerequisites
- Access to the repo workspace and CI runner.
- Credentials/secrets for staging environments (vault or env-managed).
- `SYSTEM.md` referenced for system-level invariants: [SYSTEM.md](SYSTEM.md)

Mission structure (for each mission)
1. Mission ID & owner: e.g., `mission-admin-endpoints` — assigned to Amazon Q.
2. Purpose: short objective (what success looks like).
3. Preconditions: files, environment, and agents required.
4. Steps: ordered verification and remediation actions.
5. Acceptance criteria: pass/fail gates required for completion.
6. Report: a concise verification report with findings, diffs, and suggested fixes.

Core Missions

- mission-admin-endpoints
  - Objective: Inventory and verify all admin API endpoints and edge functions for correctness, auth, and error handling.
  - Steps:
    1. Scan the codebase for files and routes mentioning `admin`, `edge`, `edge function`, `api`, `webhook`, and `flag-endpoint.js`.
    2. Produce an inventory (path, HTTP method, auth required, expected inputs/outputs).
    3. Check for explicit auth/role checks and safe defaults.
    4. Run static analysis and lint (if available): `npm run lint` or repo linters.
    5. Run focused unit/integration tests for admin routes (if present).
    6. Run smoke tests: `./smoke-tests-verifier.sh` and `comprehensive-test.sh` where applicable.
  - Acceptance:
    - All admin endpoints are listed and documented.
    - No unauthenticated admin endpoints accessible without guardrails.
    - Tests and smoke checks pass or open issues are created.

- mission-mcp-verification
  - Objective: Validate Model Context Protocol (MCP) cronfiguration, routes, and authenticate flows.
  - Steps:
    1. Locate MCP-related config and route definitions (search for `MCP`, `model-context`, or `mcp` tokens).
    2. Verify route registration, auth middleware, and rate-limits.
    3. Confirm telemetry and observability hooks are present (logs, metrics).
  - Acceptance:
    - MCP routes are registered and protected.
    - Documentation references in `SYSTEM.md` are satisfied.

- mission-n8n-workflows
  - Objective: Verify n8n workflows, credentials, and deployment configuration.
  - Steps:
    1. Check any `n8n` config files or deployment scripts (`n8n-production-env.txt`, `production-n8n-config.sh`).
    2. Validate presence of credentials in secure store, not in repo.
    3. Run a dry-run or simulated execution of critical workflows if safe.
  - Acceptance:
    - Workflows and credentials are configured securely.
    - Key workflows have smoke-run logs.

Cross-check against `SYSTEM.md`
- For each mission, ensure the system-level invariants in [SYSTEM.md](SYSTEM.md) are validated (auth boundaries, data retention, rate-limits, observability, fail-open vs fail-closed behavior).

Agent templates (use these when calling helpers/agents)
- Inventory agent (analysis):
  - "Scan the repo for admin API routes, edge functions, and webhooks. Produce a CSV with: path, file, HTTP method, auth, notes. Highlight any routes with missing auth or raw secret usage."

- Static-analysis agent:
  - "Run linters and static analyzers on API folders. List warnings/errors and priority fixes. Suggest quick patches for high-severity items."

- Test-run agent:
  - "Run unit and integration tests related to admin endpoints and report failures with stack traces and failing assertions. Then run `./smoke-tests-verifier.sh`."

Execution examples (commands to run locally or in CI)

- Lint and static checks (if present):

```bash
npm ci
npm run lint || echo "lint script not present"
```

- Run smoke/comprehensive tests:

```bash
./smoke-tests-verifier.sh || ./comprehensive-test.sh || echo "No smoke script found"
```

- Generate inventory (example grep):

```bash
grep -R "admin\|edge\|webhook\|flag-endpoint" -n src || true
```

Acceptance criteria (final gate)
- All listed core missions completed with status `pass` or documented `fail` with remediation.
- No critical unauthenticated admin endpoints.
- MCP routes validated and covered by tests or documented compensating controls.
- n8n credentials not stored in repo; workflows tested.
- A single verification report is produced and attached to the mission ticket.

Reporting format
- File: `mission-<id>-report.md` with sections: Summary, Inventory, Tests run, Failures, Remediation steps, PRs/patches opened.

Safety and rollbacks
- If a change is needed in production, follow `DEPLOYMENT.md` rollback steps.
- Tag any hotfix PRs with `hotfix/` and include rollback instructions.

Next actions for Amazon Q (immediate)
1. Run the inventory agent template and attach the CSV to the mission.
2. Run static-analysis agent and open tickets for any critical issues.
3. Run test-run agent and attach test logs.
4. Create `mission-admin-endpoints-report.md` summarizing findings and next steps.

--
Guide created for rapid execution. Adjust commands to match CI scripts if different.
