# Open Decisions and Required Production Work

## Purpose

This register preserves decisions that the credential-free local demonstration cannot make on Renewi's behalf and the production engineering work that is not implemented in the repository. An unresolved item is not an implied approval, and a mock implementation is not a substitute for a production control.

The completed local STEP-07 hardening is not listed as open work. The local platform now uses opaque server-validated demonstration sessions, truthfully hides unsupported generic mutations, clears stale gate decisions, reports browser online or offline state, manages dialog keyboard focus, retries failed expiry scans, prevents duplicate revalidation notices, and passes the documented clean-stack validation path.

## Renewi Policy and Integration Decisions

| Open item | Required owner | Impact if unresolved | Required before |
| --- | --- | --- | --- |
| DPIA, legal basis, permitted identity-verification method, and biometric policy | Renewi privacy, legal, security, and site operations | A production identity-verification service cannot be selected or enabled safely. | Production rollout |
| Retention, deletion, legal hold, evidence-access, and audit-retention policy | Renewi privacy, legal, records management, and IT | Personal and evidence data cannot be governed as production records. | Production rollout |
| Vlaardingen gate hardware, connectivity, access-controller interface, and failure mode | Renewi site operations and IT | Physical gate integration and reliable operating procedures cannot be implemented. | Pilot deployment |
| Offline authorization policy | Renewi site operations, SHEQ, security, legal, and IT | The application must remain online-only; no offline grant policy may be assumed. | Pilot deployment |
| Authoritative person, company, agency, HR, freight, LMS/SHEQ, and access-control sources | Renewi business owners and IT architecture | Production synchronization and source-of-truth behavior remain undefined. | Production integration |
| Population, country, site, evidence, training, exception, and blacklist rule content | Renewi product and SHEQ owners | The seeded NL/BE rules and sample training must remain demonstrative only. | Pilot acceptance |
| Production deployment, observability, support, incident, backup, and recovery model | Renewi platform operations and security | The repository remains a local development stack without a production operating model. | Production rollout |

## Required Production Engineering

| Production area | Current local boundary | Required work before non-local use |
| --- | --- | --- |
| Authentication and authorization | Seeded sign-in issues an opaque eight-hour local session and resolves roles from the server-side session record. | Integrate the approved identity provider, production session or token validation, claim mapping, least-privilege authorization, session lifecycle controls, and negative-path tests. |
| Database and secrets | Compose uses localhost-only PostgreSQL trust authentication and environment defaults. | Use managed database authentication, TLS, least-privilege runtime and migration identities, an approved secret manager, backup and restore verification, and access auditing. |
| Evidence handling | The schema stores mock metadata and local references; no complete binary evidence API exists. | Implement protected upload, retrieval, content and malware controls, encryption, lifecycle controls, permission checks, and complete sensitive-access audit coverage. |
| Provider adapters | Identity, OCR, notification, enterprise-system, and physical-access boundaries are deterministic mocks. | Implement only approved vendor contracts, credentials, network routes, health semantics, retries, reconciliation, data-processing controls, and test environments. |
| Background processing | The local loop retries failed scans and idempotently writes mock revalidation notices. | Provide durable scheduling or queueing, distributed single-execution safeguards, delivery retries, alerting, monitoring, escalation, and reconciliation. |
| Gate operations | The browser workflow requires an online API and reports browser connectivity only. | Integrate approved physical hardware and controller behavior, validate live connectivity and reconciliation, protect operator authentication, and implement the approved degraded or offline policy. |
| Deployment and release controls | Docker Compose is a local development and deterministic-test topology. | Define infrastructure, private networking, ingress and TLS, observability with PII controls, CI gates, security scanning, deployment approvals, migration rollout and rollback, and operational runbooks. |

## Safe Interim Operation

The safe interim posture is credential-free local demonstration only. Use deterministic seed data, reset before stateful browser journeys, and rely on the backend's fresh gate re-evaluation before recording a local event. Do not connect local Compose services to production infrastructure, add real credentials to environment files, make entry decisions while offline, or interpret mock status as an integration health guarantee.

## Production Resume Point

The next safe production step is to obtain Renewi-approved privacy, retention, site-device, offline-policy, rule-content, integration, and operational inputs. Use those approved inputs to design bounded production adapters, infrastructure, evidence controls, and gate integration; do not extend the mock-first local implementation by inference.
