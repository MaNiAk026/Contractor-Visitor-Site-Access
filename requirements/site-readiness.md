# Site Readiness and Gate Operations

## Current Gate Demonstration

The current gate workflow is a browser page for Vlaardingen Gate 2. A gate operator can scan or type an opaque pass reference, receive a server-produced grant or deny decision, view the returned reasons, and record an entry or exit when the decision remains granted. Gate events and related audit events are persisted in PostgreSQL.

The page reflects the browser's online or offline state. When the browser is offline, access verification is disabled because the backend cannot produce an authorization decision. This browser-level signal is not a device-health check, scanner diagnostic, network probe, backend reachability test, or physical access-controller health signal.

A previously displayed decision is cleared when the operator changes the pass reference, initiates a new scan, or an entry or exit event fails. This prevents the interface from presenting a stale grant as though it remained actionable.

## Online Decision Requirement

The backend gate endpoint synchronously performs the current authorization, compliance, expiration, and mock identity checks. It must be reachable for a decision to be made. The current implementation does not cache decisions locally, sign offline passes, integrate with a physical controller, queue gate events for later synchronization, or define an offline grant rule.

Do not permit entry based on a stale browser screen, a manually copied local token, or an unavailable backend. Any offline behavior would be a safety and policy decision that Renewi site operations, IT, security, legal, and SHEQ owners must approve before implementation.

## Pre-Pilot Site Inputs

Before an operational pilot, Renewi must confirm the physical and operational facts below. The current local demonstration cannot supply or infer them.

| Readiness area | Required confirmation |
| --- | --- |
| Gate equipment | Scanner type, kiosk or tablet hardware, physical barrier or turnstile interface, device ownership, supported protocols, and fallback procedures. |
| Network | Wired or wireless coverage at each gate, expected latency, resilience, firewall routes, DNS, proxy rules, remote support access, and monitored connectivity. |
| Access control | Authoritative controller, command interface, command acknowledgement, failure behavior, safety interlocks, and reconciliation process between physical state and application events. |
| Identity process | Permitted verification method, staff training, escalation path for mismatch, manual-review process, and privacy safeguards. |
| Offline operation | Explicit decision on whether entry is denied, conditionally allowed, or recorded for later review during loss of connectivity; this is currently unresolved. |
| Operator roles | Named operational roles, shift coverage, least-privilege permissions, supervisor escalation, and incident procedures. |
| Site rules | Approved population, country, site, training, evidence, blacklist, exception, and override rules for the pilot site. |
| Operational support | Monitoring ownership, log access, incident response, change approval, rollback procedure, and user support contacts. |

## Required Gate Safety Controls

A production gate integration must verify live device and backend state, make the final decision server-authoritative or use an approved resilient equivalent, protect operator authentication, provide a clear fail-safe policy, prevent duplicate entry events, reconcile physical and application events, and retain an auditable explanation for every grant and deny. It must also be validated on actual hardware, network, and operating conditions.

The local UI's large grant and deny states, keyboard-aware dialogs, and decision-clearing behavior provide an improved interaction prototype. They do not replace pilot-site accessibility assessment, kiosk usability validation, physical-device testing, or an approved operational safety policy.
