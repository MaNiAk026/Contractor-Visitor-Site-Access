-- Development-only PostgreSQL bootstrap.
-- Domain tables are created by numbered migrations so the schema history remains inspectable.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;

COMMENT ON SCHEMA app IS
    'Renewi application schema. Managed by local migration scripts and future Alembic revisions.';
