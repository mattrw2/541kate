-- Reverse 0002_households.
-- Note: restoring the global-unique constraint on users.username will fail if
-- duplicate usernames exist across households (created after this migration).

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_invite_token_key;
ALTER TABLE challenges DROP COLUMN IF EXISTS invite_token;

DROP TABLE IF EXISTS challenge_invites;
DROP TABLE IF EXISTS devices;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_household_username_key;
ALTER TABLE users DROP COLUMN IF EXISTS household_id;
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);

DROP TABLE IF EXISTS households;
