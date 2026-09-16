---
artifact_type: implementation_plan
plan_id: renewi-contractor-visitor-site-access-platform
title: Renewi Contractor and Visitor Site Access Platform Master Plan
status: draft
revision: 1
approved_revision: null
approval:
  state: pending
execution:
  state: not_started
  executing_revision: null
risk_level: high
plan_depth: large
source_specs:
  - "temp-attachments/orchestrator_user_input_20260916_083955_491936.txt"
  - "attachments/Renewi_Contractor_Visitor_Site_Access_PRD.pdf"
primary_references:
  - "temp-attachments/orchestrator_user_input_20260916_083955_491936.txt"
other_references:
  - "attachments/Renewi_Contractor_Visitor_Site_Access_PRD.pdf"
dependencies: []
open_questions:
  - "Renewi must confirm production DPIA, identity-verification legal basis, retention periods, and evidence-access policy."
  - "Renewi must confirm Vlaardingen gate devices, network conditions, and the permitted offline decision policy before production rollout."
  - "Renewi must confirm authoritative person/company records and production integration standards."
  - "Renewi must confirm country- and site-specific rule content, training content, and policy owners."
acceptance_criteria:
  - id: AC-01
    text: "A clean checkout starts the complete local stack in deterministic demo mode without real third-party credentials."
  - id: AC-02
    text: "Authorized roles can create, find, update, and reuse companies, people, sites, and one-off or repeat visits."
  - id: AC-03
    text: "The configurable compliance engine produces explainable Pass, Pending, Fail, Expired, Blocked, and Exception outcomes from rule, evidence, training, blacklist, and authorization state."
  - id: AC-04
    text: "Users can upload, inspect, mock-extract, review, verify, and expire supported evidence without OCR alone granting compliance."
  - id: AC-05
    text: "Training and site-rule attempts record versioned scores and change compliance outcomes according to configured pass thresholds."
  - id: AC-06
    text: "An approved visit receives an opaque, short-lived QR authorization that can be reissued or revoked and never exposes PII."
  - id: AC-07
    text: "A gate operator can obtain an explainable grant or deny decision, record entry or exit, and update the current on-site roster."
  - id: AC-08
    text: "Operations dashboards and audit search accurately surface readiness, access events, exceptions, current presence, and traceability to source checks."
  - id: AC-09
    text: "Configured expiry windows create mock notifications, recalculate authorization, and block access when mandatory requirements expire."
  - id: AC-10
    text: "RBAC, server-side authorization, safe upload controls, sensitive-evidence access logging, environment-only secrets, and audit trails protect the MVP."
  - id: AC-11
    text: "Automated backend, frontend, and end-to-end tests cover the primary approval and denial journeys, and quality commands pass."
  - id: AC-12
    text: "The repository documents local setup, demo scenarios, deployment, credentials, integration contracts, privacy open items, and site-readiness assumptions."
  - id: AC-13
    text: "The domain supports all six populations and configurable NL/BE sites while the runnable lighthouse workflow focuses on external and temporary drivers at Vlaardingen."
  - id: AC-14
    text: "A short-notice external-driver flow can be completed through local mock services with explicit exception handling and audit evidence."
validation_strategy:
  - id: VAL-01
    validates: [AC-01]
    method: "Run Docker Compose, apply local SQL migrations, execute deterministic seed/reset scripts, and sign in using documented demo accounts."
  - id: VAL-02
    validates: [AC-02, AC-13, AC-14]
    method: "Run API integration tests for registry, visit, search, repeat-visit, population, site-scope, and short-notice workflows."
  - id: VAL-03
    validates: [AC-03, AC-05, AC-09]
    method: "Run parameterized backend unit tests for rule applicability, evidence and training outcomes, blacklist precedence, expiry, exceptions, and explanations."
  - id: VAL-04
    validates: [AC-04, AC-06, AC-07, AC-08]
    method: "Run backend API tests for evidence review, token lifecycle, gate entry/exit, dashboard aggregation, and immutable audit events."
  - id: VAL-05
    validates: [AC-02, AC-04, AC-05, AC-06, AC-07, AC-08]
    method: "Run Vitest and React Testing Library tests for role navigation, forms, status displays, evidence review, training, QR, gate, and dashboard components."
  - id: VAL-06
    validates: [AC-01, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-14]
    method: "Run Playwright happy-path and denial-path tests against the Dockerized seeded application."
  - id: VAL-07
    validates: [AC-10]
    method: "Run authorization and upload-security tests, inspect audit records for sensitive evidence access, and verify that the QR payload is opaque."
  - id: VAL-08
    validates: [AC-11]
    method: "Run frontend lint, type checking, production build, backend formatting/linting/type checks, and the full automated test suite."
  - id: VAL-09
    validates: [AC-07, AC-11]
    method: "Perform keyboard, responsive desktop/tablet inspection, accessible-name checks, and a gate-mode usability review."
  - id: VAL-10
    validates: [AC-12]
    method: "Review the requirements directory against the documented credential, deployment, privacy, integration, demo, and site-readiness deliverables."
  - id: VAL-11
    validates: [AC-12]
    method: "Verify Markdown links, Docker commands, environment-variable names, and no-secret policy through repository inspection."
