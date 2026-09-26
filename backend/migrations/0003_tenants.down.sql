-- Reverse 0003_tenants. Each challenge is re-invited to its own tenant only;
-- trusted devices come back empty (every device must re-join).

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS invite_token TEXT;
UPDATE challenges
  SET invite_token = md5(random()::text || clock_timestamp()::text || id::text)
  WHERE invite_token IS NULL;
ALTER TABLE challenges ADD CONSTRAINT challenges_invite_token_key UNIQUE (invite_token);

CREATE TABLE IF NOT EXISTS challenge_invites (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  household_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (challenge_id, household_id)
);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_household ON challenge_invites(household_id);

INSERT INTO challenge_invites (challenge_id, household_id)
  SELECT id, tenant_id FROM challenges
  ON CONFLICT (challenge_id, household_id) DO NOTHING;

DROP INDEX IF EXISTS idx_challenges_tenant;
ALTER TABLE challenges DROP COLUMN IF EXISTS tenant_id;

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users RENAME CONSTRAINT users_tenant_username_key TO users_household_username_key;
ALTER TABLE users RENAME COLUMN tenant_id TO household_id;

ALTER TABLE tenants RENAME CONSTRAINT tenants_secret_key_key TO households_code_key;
ALTER TABLE tenants RENAME COLUMN secret_key TO code;
ALTER TABLE tenants RENAME TO households;
