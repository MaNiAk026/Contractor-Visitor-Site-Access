# Operational and Handover Requirements

## Purpose

This directory is the operational handover package for the materialized Renewi Contractor and Visitor Site Access Platform demonstration. It records what the repository currently implements, how to run it locally without external credentials, and what Renewi decisions or engineering work are required before a production or pilot deployment.

The documentation does not convert unconfirmed legal, safety, retention, vendor, or gate-operation assumptions into approved policy. Where the code implements a deterministic mock, the corresponding production requirement is explicitly marked as unresolved.

## Verified Local Operating Model

The supported local environment is Docker Compose with PostgreSQL, Redis, FastAPI, a background worker, and a Next.js frontend. The stack uses deterministic seed data and defaults to local storage, mock OCR, mock identity verification, mock notifications, and demo authentication. The repeatable setup, reset, and test commands are maintained in the repository [README](../README.md).

Final clean-stack validation passed the Compose configuration check, deterministic reset and reseed, all twelve backend tests, frontend type checking, non-interactive lint with zero errors and two non-blocking warnings, all nine Vitest tests, and all three deterministic Playwright gate journeys. The browser journeys cover a compliant grant and entry, expired-evidence denial, and blacklist plus identity-mismatch denial. This evidence demonstrates local behavior only; it does not certify production security, legal compliance, vendor integration, or physical-gate compatibility.

## Handover Contents

The credential inventory in [credentials.md](credentials.md) documents only environment-variable names and required production acquisition decisions. It contains no passwords, tokens, connection strings, certificates, or private keys.

The integration guide in [integrations.md](integrations.md) explains each mock-first adapter and the production implementation gap. The architecture guide in [architecture.md](architecture.md) documents component ownership, persistence, and API flow. The privacy and site-readiness guides in [privacy.md](privacy.md) and [site-readiness.md](site-readiness.md) preserve legal, retention, network, device, and offline-policy decisions that Renewi must make.

The [demo.md](demo.md) guide lists the deterministic roles and business scenarios for safe local demonstrations. The [deployment.md](deployment.md) guide explains why Docker Compose is a local development topology rather than an approved production deployment. The prioritized [open-items.md](open-items.md) guide records only the remaining production policy, integration, security, and operational dependencies.

## Completion Boundary

This handover set satisfies the documentation boundary for the credential-free local MVP. Before any production rollout, complete the open policy decisions, implement and test real provider adapters, replace the credential-free demonstration session and development-only database trust authentication, and perform a production-specific security, privacy, resilience, and site-readiness review.