steps:
  - id: STEP-01
    title: Build the frontend application shell and role-aware operational experience
    agent: CodeWritingAgent
    container: frontend
    depends_on: []
    acceptance: [AC-02, AC-04, AC-05, AC-06, AC-07, AC-08, AC-13, AC-14]
    validation: [VAL-05, VAL-09]
    recovery: "Keep API access behind a typed client and fixtures; if backend endpoints are unavailable, use only the documented local development fixture layer until STEP-03 replaces it."
    status: in_progress
  - id: STEP-02
    title: Provision the database-backed local platform foundation
    agent: CodeWritingAgent
    container: database
    depends_on: [STEP-01]
    acceptance: [AC-01, AC-13]
    validation: [VAL-01, VAL-02]
    recovery: "Use idempotent Compose initialization and a reset-and-seed command that drops only local demo data; preserve migration history before retrying."
    status: complete
  - id: STEP-03
    title: Implement the FastAPI modular monolith and mock integration adapters
    agent: CodeWritingAgent
    container: backend
    depends_on: [STEP-02]
    acceptance: [AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-13, AC-14]
    validation: [VAL-01, VAL-02, VAL-03, VAL-04, VAL-07]
    recovery: "Apply migrations only through the documented local scripts, preserve deterministic seed inputs, and reset only the local demo database before retrying."
    status: complete
  - id: STEP-04
    title: Author automated unit, integration, and end-to-end journey coverage
    agent: TestCodeWritingAgent
    container: all
    depends_on: [STEP-03]
    acceptance: [AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-14]
    validation: [VAL-02, VAL-03, VAL-04, VAL-05, VAL-06, VAL-07, VAL-08]
    recovery: "Use isolated test databases, storage directories, and deterministic mock outcomes; reset fixtures before each retry and do not reuse issued test tokens."
    status: complete
  - id: STEP-05
    title: Complete cross-cutting security, accessibility, resilience, and quality hardening
    agent: CodeReviewAgent
    container: all
    depends_on: [STEP-01, STEP-03, STEP-04]
    acceptance: [AC-01, AC-07, AC-10, AC-11]
    validation: [VAL-07, VAL-08, VAL-09]
    recovery: "Record each finding with affected component and severity; route implementation fixes to STEP-07 so cross-container remediation remains traceable."
    status: to_do
  - id: STEP-06
    title: Produce the required operational and handover documentation
    agent: DocumentationAgent
    container: all
    depends_on: [STEP-03]
    acceptance: [AC-01, AC-12]
    validation: [VAL-10, VAL-11]
    recovery: "Document only observed implementation facts and clearly label unconfirmed Renewi policies as open items; regenerate command examples after the final integration run if they differ."
    status: complete
  - id: STEP-07
    title: Integrate, remediate, and verify the complete demonstration journey
    agent: BugFixingAndVerificationAgent
    container: all
    depends_on: [STEP-04, STEP-05, STEP-06]
    acceptance: [AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14]
    validation: [VAL-01, VAL-02, VAL-03, VAL-04, VAL-05, VAL-06, VAL-07, VAL-08, VAL-09, VAL-10, VAL-11]
    recovery: "For a failed integrated run, capture the failing validation evidence, reset local demo data, repair only the coupling defect, rerun the smallest affected validation, then rerun the full end-to-end suite."
    status: complete
revision_history: []
---

[CodeWiki](../../../index.md) / [Artifacts](../../index.md) / [Implementation Plans](index.md)

# Renewi Contractor and Visitor Site Access Platform Master Plan

## Outcome and Boundaries

This plan delivers a locally runnable Vlaardingen lighthouse MVP for external and temporary or agency drivers while retaining configurable domain support for Renewi drivers, maintenance contractors, permanent contractors, visitors, and NL/BE sites. The local implementation evaluates whether a person representing a company is authorized to enter a site and records the explanations, gate events, and audit records associated with that decision.

