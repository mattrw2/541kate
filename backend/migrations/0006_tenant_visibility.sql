-- Public vs private groups. Every group is listed on the join screen; public
-- groups can be joined straight from the list, private ones need the shared
-- password. Existing groups required their password, so they start private.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
