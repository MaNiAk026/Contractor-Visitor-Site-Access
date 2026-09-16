-- STEP-07 hardening: server-validated local demo sessions and idempotent expiry notices.
-- This migration remains safe to apply repeatedly through the local bootstrap scripts.

BEGIN;

CREATE TABLE IF NOT EXISTS app.demo_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS demo_sessions_user_id_idx
    ON app.demo_sessions(user_id);

CREATE INDEX IF NOT EXISTS demo_sessions_expires_at_idx
    ON app.demo_sessions(expires_at);

-- A revalidation cycle may run more than once for the same condition. Retain one
-- notification per visit and result instead of continuously appending duplicates.
DELETE FROM app.notifications AS duplicate_notice
USING (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY visit_id, message
               ORDER BY created_at, id
           ) AS duplicate_rank
    FROM app.notifications
    WHERE message LIKE 'Mock re-validation notice:%'
) AS ranked_notice
WHERE duplicate_notice.id = ranked_notice.id
  AND ranked_notice.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_revalidation_notice_idx
    ON app.notifications(visit_id, message)
    WHERE message LIKE 'Mock re-validation notice:%';

INSERT INTO app.schema_migrations (version)
VALUES ('003_step07_hardening')
ON CONFLICT (version) DO NOTHING;

COMMIT;