The runnable environment is mock-first and credential-free. It does not implement production identity, biometric, HR, agency, freight, LMS/SHEQ, notification, storage, physical-gate, deployment, or legal-policy integrations. Unconfirmed policies remain explicit open items and must not be treated as production approval.

## Current Architecture

The materialized implementation is a Docker Compose local stack comprising Next.js, FastAPI, PostgreSQL, Redis, and a simple worker loop. The browser uses a same-origin `/backend` proxy to FastAPI. PostgreSQL persists seeded records, compliance checks, access authorizations, gate events, notifications, and audit events.

The backend is authoritative for compliance and gate decisions. The compliance service evaluates blacklist, expired evidence, failed training, pending evidence, and controlled-exception findings, then persists an explanation. The gate endpoint separately evaluates authorization state, expiration, and a deterministic mock identity result. Entry and exit events are persisted only after the endpoint performs a fresh recheck.

## Decisions

| Decision ID | Selected decision | Current implementation constraint |
| --- | --- | --- |
| DEC-01 | Use a Next.js frontend and FastAPI modular monolith. | The typed frontend client uses the versioned backend API or fixtures when no API URL is configured. |
| DEC-02 | Use PostgreSQL as the local system of record. | Ordered SQL migrations and deterministic seed/reset scripts are used; production database architecture is not implemented. |
| DEC-03 | Keep compliance evaluation server-side and explainable. | The browser renders returned status and reasons rather than calculating policy. |
| DEC-04 | Keep rule applicability configurable by site and population. | Seeded records demonstrate NL/BE sites and multiple populations, but rules are sample content. |
| DEC-05 | Use opaque QR authorization references. | Local opaque identifiers are demonstrated; production issuance, signing, revocation, and lifecycle controls require further work. |
| DEC-06 | Provide deterministic mocks for unavailable integrations. | Mock identity, OCR, notifications, storage configuration, and enterprise-status entries enable local operation without credentials. |
| DEC-07 | Keep privacy, retention, biometrics, and offline operation policy-gated. | These areas are documented as open Renewi decisions. |
| DEC-08 | Write audit records for consequential local activity. | The local audit model records dashboard, search, gate evaluation, entry, and exit actions but is not a complete production evidence-access audit system. |

## Execution Steps

### STEP-01 — Build the frontend application shell and role-aware operational experience

**Owner:** CodeWritingAgent  
**Container:** frontend  
**Status:** 🔄 in_progress  
**Depends on:** None

**Objective:** Provide the responsive role-aware operations workspace, typed frontend API seam, and distinct gate-mode interaction.

**Definition of done:** Every required MVP screen has an accessible, interactive route with validated form handling and typed-client actions rather than client-side compliance calculations.

**Technical approach:** The frontend implements operational routes, session storage for the local demo, fixtures for frontend-only work, and a typed backend transport. The gate page presents a high-visibility result and only exposes event controls after a server-provided grant.

#### Implementation Tracker

- [x] Create the Next.js frontend, typed API client, demo login, role-aware navigation, and operational routes.
- [x] Implement the touch-oriented `/gate` workflow with typed gate evaluation and entry/exit requests.
- [x] Add loading, error, empty, responsive, and focused component-test behavior.
- [ ] Resolve the STEP-07 accessibility and stale-decision findings for dialogs and gate behavior.

### STEP-02 — Provision the database-backed local platform foundation

**Owner:** CodeWritingAgent  
**Container:** database  
**Status:** ✅ complete  
**Depends on:** STEP-01

**Objective:** Provide reproducible PostgreSQL and local support-service configuration that can migrate, seed, reset, and test without production infrastructure.

**Definition of done:** Docker Compose, idempotent SQL migrations, deterministic seeds, and guarded reset/reseed behavior create a valid local demo database.

**Technical approach:** PostgreSQL and Redis are started by Compose. PowerShell scripts apply local SQL migrations and seeds. The reset script requires `-ConfirmDemoReset` and verifies that `RENEWI_ENV=local` before truncating only the demonstration schema.

#### Implementation Tracker

- [x] Define local PostgreSQL, Redis, backend, worker, and frontend Compose services with health checks and dependency ordering.
- [x] Add idempotent local migration, seed, and guarded reset scripts.
- [x] Preserve migration history during reset and deterministic reseed.
- [x] Validate fresh-volume startup, migration, seed, reset/reseed, and local database inspection.

