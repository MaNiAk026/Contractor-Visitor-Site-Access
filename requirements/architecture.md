# Implemented Architecture

## Component Topology

The materialized local topology is a Docker Compose application named `renewi-contractor-access`. It starts PostgreSQL, Redis, FastAPI, a worker, and a Next.js frontend. PostgreSQL and Redis have health checks. The frontend waits for healthy backend, PostgreSQL, and Redis services, while the backend and worker wait for PostgreSQL and Redis.

The frontend is a Next.js application. Its typed API client reads `NEXT_PUBLIC_API_URL`; in Compose this is `/backend`, allowing browser requests to stay same-origin while the Next.js server proxies them to `BACKEND_INTERNAL_URL`. When no API URL is configured, the typed client uses deterministic fixtures for frontend-only local development and component tests.

The backend is a FastAPI modular monolith. `backend/app/main.py` installs CORS middleware and registers the versioned `/api/v1` router. Liveness does not require a database connection, while readiness verifies that the domain table is available. Backend settings are loaded from environment variables through `backend/app/core/config.py`.

## Request and Decision Flow

A local user chooses a seeded email and role on the login screen. The backend login endpoint validates the seeded combination, creates an eight-hour opaque local demonstration session, and returns its token with the session shape. The frontend persists that demonstration session in browser local storage. Subsequent protected calls include the Bearer token, and the backend resolves the role from the unexpired server-side session record.

A gate operator submits an opaque pass reference through the gate page. The backend finds the associated authorization, re-evaluates compliance, checks expiration and authorization status, runs the deterministic mock identity verifier, and appends a gate-evaluation audit event. A grant requires an active unexpired authorization, a `Pass` or `Exception` compliance result, and a non-mismatch identity result. An entry or exit request repeats the authorization and compliance check before persisting a gate event and updating the visit state.

The frontend displays high-visibility grant or deny information, the returned identity status, and server-provided decision reasons. It enables entry and exit controls only for a returned grant. A token edit, a new scan, or a failed event submission clears the previous decision. The displayed connectivity indicator reflects browser online or offline state and disables verification while offline; it does not represent gate-device or backend-service health.

## Compliance and Persistence

`backend/app/modules/compliance/service.py` is the server-side compliance authority. It persists every evaluation in `app.compliance_checks` with status, reasons, trigger, and evaluation date. Its safety precedence is blacklist, expired evidence, failed training, pending evidence, controlled exception, then pass. The gate endpoint separately applies the deterministic mock identity result when deciding whether access is granted.

The PostgreSQL migration creates tables for users, companies, people, sites, requirement rules, evidence, training modules and attempts, visits, compliance checks, access authorizations, gate events, blacklist entries, notifications, integration connections, audit events, operational records, dashboard data, and search data. The schema provides foreign keys and indexes for core local lookups including authorization tokens, gate events, audit timestamps, evidence, visits, and people.

The current implementation is intentionally narrow. It seeds example records and has real persistence for gate decisions, gate events, compliance checks, notifications, and audit events. Generic operational workspaces are explicitly read-only when no dedicated lifecycle API exists, so unsupported actions are not represented as successful mutations. Evidence upload, binary-file inspection, production object access, production authorization tokens, and provider synchronization are not implemented as complete production interfaces.

## Background Work

The worker runs `python -m app.cli worker`. It continuously invokes expiry revalidation at a configurable sixty-second default interval. On a failure it logs the exception and retries after a configurable delay, while the database prevents duplicate revalidation notices for the same visit and result. The process remains a simple local loop that directly accesses PostgreSQL. Redis is present in Compose and settings but is not currently used to dispatch jobs. This is sufficient for deterministic local demonstration but not a production worker architecture.

## API Ownership

| Interface | Owning implementation | Current boundary |
| --- | --- | --- |
| Browser API transport | `frontend/src/lib/api/client.ts` | Uses the same-origin proxy when configured and deterministic fixtures when no API base URL is configured. |
| Local login and role checks | `backend/app/api/v1/router.py` | Seeded demo accounts establish opaque server-validated sessions only for the local demonstration. |
| Compliance evaluation | `backend/app/modules/compliance/service.py` | Calculates and persists explainable current compliance outcomes. |
| Gate decisions and events | `backend/app/api/v1/router.py` | Re-evaluates grants synchronously, applies mock identity status, and persists entry or exit events after authorization checks. |
| Provider status and mocks | `backend/app/modules/integrations/adapters.py` | Supplies deterministic mock behavior and safe configuration-status metadata. |
| Database bootstrap and worker loop | `backend/app/cli.py` | Applies ordered SQL files and runs a retrying periodic local expiry scan. |

## Production Boundary

The Compose topology is not a production architecture specification. It has development-only database trust authentication, a credential-free demonstration-session model, named local volumes, unencrypted local storage assumptions, no ingress or TLS configuration, no secret-store integration, no durable production scheduling, and no physical-gate transport. Production design and deployment work are described as pending in [deployment.md](deployment.md), [credentials.md](credentials.md), and [open-items.md](open-items.md).
