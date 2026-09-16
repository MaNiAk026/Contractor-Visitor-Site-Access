# Credentials and Environment Configuration

## Credential Policy

The repository intentionally contains no production credentials, passwords, API tokens, client certificates, private keys, or production connection strings. The local demonstration uses deterministic seed data, mock integrations, and server-issued opaque sessions, so it can run without external accounts. Future production secrets must be stored in the approved deployment secret manager rather than in `.env`, source control, documentation, browser storage, or container image layers.

An environment-variable name may be configured only after its value, owner, scope, rotation process, and deployment secret store have been approved. Where a provider has no production adapter implementation, this repository does not define its production credential shape and must not invent one.

## Local Configuration Names

| Variable | Local default or purpose | Local operational status |
| --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Names the local Compose project. | Used by local Compose configuration. |
| `APP_ENV` | Identifies the application environment. | Defaults to `development`. |
| `RENEWI_ENV` | Marks the reset target as the local demo environment. | Must remain `local` for the guarded reset script. |
| `POSTGRES_DB` and `POSTGRES_USER` | Set local PostgreSQL database identity. | Used by Compose and PowerShell database scripts. |
| `POSTGRES_PORT` and `REDIS_PORT` | Expose local PostgreSQL and Redis ports. | Local convenience configuration only. |
| `DATABASE_URL` | Configures the backend PostgreSQL connection. | The backend defaults to its Docker-internal local database URL when unset. |
| `REDIS_URL` | Declares the local Redis endpoint. | Present in backend settings and Compose; the current worker does not use Redis as queue transport. |
| `FRONTEND_PORT` and `BACKEND_PORT` | Expose the local frontend and backend ports. | Used by Compose port mappings. |
| `NEXT_PUBLIC_API_URL` | Selects the browser-facing API base path. | Defaults to the same-origin `/backend` proxy path. |
| `BACKEND_INTERNAL_URL` | Selects the FastAPI address used by the Next.js server proxy. | Defaults to the Docker-internal backend service address. |
| `STORAGE_PROVIDER` and `STORAGE_LOCAL_PATH` | Select and locate deterministic local evidence storage. | Defaults to local mounted storage. |
| `OCR_PROVIDER` | Selects document extraction behavior. | Defaults to `mock`. |
| `IDENTITY_VERIFIER_PROVIDER` | Selects identity verification behavior. | Defaults to `mock`. |
| `NOTIFICATION_PROVIDER` | Selects notification behavior. | Defaults to `mock`. |
| `AUTH_PROVIDER` | Declares the authentication-provider selection. | Defaults to `demo`; the implementation creates opaque local sessions after validating a seeded demonstration account and role pairing. |
| `LOG_LEVEL` | Selects backend logging verbosity. | Defaults to `INFO`. |
| `CORS_ORIGINS` | Configures allowed browser origins. | Defined by backend settings with local localhost defaults. |
| `TOKEN_SIGNING_KEY` | Reserved production-only signing-key setting. | Declared but not used by the deterministic local authorization implementation. |
| `SENTRY_DSN` | Reserved observability configuration name. | Declared in the environment template but not consumed by the current application. |
| `HR_INTEGRATION_PROVIDER`, `AGENCY_INTEGRATION_PROVIDER`, `FREIGHT_EXCHANGE_PROVIDER`, `LMS_PROVIDER`, and `ACCESS_CONTROL_PROVIDER` | Name intended enterprise-integration selections. | Default to `mock`; the current adapter implementation reports mock-only integration status. |
| `WORKER_SCAN_INTERVAL_SECONDS` and `WORKER_RETRY_DELAY_SECONDS` | Configure the local worker scan cadence and failure retry delay. | Used by the simple local periodic worker loop; they do not establish production scheduling or monitoring. |

## Local Authentication Boundary

The seeded login endpoint validates the selected demonstration email and role pairing, then creates an opaque server-side session with an eight-hour local lifetime. The frontend sends that opaque session reference in an `Authorization: Bearer` header. It no longer sends an `X-Demo-Role` request header.

This is an improvement over role-header spoofing for the local demonstration, but it is not a production identity solution. It does not provide an enterprise identity-provider integration, approved claim mapping, multifactor authentication, production session security policy, centralized revocation, or managed signing-key strategy.

## Production Credential Requirements

| Capability | Current adapter status | Required production input | Acquisition and minimum scope |
| --- | --- | --- | --- |
| Application authentication | Seeded demonstration accounts create opaque local sessions only. | Approved identity-provider contract, client configuration, session or token strategy, signing or encryption secrets, and role-claim mapping. | Renewi identity and security owners must approve the provider and least-privilege role mapping before implementation. |
| PostgreSQL | Local Compose uses development-only trust authentication. | Managed database endpoint, credential or workload-identity approach, TLS settings, backup access, and migration role. | Platform operations must issue separate runtime and migration identities with only required database privileges. |
| Evidence storage | Local storage selection only. | Storage-provider contract, bucket or container identity, encryption settings, retention controls, and read/write role separation. | Renewi platform and privacy owners must approve a storage service and least-privilege application identity. |
| OCR or document processing | The mock OCR provider returns illustrative extraction fields and a pending-review state. | Vendor choice, processing endpoint, data-processing terms, credentials, regional controls, and approved document types. | Renewi privacy, SHEQ, and procurement owners must approve the vendor and processing scope before adapter work begins. |
| Identity verification | The mock verifier returns deterministic results without biometric processing. | Approved verification method, provider contract, credentials, consent or legal basis, and biometric-policy decision. | Renewi legal, privacy, security, and site operations must approve the method before implementation. |
| Notifications | The mock notification provider returns a local reference and sends no message. | Approved email, SMS, or workflow provider contract, sender identity, recipient policy, credentials, and delivery monitoring. | Renewi communications and platform operations must authorize the service and minimum send scope. |
| HR, agency, freight exchange, LMS/SHEQ, and physical access control | The integration-health endpoint presents deterministic mock status only. | Authoritative system, API contract, network route, credentials, data ownership, error handling, and reconciliation rules. | Owning Renewi business and IT teams must provide an approved integration contract before development. |
| Error monitoring | `SENTRY_DSN` is a reserved template name only. | Monitoring vendor, data-scrubbing rules, endpoint, and credentials. | Platform operations and privacy owners must approve observability tooling and telemetry controls. |

## Adapter Selection Rules

The integration-health API treats `mock`, `local`, and `demo` provider values as connected deterministic adapters. Any other value is shown as requiring attention because a production adapter is not configured. This is a local status signal, not a vendor connection test.

Do not select a provider value such as `smtp` or a named vendor and assume an integration is active. The current implementation has no corresponding production transport, credential parser, secret rotation mechanism, or vendor-specific health check. Production work must add those capabilities and their tests before an operational status can be relied upon.

## Local Safety Constraints

The Compose file sets PostgreSQL's `POSTGRES_HOST_AUTH_METHOD` to `trust` for a credential-free local demonstration. It is deliberately not a production operating model. Keep database ports private to the local workstation where possible, do not attach the local Compose network to shared infrastructure, and replace this setting when introducing a managed database deployment.
