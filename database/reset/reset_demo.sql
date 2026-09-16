-- Local-demo reset only. The PowerShell wrapper verifies RENEWI_ENV=local
-- before applying this operation. Keep schema migration history intact.

BEGIN;

TRUNCATE TABLE
    app.audit_events,
    app.gate_events,
    app.notifications,
    app.compliance_checks,
    app.access_authorizations,
    app.blacklist_entries,
    app.training_attempts,
    app.training_modules,
    app.evidence,
    app.requirement_rules,
    app.visits,
    app.people,
    app.companies,
    app.sites,
    app.users,
    app.integration_connections,
    app.operational_records,
    app.dashboard_metrics,
    app.dashboard_activity,
    app.search_index,
    app.platform_configuration,
    app.demo_seed_runs
RESTART IDENTITY CASCADE;

COMMIT;