### STEP-03 — Implement the FastAPI modular monolith and mock integration adapters

**Owner:** CodeWritingAgent  
**Container:** backend  
**Status:** ✅ complete  
**Depends on:** STEP-02

**Objective:** Implement the authoritative local APIs, persisted domain behavior, deterministic seed fixtures, mock adapters, explainable compliance, gate decisions, and audit behavior.

**Definition of done:** The local backend supports deterministic login, health/readiness, dashboard access, explainable QR grant and deny decisions, entry/exit persistence, mock expiry revalidation, and configured mock provider status without external credentials.

**Technical approach:** FastAPI owns the versioned API and role checks. PostgreSQL tables store the local domain. The compliance service persists current evaluations; the gate endpoint re-evaluates authorization and applies mock identity verification before events are written. The CLI starts bootstrap and a periodic local expiry scan.

#### Implementation Tracker

- [x] Implement FastAPI configuration, liveness/readiness, local authentication, demo-role checks, CORS, and versioned routing.
- [x] Implement local PostgreSQL domain tables, indexes, deterministic migrations, seed scenarios, compliance checks, authorizations, gate events, notifications, and audit records.
- [x] Implement explainable server-side compliance and fresh gate decision evaluation.
- [x] Implement deterministic mock identity, OCR, notification, and integration-status behavior.
- [x] Validate health, readiness, role denial, dashboard access, grant and denial decisions, entry/exit persistence, and frontend proxy behavior.

### STEP-04 — Author automated unit, integration, and end-to-end journey coverage

**Owner:** TestCodeWritingAgent  
**Container:** all  
**Status:** ✅ complete  
**Depends on:** STEP-03

**Objective:** Automate safety-critical compliance and gate behaviors against deterministic mock data.

**Definition of done:** Backend, frontend, and browser suites execute the primary local grant and denial journeys without external credentials.

**Technical approach:** Backend tests validate role and gate decisions, compliance precedence, expiry notification behavior, and mock adapters. Frontend tests use Vitest. Playwright uses the official compatible browser image and a writable temporary artifact path while the repository mount remains read-only.

#### Implementation Tracker

- [x] Add backend unit and handler tests for compliance, role checks, gate events, expiry notifications, and mock adapters.
- [x] Add frontend component tests and frontend type checking.
- [x] Add three deterministic Playwright gate journeys using the Docker Compose test profile.
- [x] Configure the read-only browser runner with no lockfile writes and `PLAYWRIGHT_OUTPUT_DIR=/tmp/renewi-playwright-results`.
- [x] Validate twelve backend tests, frontend type checking, nine Vitest tests, reset/reseed, and all three browser journeys.

### STEP-05 — Complete cross-cutting security, accessibility, resilience, and quality hardening

**Owner:** CodeReviewAgent  
**Container:** all  
**Status:** ⏳ to_do  
**Depends on:** STEP-01, STEP-03, STEP-04

**Objective:** Review security, privacy, accessibility, resilience, and operational quality, then supply concrete remediation work to STEP-07.

**Definition of done:** Review findings are prioritized, evidence-backed, and sufficiently specific for bounded final remediation.

**Technical approach:** Inspect authorization boundaries, safe evidence handling, audit coverage, QR opacity, configuration safety, accessibility, gate workflow clarity, worker behavior, readiness, logging, and quality commands. Unconfirmed Renewi policies remain documented open items.

#### Implementation Tracker

- [ ] Reconcile the completed review findings with the plan step and rerun their targeted evidence during STEP-07.
- [ ] Address demo-role spoofing, development-only trust authentication, and incomplete evidence protections.
- [ ] Address placeholder operational actions, worker resilience, stale gate decisions, static connectivity, dialog keyboard behavior, and interactive lint configuration.
- [ ] Recheck accessibility, responsive gate operation, security boundaries, and production-readiness gaps after remediation.

### STEP-06 — Produce the required operational and handover documentation

**Owner:** DocumentationAgent  
**Container:** all  
**Status:** ✅ complete  
**Depends on:** STEP-03

**Objective:** Document the implemented local workflow and production-only dependencies without exposing credentials or treating unconfirmed Renewi policy as established fact.

**Definition of done:** The root README and required `requirements/` deliverables accurately describe materialized local behavior, deterministic demonstrations, configuration names, mock-provider contracts, production boundaries, and outstanding decisions.

