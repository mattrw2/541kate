-- Households + trusted devices + invite-only challenges.
--
-- Moves the app from a flat, unauthenticated user list to multi-tenant
-- households. A device is trusted via a cookie token (stored hashed in
-- `devices`); a household has many user profiles; challenges are only visible
-- to invited households.

CREATE TABLE IF NOT EXISTS households (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_invites (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (challenge_id, household_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_invites_household ON challenge_invites(household_id);

-- Attach users to households.
ALTER TABLE users ADD COLUMN IF NOT EXISTS household_id INTEGER REFERENCES households(id);

-- Seed one default household for the existing group, assign every current user
-- to it, then make the column required.
INSERT INTO households (name, code) VALUES ('541kate', '541KATE')
  ON CONFLICT (code) DO NOTHING;

UPDATE users
  SET household_id = (SELECT id FROM households WHERE code = '541KATE')
  WHERE household_id IS NULL;

ALTER TABLE users ALTER COLUMN household_id SET NOT NULL;

-- Usernames are now unique per household, not globally.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users ADD CONSTRAINT users_household_username_key UNIQUE (household_id, username);

-- Keep existing challenges visible to the existing household.
INSERT INTO challenge_invites (challenge_id, household_id)
  SELECT c.id, (SELECT id FROM households WHERE code = '541KATE')
  FROM challenges c
  ON CONFLICT (challenge_id, household_id) DO NOTHING;

-- Shareable invite links for challenges. Each challenge has a random
-- invite_token; opening /join/<token> invites the visitor's household.
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS invite_token TEXT;

UPDATE challenges
  SET invite_token = md5(random()::text || clock_timestamp()::text || id::text)
  WHERE invite_token IS NULL;

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_invite_token_key;
ALTER TABLE challenges ADD CONSTRAINT challenges_invite_token_key UNIQUE (invite_token);
