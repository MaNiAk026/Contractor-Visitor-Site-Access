-- STEP-03 domain schema. All tables are PostgreSQL-backed and safe for repeated local application.

BEGIN;

CREATE TABLE IF NOT EXISTS app.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    label TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    country_code CHAR(2) NOT NULL CHECK (country_code IN ('NL', 'BE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.people (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES app.companies(id),
    full_name TEXT NOT NULL,
    population TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    country_code CHAR(2) NOT NULL CHECK (country_code IN ('NL', 'BE')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.requirement_rules (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES app.sites(id),
    population TEXT,
    requirement_type TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.evidence (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES app.people(id),
    evidence_type TEXT NOT NULL,
    storage_reference TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'verified', 'expired', 'rejected')),
    expires_on DATE,
    extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.training_modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    version TEXT NOT NULL,
    pass_threshold INTEGER NOT NULL CHECK (pass_threshold BETWEEN 0 AND 100),
    content_locale TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.training_attempts (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES app.people(id),
    training_module_id TEXT NOT NULL REFERENCES app.training_modules(id),
    module_version TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.visits (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES app.people(id),
    site_id TEXT REFERENCES app.sites(id),
    site_name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    compliance_status TEXT NOT NULL,
    visit_status TEXT NOT NULL DEFAULT 'approved',
    short_notice BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.compliance_checks (
    id BIGSERIAL PRIMARY KEY,
    visit_id TEXT NOT NULL REFERENCES app.visits(id),
    status TEXT NOT NULL,
    reasons JSONB NOT NULL,
    trigger TEXT NOT NULL,
    evaluated_on DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.access_authorizations (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL REFERENCES app.visits(id),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.gate_events (
    id TEXT PRIMARY KEY,
    authorization_id TEXT NOT NULL REFERENCES app.access_authorizations(id),
    visit_id TEXT NOT NULL REFERENCES app.visits(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('entry', 'exit')),
    gate_name TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.blacklist_entries (
    id TEXT PRIMARY KEY,
    person_id TEXT REFERENCES app.people(id),
    company_id TEXT REFERENCES app.companies(id),
    reason TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (person_id IS NOT NULL OR company_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS app.notifications (
    id TEXT PRIMARY KEY,
    visit_id TEXT REFERENCES app.visits(id),
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.integration_connections (
    id TEXT PRIMARY KEY,
    provider_key TEXT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.audit_events (
    id TEXT PRIMARY KEY,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    entity_id TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.operational_records (
    id TEXT NOT NULL,
    module TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    status TEXT NOT NULL,
    updated TEXT NOT NULL,
    owner TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (module, id)
);

CREATE TABLE IF NOT EXISTS app.dashboard_metrics (
    label TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    change TEXT NOT NULL,
    status TEXT NOT NULL,
    target TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app.dashboard_activity (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    actor TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app.search_index (
    id TEXT PRIMARY KEY,
    "group" TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    href TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS people_company_id_idx ON app.people(company_id);
CREATE INDEX IF NOT EXISTS visits_person_id_idx ON app.visits(person_id);
CREATE INDEX IF NOT EXISTS evidence_person_id_idx ON app.evidence(person_id);
CREATE INDEX IF NOT EXISTS authorization_token_idx ON app.access_authorizations(token);
CREATE INDEX IF NOT EXISTS gate_events_visit_id_idx ON app.gate_events(visit_id);
CREATE INDEX IF NOT EXISTS audit_events_occurred_at_idx ON app.audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS operational_records_module_idx ON app.operational_records(module, sort_order);

INSERT INTO app.schema_migrations (version)
VALUES ('002_fastapi_domain')
ON CONFLICT (version) DO NOTHING;

COMMIT;
