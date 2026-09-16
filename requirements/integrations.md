# Integration Contracts and Mock-First Operation

## Operating Principle

The platform is intentionally mock-first. Local operation must remain complete when Renewi vendor credentials, gate devices, identity systems, OCR services, notification services, and enterprise system contracts are unavailable. The current adapters produce deterministic local behavior and must not be described as live integrations.

The FastAPI integrations module exposes safe status metadata through the operational integrations workspace. It reports local selections such as `mock`, `local`, and `demo` as connected deterministic adapters. A non-local provider selection is reported as requiring attention because a production adapter is not configured.

## Implemented Local Adapters

| Integration boundary | Local implementation | Observable behavior | Production status |
| --- | --- | --- | --- |
| Identity verification | `MockIdentityVerifier` | An identifier containing the deterministic mismatch marker returns `Mismatch`; other identifiers return `Mock verification matched`. No biometric processing occurs. | No provider, credential contract, legal basis, or biometric approval is implemented. |
| OCR or document extraction | `MockOcrProvider` | Returns illustrative document metadata, a fixed confidence value, and `pending_review`. Extraction never verifies evidence. | No document-processing vendor or production endpoint is implemented. |
| Notifications | `MockNotificationProvider` | Produces an auditable local reference and sends no email, SMS, or external message. Expiry revalidation persists idempotent mock notification records for expired or blocked visits. | No delivery transport, sender identity, recipient policy, or monitoring is implemented. |
| Evidence storage | Local storage configuration | The local Compose volume provides a storage location for the demonstration environment. The schema stores a reference rather than implementing a production object-store adapter. | No managed storage integration, encryption policy, lifecycle policy, or access-control implementation is present. |
| Authentication | Seeded local account lookup and server-held demonstration session | Login accepts a seeded email and role combination, then returns an opaque session token. Protected API routes resolve the role from the unexpired server-side session record. | No SSO, production token validation, password handling, MFA, production session-security model, or identity-provider adapter is implemented. |
| HR, agency, freight exchange, LMS/SHEQ, and access control | Mock status entries | The integration-health response presents each as a deterministic mock adapter. | No endpoint, synchronization flow, credential handling, or reconciliation process is implemented. |

## Backend Contracts

The versioned FastAPI API is owned by `backend/app/api/v1/router.py`. The local login endpoint is `POST /api/v1/auth/login`. Protected dashboard, search, operational module, gate evaluation, and gate event endpoints require an unexpired opaque local Bearer session.

The gate contract is synchronous and online. `POST /api/v1/gate/evaluate` accepts an opaque authorization identifier and returns a fresh grant or deny decision, an explanation, gate-relevant person and visit information, identity status, and an internal authorization identifier only when recognized. `POST /api/v1/gate/events` accepts a previously granted current decision and records an entry or exit only after rechecking authorization and compliance.

Operational module workspaces are read-only where there is no explicit domain lifecycle API. Do not infer a production company, person, evidence, training, approval, QR lifecycle, or blacklist mutation from a workspace view.

## Expiry and Notification Behavior

The worker executes the deterministic expiry-revalidation function at a configurable sixty-second default interval. It evaluates visits whose status is `approved` or `active`. An expired or blocked result causes an idempotent mock notification record to be inserted. A failed scan is logged and retried after the configurable retry delay. The worker loop has no Redis-backed queue use, dead-letter handling, alerting, distributed scheduling control, or production delivery confirmation.

The production design must define scheduling ownership, durable delivery retries, escalation targets, alerting, distributed single-execution controls, and reconciliation before this background behavior is used outside the local demo.

## Production Integration Onboarding

A production adapter should be introduced only after Renewi supplies a documented contract. That contract must identify the data controller and owner, source-of-truth direction, endpoint and network requirements, authentication method, minimum scopes, retention and data-processing constraints, retry and timeout behavior, health semantics, audit requirements, error ownership, and test environment.

No production vendor names, endpoint paths, credentials, or protocol assumptions are encoded in this repository. The correct safe action when an adapter is not configured is to preserve the local mock state and treat the production integration as unavailable.
