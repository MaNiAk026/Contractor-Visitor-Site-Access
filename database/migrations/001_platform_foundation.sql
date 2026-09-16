-- STEP-02 local platform foundation.
-- This migration is intentionally limited to database configuration and seed metadata.
-- STEP-03 will introduce Alembic-managed domain entities without rewriting local data.

BEGIN;

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app.platform_configuration (
    config_key TEXT PRIMARY KEY,
    config_value JSONB NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT platform_configuration_key_not_blank CHECK (length(trim(config_key)) > 0)
);

CREATE TABLE IF NOT EXISTS app.demo_seed_runs (
    seed_key TEXT PRIMARY KEY,
    seed_version TEXT NOT NULL,
    seeded_at TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    CONSTRAINT demo_seed_runs_key_not_blank CHECK (length(trim(seed_key)) > 0)
);

INSERT INTO app.schema_migrations (version)
VALUES ('001_platform_foundation')
ON CONFLICT (version) DO NOTHING;

COMMIT;
