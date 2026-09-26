const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { requireTenant, normalizeKey, isId } = require("../middleware/tenant");

const router = express.Router();

// Human-friendly secret key, no visually ambiguous characters (0/O, 1/I/L).
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genKey = (len = 10) => {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  return out;
};

const uniqueKey = async () => {
  for (let i = 0; i < 10; i++) {
    const key = genKey();
    if (!(await db.getTenantBySecretKey(key))) return key;
  }
  throw new Error("Could not generate a unique tenant key.");
};

const tenantState = async (tenantId, userId) => {
  const tenant = await db.getTenantById(tenantId);
  const users = await db.getTenantUsers(tenantId);
  const currentUser = users.find((u) => u.id === userId) || null;
  return { tenant, users, currentUser };
};

// GET /tenants - every group's id and name (no passwords), for the join picker
router.get("/", async (req, res) => {
  try {
    return res.json(await db.listTenants());
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while listing groups.");
  }
});

// GET /tenants/me - tenant (incl. its secret key), its users, and the acting user
router.get("/me", requireTenant, async (req, res) => {
  try {
    return res.json(await tenantState(req.tenantId, req.userId));
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the tenant.");
  }
});

// POST /tenants - create a tenant with a first user. Users are per-tenant, so this
// is always a brand-new user. The response carries the secret key to send from now on.
router.post("/", async (req, res) => {
  const { tenantName, username } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).send("username is required.");
  }
  if (!tenantName || !tenantName.trim()) {
    return res.status(400).send("tenantName is required.");
  }
  try {
    // Groups are picked by name when joining, so names must be distinguishable.
    if (await db.getTenantByName(tenantName.trim())) {
      return res.status(409).send("A group with that name already exists.");
    }
    const tenant = await db.createTenant(tenantName.trim(), await uniqueKey());
    const user = await db.addUserToTenant(tenant.id, username.trim());
    return res.json(await tenantState(tenant.id, user.id));
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while creating the tenant.");
  }
});

// POST /tenants/join - look up a tenant by its secret key. With a username, that
// user is returned as currentUser (created if it doesn't exist yet); without one,
// the client picks any of the returned users to act as. With a challenge_id (from a
// challenge's invite link), that challenge's id and name are included if it
// belongs to the tenant. With a tenant_id (picked from the group list), the key
// must be that group's.
router.post("/join", async (req, res) => {
  const { key, username, challenge_id, tenant_id } = req.body;
  if (!key) {
    return res.status(400).send("key is required.");
  }
  try {
    const tenant = await db.getTenantBySecretKey(normalizeKey(key));
    if (tenant_id != null && tenant_id !== "" && (!tenant || String(tenant.id) !== String(tenant_id))) {
      return res.status(401).send("That's not the password for this group.");
    }
    if (!tenant) {
      return res.status(404).send("No group found with that shared password.");
    }
    let userId = null;
    if (username && username.trim()) {
      const user =
        (await db.getTenantUserByUsername(tenant.id, username.trim())) ||
        (await db.addUserToTenant(tenant.id, username.trim()));
      userId = user.id;
    }
    const state = await tenantState(tenant.id, userId);
    if (isId(challenge_id) && (await db.challengeInTenant(challenge_id, tenant.id))) {
      const challenge = await db.getChallenge(challenge_id);
      state.challenge = { id: challenge.id, name: challenge.name };
    }
    return res.json(state);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while joining the tenant.");
  }
});

// Shared passwords are case-insensitive (stored uppercase) and must be safe to
// send in a header.
const VALID_KEY = /^[A-Z0-9_-]{6,40}$/;

// PUT /tenants/password - change the tenant's shared password. The old one stops
// working immediately, so every other device needs the new one.
router.put("/password", requireTenant, async (req, res) => {
  const key = normalizeKey(req.body.password || "");
  if (!VALID_KEY.test(key)) {
    return res.status(400).send("Use 6–40 letters, numbers, - or _.");
  }
  try {
    const existing = await db.getTenantBySecretKey(key);
    if (existing && existing.id !== req.tenantId) {
      return res.status(409).send("That password is taken. Pick another.");
    }
    const tenant = await db.updateTenantSecretKey(req.tenantId, key);
    return res.json({ tenant });
  } catch (error) {
    // Lost a race with another group choosing the same password.
    if (error.code === "23505") return res.status(409).send("That password is taken. Pick another.");
    console.error(error);
    res.status(500).send("An error occurred while changing the password.");
  }
});

module.exports = router;