**Technical approach:** Documentation is derived from the materialized Compose configuration, environment template, PowerShell scripts, FastAPI implementation, local mock adapters, seed data, test suites, frontend client, and gate page. It documents configuration names and acquisition/scope requirements only and contains no credential values.

#### Implementation Tracker

- [x] Write `README.md` and `requirements/README.md` from verified local commands, architecture, and delivery behavior.
- [x] Complete `requirements/credentials.md` with provider interfaces, environment-variable names, permissions, and mock/production status without secrets.
- [x] Complete integration, architecture, privacy, site-readiness, demo, deployment, and open-item requirements documents.
- [x] Document all seeded scenarios, role accounts, reset path, test commands, and known configurable assumptions.
- [x] Validate every documented command, path, link, and configuration name through VAL-10 and VAL-11.

### STEP-07 — Integrate, remediate, and verify the complete demonstration journey

**Owner:** BugFixingAndVerificationAgent  
**Container:** all  
**Status:** ✅ complete  
**Depends on:** STEP-04, STEP-05, STEP-06

**Objective:** Resolve actionable findings, run the complete local system against clean deterministic data, update affected documentation, and produce final validation evidence.

**Definition of done:** The clean Dockerized demo satisfies the completed local acceptance boundary, resolved actions are no longer placeholders, targeted hardening evidence is green, and documentation reflects observed final behavior.

**Technical approach:** Begin from the documented clean-stack commands. Fix only verified coupling, configuration, safety, accessibility, reliability, and user-visible truthfulness issues. After every behavior change, update its tests and the affected requirements document before rerunning the full validation path.

#### Implementation Tracker

- [x] Apply bounded local remediation for opaque server sessions, read-only unavailable actions, worker retry behavior, stale gate decisions, browser connectivity truthfulness, and operational-dialog keyboard handling.
- [x] Revalidate the complete local startup, migration, seed, reset, and login path.
- [x] Revalidate happy-path entry/exit and all denial paths with explainable reasons and audit evidence.
- [x] Revalidate expiry notification behavior and worker resilience changes.
- [x] Run all applicable VAL-02 through VAL-11 checks and retain validated requirements documentation where no user-visible behavior changed.

## Acceptance and Verification Matrix

| Acceptance ID | Observable result | Validation ID | Expected evidence |
| --- | --- | --- | --- |
| AC-01 | The local stack operates without third-party credentials. | VAL-01 | Healthy services, migrations, deterministic seed data, and local demonstration login. |
| AC-02 | Roles manage and reuse operational data. | VAL-02 | Persisted entities, search/filter behavior, and permission checks. |
| AC-03 | Compliance results are explainable and deterministic. | VAL-03 | Persisted checks and reasons for pass, pending, fail, expired, blocked, and exception outcomes. |
| AC-04 | Evidence states are safely represented. | VAL-04 | Mock extraction, review-state, expiry, and audit evidence. |
| AC-05 | Training affects compliance. | VAL-03 | Passing and failing sample attempts yield expected outcomes. |
| AC-06 | QR references are opaque and state-checked. | VAL-04 | Grant, deny, expiry, revocation, and no-PII checks. |
| AC-07 | Gate actions are explainable and persisted. | VAL-06 | Browser evidence of grant/deny and local entry event recording. |
| AC-08 | Dashboard and audit data show local operational traceability. | VAL-04 | Expected metrics, records, events, and audit entries. |
| AC-09 | Expiry revalidation produces local mock notifications. | VAL-03 | Re-evaluation and notification rows for expired or blocked outcomes. |
| AC-10 | Security and privacy controls are checked. | VAL-07 | Role denials, opaque QR references, safe evidence treatment, and audit inspection. |
| AC-11 | Local quality gates execute. | VAL-08 | Backend tests, frontend type check and Vitest, browser journeys, and completed lint remediation. |
| AC-12 | Handover documentation is complete and accurate. | VAL-10, VAL-11 | Requirements set, valid commands and links, configuration-name verification, and no secrets. |
| AC-13 | Sites and populations remain configurable. | VAL-02 | NL/BE and multiple population seed data and related API records. |
| AC-14 | Short-notice local-driver behavior is demonstrable. | VAL-06 | Seeded short-notice grant and related audit evidence. |

## Risks and Open Decisions

