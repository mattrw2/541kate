-- Households → tenants.
--
-- A tenant is the unit of isolation: users and challenges belong to exactly one
-- tenant. The tenant's secret_key is the only credential: clients send it with
-- every request, and may act as (impersonate) any user in that tenant. Trusted
-- devices are gone.

ALTER TABLE households RENAME TO tenants;
ALTER TABLE tenants RENAME COLUMN code TO secret_key;
ALTER TABLE tenants RENAME CONSTRAINT households_code_key TO tenants_secret_key_key;

ALTER TABLE users RENAME COLUMN household_id TO tenant_id;
ALTER TABLE users RENAME CONSTRAINT users_household_username_key TO users_tenant_username_key;

DROP TABLE IF EXISTS devices;

-- Challenges belong to a single tenant. Existing challenges go to the admin's
-- tenant, else the first invited household, else the oldest tenant.
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

UPDATE challenges c
  SET tenant_id = u.tenant_id
  FROM users u
  WHERE c.admin_user_id = u.id AND c.tenant_id IS NULL;

UPDATE challenges c
  SET tenant_id = (
    SELECT ci.household_id FROM challenge_invites ci
    WHERE ci.challenge_id = c.id
    ORDER BY ci.created_at, ci.id
    LIMIT 1
  )
  WHERE c.tenant_id IS NULL;

UPDATE challenges
  SET tenant_id = (SELECT id FROM tenants ORDER BY id LIMIT 1)
  WHERE tenant_id IS NULL;

ALTER TABLE challenges ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_tenant ON challenges(tenant_id);

-- Cross-household invites are gone.
DROP TABLE IF EXISTS challenge_invites;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_invite_token_key;
ALTER TABLE challenges DROP COLUMN IF EXISTS invite_token;
