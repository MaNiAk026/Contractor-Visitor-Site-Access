# Deployment and Production Readiness

## Current Deployment Artifact

The repository provides a Docker Compose configuration for local development and deterministic test execution. It builds the frontend and backend images, starts PostgreSQL and Redis containers, mounts the materialized backend application source into the backend runtime, worker, and backend-test services, starts the backend bootstrap command and worker loop, and defines optional backend-test and Playwright-test services.

This Compose file is not an approved production deployment manifest. It contains development-only PostgreSQL trust authentication, localhost port exposure, local named volumes, deterministic local authentication, mock provider defaults, no ingress configuration, no TLS termination, no managed secret integration, and no production worker orchestration. No Railway-specific configuration or other cloud-platform deployment definition is committed in the repository.

## Local Deployment Sequence

For a clean local environment, run:

```powershell
docker compose up -d --build
.\scripts\migrate.ps1
.\scripts\seed.ps1
```

The backend startup command runs `python -m app.cli bootstrap` before starting Uvicorn. The explicit PowerShell scripts remain the recommended operator sequence because they make migration and seed inputs visible and repeatable.

Use the health endpoints after startup:

```text
http://localhost:8000/api/v1/health
http://localhost:8000/api/v1/ready
```

The liveness endpoint reports backend availability without a database dependency. The readiness endpoint reports ready only after the domain schema is available.

## Final Local Validation Evidence

The completed STEP-07 validation used a clean credential-free Compose stack and deterministic reset/reseed. `docker compose config --quiet` passed, the PostgreSQL, Redis, backend, worker, and frontend services were healthy, and `.\scripts\reset.ps1 -ConfirmDemoReset` completed its local migration and deterministic seed path.

The dedicated backend-test service passed all 12 tests. Frontend type checking completed without diagnostics. Non-interactive lint completed with zero errors and two non-blocking anonymous-default-export warnings. The Vitest suite passed all 9 tests. The Playwright service passed all 3 deterministic journeys: compliant opaque-pass grant and entry, expired-evidence denial with its reason, and blacklist plus identity-mismatch denial without exposed gate actions.

This evidence validates the local demonstration stack only. It does not constitute production deployment, security certification, external-integration validation, physical-gate acceptance, or policy approval.

## Production Readiness Checklist

| Area | Required work before production | Current state |
| --- | --- | --- |
| Environment separation | Define dev, test, staging, and production configuration with separate secret stores and database identities. | Only local defaults are materialized. |
| Database security | Replace trust authentication with managed PostgreSQL, TLS, least-privilege runtime and migration identities, backups, restore tests, and monitoring. | Not implemented. |
| Authentication and authorization | Replace deterministic demo sessions with an approved identity provider, validated sessions or tokens, server-side claims, and least-privilege authorization tests. | Not implemented. |
| Secret management | Supply all production credentials through an approved secret manager with rotation and access audit. | Variable names only; no secret integration is implemented. |
| Evidence storage | Implement approved encrypted storage, access checks, audit logs, retention lifecycle, malware and content controls, and recovery procedures. | Local storage references only. |
| External integrations | Implement contracted adapters, credentials, network rules, health checks, retries, error handling, and reconciliation. | Mock adapters only. |
| Worker reliability | Define a managed scheduler or queue, retry and idempotency strategy, alerting, single-execution controls, and delivery monitoring. | A simple periodic local loop with configurable retry delay is implemented. |
| Network and transport | Configure private networking, TLS, ingress, CORS policy, firewall rules, DNS, certificate lifecycle, and vulnerability patching. | Not implemented. |
| Observability | Add production log aggregation, alerting, health monitoring, traceability, PII scrubbing, and approved error monitoring. | Structured backend logs and health endpoints only. |
| Site and gate integration | Validate physical devices, controller protocol, offline behavior, safety policy, operator workflow, and reconciliation at each pilot site. | Browser-only deterministic gate demonstration. |
| Release controls | Establish CI quality gates, security scanning, migration rollout and rollback procedures, deployment approvals, and operational runbooks. | Local test commands exist; complete production release controls are not implemented. |

## Configuration and Secrets

Use `.env.example` only as a local variable-name template. `TOKEN_SIGNING_KEY` and `SENTRY_DSN` are reserved names, but the current code does not implement production signing-key use or Sentry integration. Provider-selection variables are not evidence that a named vendor adapter is available.

Do not copy local `DATABASE_URL`, Redis values, or Compose defaults into production. Production values and credential shapes must be designed alongside approved infrastructure and adapter contracts described in [credentials.md](credentials.md) and [integrations.md](integrations.md).

## Recovery and Rollback

The local scripts are idempotent and support reset and reseed of the demonstration database only. There is no production migration rollout, downgrade, backup restore, blue-green deployment, or rollback workflow in this repository. Define and test those procedures before deploying application changes to any non-local environment.