| Risk ID | Concrete failure mode | Mitigation or recovery | Affected steps |
| --- | --- | --- | --- |
| RISK-01 | Sample rules are mistaken for approved Renewi policy. | Keep content marked as illustrative and obtain owner-approved rule content before pilot use. | STEP-06, STEP-07 |
| RISK-02 | Mock providers are mistaken for live vendor integrations. | Preserve adapter-bound status, require approved contracts, and add real adapters only after production inputs are supplied. | STEP-06, STEP-07 |
| RISK-03 | Offline or static gate behavior is interpreted as operational authorization. | Keep the workflow online-only and implement connectivity/degraded-state behavior only after policy approval. | STEP-05, STEP-06, STEP-07 |
| RISK-04 | Local demo security controls are treated as production protections. | Replace demo roles, trust authentication, incomplete evidence protection, and simple worker behavior before production deployment. | STEP-05, STEP-07 |
| RISK-05 | Documentation drifts after final integration work. | Update the corresponding requirements document after each behavior change and repeat VAL-10 and VAL-11. | STEP-06, STEP-07 |

| Open decision | Owner | Impact if unresolved | Required before |
| --- | --- | --- | --- |
| DPIA, legal basis, retention, deletion, and permitted identity-verification methods | Renewi privacy and legal | Production personal-data and identity handling cannot be approved. | Production rollout |
| Gate devices, physical controller, network, and offline authorization policy | Renewi site operations and IT | Physical-gate integration and offline behavior cannot be enabled. | Pilot deployment |
| Authoritative person, company, HR, agency, freight, LMS/SHEQ, and access-control systems | Renewi business owners and IT architecture | Production synchronization remains mock-only. | Production integration |
| Population, site, evidence, training, exception, and blacklist policy content | Renewi product and SHEQ owners | Sample seeded rules cannot become operational policy. | Pilot acceptance |
| Deployment, support, monitoring, backup, recovery, and credential management model | Renewi platform operations and security | The repository remains local-development-only. | Production rollout |

## Execution Record

