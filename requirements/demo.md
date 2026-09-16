# Deterministic Local Demonstration Guide

## Demo Boundary

The local demonstration is seeded from SQL and uses credential-free local accounts. The accounts and scenario identifiers are demonstration fixtures, not workforce identities or production credentials. Reset the local database before repeating stateful demonstrations so gate-event and audit evidence remains deterministic.

Start the stack and apply seed data from the repository root:

```powershell
docker compose up -d --build
.\scripts\seed.ps1
```

To return to the original deterministic state, use the guarded local reset:

```powershell
.\scripts\reset.ps1 -ConfirmDemoReset
```

## Seeded Demonstration Roles

| Role | Demonstration email | Intended local workflow |
| --- | --- | --- |
| Platform administrator | `admin@demo.renewi.local` | Reviews the platform-wide demonstration workspace. |
| Compliance / SHEQ | `sheq@demo.renewi.local` | Reviews evidence, training, and readiness records. |
| Site administrator | `site@demo.renewi.local` | Reviews site and gate-facing operations. |
| Planner / requester | `planner@demo.renewi.local` | Reviews visits and short-notice registration presentation. |
| Contractor / agency | `agency@demo.renewi.local` | Reviews contractor-facing operational context. |
| Driver / visitor | `driver@demo.renewi.local` | Demonstrates restricted role behavior. |
| Gate operator | `gate@demo.renewi.local` | Performs the gate grant, deny, entry, and exit demonstration. |
| Auditor | `audit@demo.renewi.local` | Reviews audit-oriented operational records. |

Choose the corresponding email and role on the login screen. The backend validates the seeded pairing and creates an opaque local session that the browser sends as a Bearer credential. This is a deterministic demonstration authentication flow, not production authentication.

## Seeded Business Scenarios

| Scenario | Seeded person or visit state | Expected local result |
| --- | --- | --- |
| Compliant short-notice external driver | Nora Jansen has verified in-date evidence, passed sample training, no blacklist entry, and an active authorization. | Gate evaluation grants access with explainable reasons; the operator can record entry or exit. |
| Pending evidence | Daan van Leeuwen has evidence pending human verification. | Compliance remains pending and does not demonstrate a gate grant. |
| Expired evidence | Ravi Patel has expired evidence. | Gate evaluation denies with the reason that mandatory evidence is expired and requires renewal. |
| Failed training | Eva de Groot has a failed sample training attempt. | Compliance returns a failed outcome requiring remediation. |
| Active blacklist | Tom van Dalen has an active sample blacklist entry. | Gate evaluation denies access with an active-blacklist explanation. |
| Identity mismatch | The compliant Nora scenario has a separate deterministic mismatch input. | Gate evaluation denies despite the otherwise compliant visit and does not expose entry recording. |
| Active on-site roster | Omar Benali is seeded as an active visit. | The dashboard displays deterministic current-presence data. |
| Configurable locations | Vlaardingen and Rotterdam in NL and Antwerp in BE are seeded. | The schema and operational records demonstrate configurable country and site fields, not approved policy content. |

The sample Vlaardingen training module and requirement rules are illustrative. They are not Renewi-approved training, legal policy, or site-rule content.

## Gate Demonstration

Sign in as the gate operator and open the gate workflow. The default opaque pass reference represents the compliant scenario. Select **Verify access** to view the grant, returned identity status, and reasons. Select **Record entry** or **Record exit** only after a grant; the backend writes a gate event, updates the visit status, and appends an audit event.

Changing the reference, starting a new scan, or receiving a failed entry or exit request clears the previous decision. If the browser reports itself offline, verification is disabled because the gate flow has no offline authorization mechanism.

The automated browser suite exercises the compliant grant and entry path, expired-evidence denial, blacklist denial, and identity-mismatch denial. It intentionally does not expose the entry action after a denial. Test-only opaque references are retained in the browser test source rather than repeated in operational materials.

## Demonstration Limitations

Generic operational workspaces are read-only where a labelled lifecycle action has no durable implementation; unsupported actions are hidden rather than represented as successful production-like mutations. The gate connectivity state is browser online/offline presentation only, and the identity result is deterministic mock behavior. Resetting the database removes local demo records and must not be interpreted as a real retention or deletion procedure.
