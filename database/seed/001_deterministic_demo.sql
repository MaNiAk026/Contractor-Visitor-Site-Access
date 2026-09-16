-- Deterministic local demo seed.
-- Business entities and scenario records are introduced by STEP-03 after their
-- SQLAlchemy models and Alembic migrations are available.

BEGIN;

INSERT INTO app.platform_configuration (config_key, config_value, description, updated_at)
VALUES
    (
        'demo_mode',
        '{"enabled": true, "seed_version": "2026-09-16-step-02"}'::jsonb,
        'Enables local deterministic demonstration behavior without external credentials.',
        TIMESTAMPTZ '2026-09-16 00:00:00+00'
    ),
    (
        'provider_selection',
        '{
            "authentication": "demo",
            "storage": "local",
            "document_processor": "mock",
            "identity_verifier": "mock",
            "notification": "mock",
            "hr": "mock",
            "agency": "mock",
            "freight_exchange": "mock",
            "lms": "mock",
            "access_control": "mock"
        }'::jsonb,
        'Default provider selections. Production adapters must be explicitly configured later.',
        TIMESTAMPTZ '2026-09-16 00:00:00+00'
    ),
    (
        'supported_scope',
        '{
            "countries": ["NL", "BE"],
            "pilot_site": "Vlaardingen",
            "populations": [
                "renewi_driver",
                "temporary_driver",
                "external_driver",
                "maintenance_contractor",
                "permanent_contractor",
                "visitor"
            ]
        }'::jsonb,
        'Configurable initial domain scope; no country-specific policy is implied.',
        TIMESTAMPTZ '2026-09-16 00:00:00+00'
    )
ON CONFLICT (config_key) DO UPDATE
SET
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

INSERT INTO app.demo_seed_runs (seed_key, seed_version, seeded_at, description)
VALUES (
    'local-demo-foundation',
    '2026-09-16-step-02',
    TIMESTAMPTZ '2026-09-16 00:00:00+00',
    'Credential-free deterministic local database foundation.'
)
ON CONFLICT (seed_key) DO UPDATE
SET
    seed_version = EXCLUDED.seed_version,
    seeded_at = EXCLUDED.seeded_at,
    description = EXCLUDED.description;

COMMIT;