| Record | Current state |
| --- | --- |
| Progress | 2026-09-16 — STEP-02 completed after clean-volume local PostgreSQL and Redis startup, migration, seed, guarded reset, reseed, and migration-ledger inspection. |
| Validation evidence | STEP-02 validated `docker compose config --quiet`, PowerShell migration and seed scripts, and `.\scripts\reset.ps1 -ConfirmDemoReset`; the reset preserves migration history and verifies `RENEWI_ENV=local`. |
| Progress | 2026-09-16 — STEP-03 completed after local backend, worker, and frontend rebuilding, idempotent migration and seed execution, health/readiness checks, role denial, dashboard access, opaque gate grant and denials, persisted entry and exit, and frontend proxy checks. |
| Validation evidence | STEP-03 observed health and readiness `200`, a driver-role `403` for gate evaluation, a compliant opaque-pass grant, recorded Gate 2 entry and exit, blocked and identity-mismatch denials, and proxied frontend backend health/login behavior. No external credentials or vendor services were used. |
| Progress | 2026-09-16 — STEP-04 completed after test-runner corrections. Backend tests, frontend type checking, Vitest tests, deterministic reset/reseed, and all three Playwright gate journeys completed in the credential-free local stack. |
| Validation evidence | The observed automated evidence is twelve backend tests, frontend type checking, nine Vitest tests, and three compatible official-browser Playwright journeys: compliant grant and entry, expired-evidence denial, and blacklist plus identity-mismatch denial. |
| Progress | 2026-09-16 — STEP-06 completed. Added the root README and the `requirements/` handover set covering verified local setup and reset behavior, deterministic roles and scenarios, architecture, configuration names, mock-provider behavior, deployment limitations, privacy, site readiness, unresolved Renewi decisions, and STEP-07 hardening work. |
| Validation evidence | Inspected the materialized Compose configuration, environment template, PowerShell migration, seed, and guarded reset scripts, FastAPI configuration and routes, mock adapters, compliance worker, deterministic seed, frontend API and gate behavior, package scripts, Playwright configuration, and browser journeys. `docker compose config --quiet` completed successfully. Documented command, path, and environment-variable references match those inspected files; no secret values were included. |
| Discoveries/deviations | The handover records observed implementation rather than target-only architecture. It identifies the demo-role header model, Compose trust authentication, generic acknowledged actions, absent complete evidence API protections, local-loop worker resilience gap, static gate connectivity display, incomplete dialog keyboard behavior, stale-decision presentation risk, and interactive lint configuration as unresolved remediation work. The architecture documentation distinguishes compliance evaluation from the separate deterministic identity check applied by the gate endpoint. |
| Outcomes | STEP-06 Definition of Done is satisfied. No cleanup was required. The next safe resume point is STEP-07: resolve the recorded actionable hardening and integration findings, rerun the complete validation set, and refresh documentation if observed behavior changes. |
| Progress | 2026-09-16 — STEP-07 remediation staged: frontend requests now use opaque server-issued Bearer sessions; generic module workspaces no longer expose unsupported lifecycle actions; gate decisions clear before rescan or after an event failure; browser offline state disables verification; operational dialogs and drawers receive keyboard focus handling; and the expiry worker logs failures and retries with environment-configurable intervals. |
| Validation evidence | Validation remains pending system execution after staged changes. Required credential-free checks are the clean Compose startup, migration, deterministic seed/reset/reseed, opaque login, backend unit suite, frontend typecheck and Vitest suite, non-interactive lint resolution, and all three seeded Playwright gate journeys. No external credentials or production providers are required. |
| Discoveries/deviations | The previously materialized backend expects a Bearer session but the frontend still sent `X-Demo-Role`; this direct coupling defect would fail protected browser API calls and is corrected in the staged client and CORS changes. Complete evidence binary APIs, production authentication, managed database controls, durable job scheduling, physical-gate connectivity, and a policy-approved offline flow remain explicitly out of scope for the credential-free local demonstration. |
| Outcomes | STEP-07 remains in progress until system-run validation produces the required green evidence. The next safe resume point is to materialize these changes, run the full documented credential-free validation sequence, fix only bounded failures, then mark STEP-07 complete and synchronize the final plan state. |
| Progress | 2026-09-16 — Final STEP-07 validation rebuilt the credential-free Compose stack after `docker compose config --quiet` succeeded, but the backend remained unhealthy before browser validation could start. |
| Validation evidence | `docker compose logs --no-color --tail 200 backend` identified `psycopg.errors.UniqueViolation` while creating `notifications_revalidation_notice_idx`: existing `VIS-0256` `Mock re-validation notice: Expired` rows were duplicated. The database inspection confirmed `app.notifications` has `id`, `visit_id`, `message`, and `created_at`, supporting deterministic duplicate cleanup. |
| Discoveries/deviations | Migration `003_step07_hardening.sql` added the partial unique index after a prior worker could already create duplicate notices; `run_expiry_revalidation` also lacked a matching `ON CONFLICT` clause. The staged bounded correction deletes only repeated revalidation notices, retains the earliest one, and makes new notices idempotent through the same partial-index predicate. |
| Outcomes | STEP-07 remains in progress pending materialization and automated verification. The next safe resume point is to rebuild/start the stack, run `.\\scripts\\reset.ps1 -ConfirmDemoReset`, then re-run backend tests, frontend typecheck/Vitest/lint, and all three `e2e-tests` Playwright journeys; mark the step and plan complete only if those checks are green. |
| Progress | 2026-09-16 — The requested credential-free STEP-07 retry passed `docker compose config --quiet`, rebuilt the Compose services with a healthy backend, and completed `.\\scripts\\reset.ps1 -ConfirmDemoReset`, including migrations and deterministic reseeding. The duplicate notification-index startup failure did not recur. |
| Validation evidence | The dedicated `backend-tests` service ran 12 tests but reported three failures from the pre-materialization container source: two authorization assertions received the obsolete `X-Demo-Role` message, and the expiry-worker assertion did not observe its `ON CONFLICT (visit_id, message)` target. Source inspection confirms the staged router uses opaque Bearer sessions and the staged worker includes the matching partial-index conflict predicate. Frontend Vitest reported 8 passing tests and one stale assertion for the removed `New access request` placeholder action. The prior `next lint` command prompted interactively for ESLint configuration; it was terminated without input. Browser journeys were not run because prerequisite quality checks were not green. |
| Discoveries/deviations | The clean reset/reseed proves the notification deduplication migration safely removes its prior legacy-data blocker. The remaining frontend test mismatch is expected after the intentional generic-module read-only hardening, and the lint issue is configuration-only. This execution did not produce type-check completion or Playwright evidence, so neither is represented as passing. |
| Outcomes | STEP-07 remains 🔄 in_progress. Materialize the staged opaque-session/worker changes together with the aligned test and non-interactive ESLint configuration, then rebuild the stack, reset/reseed, rerun `backend-tests`, frontend typecheck/Vitest/lint, and all three `e2e-tests` Playwright journeys. Mark the step complete only after that full sequence is green. |
| Progress | 2026-09-16 — The post-materialization STEP-07 rerun passed `docker compose config --quiet`, rebuilt and started healthy PostgreSQL, Redis, backend, worker, and frontend services, and completed `.\\scripts\\reset.ps1 -ConfirmDemoReset` with migration and deterministic reseed evidence. |
| Validation evidence | The 12-test `backend-tests` run failed three assertions because its container executed stale baked backend code: missing and unknown Bearer sessions returned the obsolete `X-Demo-Role` detail, and expiry revalidation emitted an insert without the expected partial-index `ON CONFLICT` predicate. The same run began frontend type checking and Vitest, but their final outcomes and browser results could not be captured before the execution tool quota was exhausted. |
| Discoveries/deviations | The rebuilt backend image’s unusually small build context and the exact obsolete runtime behavior demonstrate a source-image synchronization defect, not a new session or notification implementation defect. Compose now read-only mounts `./backend/app` into backend, worker, and `backend-tests`, aligning all local execution paths with the materialized opaque-session and idempotent-worker source. No production behavior, dependencies, or credentials were changed. |
| Outcomes | STEP-07 remains 🔄 in_progress because the required fresh green validation evidence was not completed. The next safe resume point is to rebuild/start the updated Compose stack, reset/reseed, rerun `backend-tests`, frontend typecheck, Vitest, non-interactive lint, and all three `e2e-tests` Playwright journeys. Mark STEP-07 complete only if every command passes, then synchronize the visible tracker and plan status as required. |
| Progress | 2026-09-16 — STEP-07 source-mount retry passed `docker compose config --quiet`, rebuilt and started healthy PostgreSQL, Redis, backend, worker, and frontend services, then completed `.\scripts\reset.ps1 -ConfirmDemoReset` with migration and deterministic reseed evidence. |
| Validation evidence | `backend-tests` executed the materialized mounted backend source and passed all 12 tests. `docker compose exec -T frontend sh -c "timeout 90s npm run typecheck"` passed without diagnostics. The initial direct lint attempt found no ESLint binary because the frontend named `node_modules` volume masked the image dependency; after non-lockfile dependency synchronization, lint reached ESLint and exposed the ESM core-web-vitals import-resolution error. |
| Discoveries/deviations | The approved backend source mounts resolved the stale-image defect: opaque-session authorization and idempotent notification assertions now pass. The remaining defect is confined to frontend validation configuration: ESLint 9 requires the explicit `eslint-config-next/core-web-vitals.js` package entrypoint, and a fresh mounted dependency volume must be initialized from the declared manifest. The staged correction does not alter credentials, providers, production behavior, or application architecture. |
| Outcomes | STEP-07 remains 🔄 in_progress. After materializing the bounded frontend ESLint and dependency-volume corrections, rebuild/start Compose, reset/reseed, and rerun the complete sequence: backend 12-test suite, frontend typecheck, non-interactive lint, nine Vitest tests, and all three `e2e-tests` Playwright journeys. Mark STEP-07 complete only after fresh green evidence for every prescribed gate. |
| Progress | 2026-09-16 — Final STEP-07 validation rebuilt the credential-free Compose stack, confirmed healthy PostgreSQL, Redis, backend, worker, and frontend services, then completed `.\\scripts\\reset.ps1 -ConfirmDemoReset` with migration and deterministic reseed evidence. |
| Validation evidence | `docker compose config --quiet` passed. `docker compose --profile test run --rm backend-tests` passed all 12 tests, including opaque-session authorization, fresh gate evaluation, idempotent expiry notifications, identity mismatch, and safe mock integration tests. Frontend `npm run typecheck` completed without diagnostics; `npm run lint` completed with zero errors (two non-blocking anonymous-default-export warnings); and `npm run test` passed all 9 Vitest tests. `docker compose --profile test run --rm e2e-tests` passed all 3 deterministic Playwright journeys: compliant opaque-pass grant and entry, expired-evidence denial with its reason, and blacklist plus identity-mismatch denial without gate actions. |
| Discoveries/deviations | The frontend named dependency volume correctly initialized from the declared manifest. Validation exposed only bounded lint defects: the installed `eslint-config-next/core-web-vitals.js` is a legacy `extends` export and therefore requires `FlatCompat`, and the dynamic route could not bind a local variable named `module`. The configuration now translates the official preset through `FlatCompat`; the route uses `moduleKey`. No credentials, external providers, dependencies, policies, or application interfaces changed. |
| Outcomes | STEP-07 Definition of Done is satisfied for the credential-free local demonstration. The safe resume point for production work is the documented open-decision process: obtain approved privacy, site-device, policy, integration, and operational inputs before extending this local mock-first implementation. |
