# Privacy, Data Handling, and Governance Open Items

## Current Demonstration Data

The local PostgreSQL schema stores person names, seeded email addresses, role labels, company associations, country codes, visit purposes, compliance statuses and reasons, evidence metadata and storage references, training attempts and scores, opaque authorization identifiers, gate event timestamps, blacklist reasons, notification records, and audit records. The deterministic seed data is demonstration data and includes no real vendor credentials.

The evidence schema can store an evidence type, a storage reference, a review status, an expiry date, and extracted JSON fields. The mock OCR adapter emits illustrative extracted fields and a confidence value but always requires human review. The current API does not provide a complete binary evidence-upload, download, or sensitive-evidence access-control interface. Therefore, the repository must not be treated as having completed production evidence protection or evidence-access logging.

## Current Local Safeguards

Compliance and gate decisions are made server-side. The backend records consequential dashboard, search, gate-evaluation, entry, and exit actions in the audit-event table. Gate passes are opaque references and do not encode person information in their submitted value.

After validating a seeded local account and role pairing, the backend creates an opaque server-side session with an eight-hour demonstration lifetime. The frontend stores that opaque session reference in browser local storage and sends it as an `Authorization: Bearer` header. The implementation no longer depends on a client-supplied demo-role header for protected requests.

These safeguards improve the local demonstration boundary, but they do not establish a production privacy or security control set. Browser local storage is not an approved production session-security model, and the audit-event model is not a complete sensitive-data access-control system.

## Retention and Deletion

No approved retention schedule, legal-hold process, subject-rights process, deletion workflow, archival policy, evidence lifecycle policy, or backup-retention policy is implemented. The local reset script deletes demonstration records only after verifying that `RENEWI_ENV=local`; it is a developer reset mechanism and not a production retention or deletion control.

Before production processing begins, Renewi must define record categories, retention periods, deletion triggers, legal-hold exceptions, storage lifecycle rules, audit retention, backup treatment, data-subject rights handling, and accountable owners. The approved policy must be reflected in application workflows, storage configuration, database jobs, access controls, tests, and operational runbooks.

## Identity Verification and Biometrics

The current identity verifier is deterministic and does not process biometric data. A token with a known test marker returns a mismatch result; other values return a mock match. No live identity proofing, biometric template, facial image, identity-document capture, or external identity-provider transmission is implemented.

Renewi legal and privacy owners must approve permitted identity-verification methods, a necessity and proportionality assessment, DPIA outcome, lawful basis, transparency notices, consent approach where applicable, processor terms, data locations, access restrictions, and retention before selecting or implementing a real provider. No local mock result is evidence of an approved production identity-verification policy.

## DPIA and Security Decisions Required

The following decisions remain unresolved and block production treatment of personal data.

| Decision | Required owner | Why it is required |
| --- | --- | --- |
| DPIA completion and approved legal basis | Renewi privacy and legal | The platform combines access, evidence, training, compliance, and gate-event information. |
| Approved identity-verification method | Renewi privacy, legal, security, and site operations | The mock adapter does not determine whether document, biometric, or other verification is permitted. |
| Evidence categories and processing rules | Renewi SHEQ and privacy | Required evidence types, human-review requirements, and use limitations must be approved per population and site. |
| Retention, deletion, and legal-hold rules | Renewi privacy, legal, records management, and IT | No current code defines defensible lifecycle controls. |
| Evidence-access model and audit requirements | Renewi security, privacy, and platform owners | The local API does not yet provide protected evidence viewing or complete sensitive-access auditing. |
| Cross-border, country, and site policy differences | Renewi legal and product/SHEQ owners | The schema supports NL and BE but does not supply approved jurisdiction-specific policy content. |

## Required Production Changes

Production rollout requires an approved authenticated identity model, server-enforced least-privilege permissions, evidence access controls, comprehensive sensitive-access auditing, approved storage encryption and lifecycle controls, secret management, telemetry scrubbing, data-export and deletion processes, and tests proving those controls. The concrete production engineering and policy gaps are maintained in [open-items.md](open-items.md).
