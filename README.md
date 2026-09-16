# Renewi Contractor and Visitor Site Access Platform

## Purpose and Current Scope

This repository contains a locally runnable, mock-first demonstration platform for contractor and visitor site access at Vlaardingen. It models reusable companies, people, sites, evidence, training attempts, compliance decisions, opaque access authorizations, gate entry and exit events, dashboard data, and audit records. The seeded lighthouse scenarios focus on external and temporary drivers while the data model includes configurable Netherlands and Belgium sites and several contractor populations.

The implementation is suitable for deterministic local demonstration and automated validation without real vendor credentials, physical gate hardware, biometric services, or production identity systems. It is not a production deployment. Production authentication, hardware access control, external provider integrations, legal policy, retention controls, and operational deployment controls remain open and are documented in the `requirements/` directory.

## Architecture

The local stack runs a Next.js frontend, a FastAPI backend, PostgreSQL, Redis, and a background worker through Docker Compose. The browser uses the same-origin `/backend` path, which the Next.js server proxies to the FastAPI service. PostgreSQL is the persisted source of truth for the seeded domain data, gate events, compliance checks, notifications, and audit events.

The backend remains the authority for compliance and gate decisions. On every gate evaluation it evaluates the visit's current evidence, training, blacklist, authorization, and deterministic mock identity result before allowing an entry or exit event to be recorded. The frontend renders the returned decision and reasons; it does not calculate access policy.

Detailed boundaries and API behavior are documented in [requirements/architecture.md](requirements/architecture.md). Mock and production-adapter status is documented in [requirements/integrations.md](requirements/integrations.md).

## Local Prerequisites

Use Docker Desktop with Docker Compose and PowerShell. The local stack does not require third-party accounts or real provider credentials. Optional local configuration can be copied from `.env.example`; leaving production-only settings unset retains the supported mock-first behavior.

The Compose configuration uses development-only PostgreSQL trust authentication. This is intentionally limited to the local demo environment and must not be used for a shared, staging, or production database.

## Start the Deterministic Local Demo

From the repository root, start and build the local services:

```powershell
docker compose up -d --build
```

Apply the idempotent migrations and seed the deterministic demo data:

```powershell
.\scripts\migrate.ps1
.\scripts\seed.ps1
```

Open the frontend at `http://localhost:3000`. The FastAPI OpenAPI interface is available at `http://localhost:8000/docs`, and the backend liveness and readiness endpoints are `http://localhost:8000/api/v1/health` and `http://localhost:8000/api/v1/ready`.

The backend container also bootstraps migrations and deterministic seeds when it starts. Running the scripts remains the explicit and repeatable handover sequence because the scripts wait for PostgreSQL and apply both migration and seed files in a defined order.

## Reset Local Demonstration Data

The reset command is destructive only for the local demonstration schema. It requires an explicit switch and refuses to run unless the Compose database reports `RENEWI_ENV=local`. Migration history is retained, then migrations and both deterministic seed files are applied again.

```powershell
.\scripts\reset.ps1 -ConfirmDemoReset
```

Do not use this command against a non-local database. The reset is designed for local reruns, including repeatable browser validation.

## Validate the Materialized Demo

The following commands are the validated local quality path. Reset and reseed immediately before the browser suite because it records entry events and audit evidence.

```powershell
docker compose --profile test run --rm backend-tests
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm run test
.\scripts\reset.ps1 -ConfirmDemoReset
.\scripts\seed.ps1
docker compose --profile test run --rm e2e-tests
```

The final clean-stack evidence comprises a passing Compose configuration check, deterministic reset and reseed, twelve passing backend tests, frontend TypeScript checking without diagnostics, non-interactive lint with zero errors and two non-blocking anonymous-default-export warnings, nine passing Vitest tests, and three passing Playwright gate journeys. The browser runner uses the official Playwright `v1.51.1-noble` image, installs dependencies without writing the read-only repository lockfile, and stores failure artifacts in a writable temporary directory.

## Operational Demo Behavior

Use the login page to choose a seeded demonstration account and matching role. The backend validates that pairing and returns an opaque local demonstration session. Protected API calls use that Bearer session, and the backend resolves the role from the server-side session record rather than a client-controlled role header. This credential-free local mechanism is not production authentication or an identity-assurance control.

The gate page starts with a deterministic compliant opaque pass. A successful evaluation displays an explainable grant and enables entry or exit recording. Expired evidence, active blacklist entries, and the deterministic identity-mismatch scenario display denial reasons and do not expose the entry action. See [requirements/demo.md](requirements/demo.md) for accounts, scenarios, and reset guidance.

## Handover Documents

The `requirements/` directory contains the operational handover set:

- [requirements/README.md](requirements/README.md) summarizes the handover boundary and validation evidence.
- [requirements/credentials.md](requirements/credentials.md) lists environment-variable names, production credential needs, and adapter status without secret values.
- [requirements/integrations.md](requirements/integrations.md) describes mock adapters, provider contracts, and unimplemented production integrations.
- [requirements/architecture.md](requirements/architecture.md) documents the implemented local components, API ownership, data flow, and persistence.
- [requirements/privacy.md](requirements/privacy.md) records current sensitive-data handling and the unresolved legal, retention, and DPIA decisions.
- [requirements/site-readiness.md](requirements/site-readiness.md) defines the site, network, device, and offline-policy decisions needed before a pilot.
- [requirements/demo.md](requirements/demo.md) describes the seeded roles and reproducible scenarios.
- [requirements/deployment.md](requirements/deployment.md) distinguishes the local Compose stack from the production deployment work still required.
- [requirements/open-items.md](requirements/open-items.md) records the policy, integration, security, and operational work that must be resolved before production use.

## Important Production Boundary

Do not treat the local `demo`, `mock`, and `local` provider values as production implementations. No production vendor endpoint, credential, certificate, key, physical gate controller, or legal approval is included in this repository. The required decisions and remediation work are intentionally preserved as open items rather than inferred from the local demonstration.
