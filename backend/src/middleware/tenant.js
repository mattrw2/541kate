const db = require("../db");

// The tenant's secret key is the only credential. Clients send it on every
// request, plus the id of the user they're acting as. Any user in a tenant may
// act as any other user in it, so the user id is only checked for membership.
const KEY_HEADER = "x-tenant-key";
const USER_HEADER = "x-user-id";

const isId = (v) => /^\d+$/.test(String(v));
const normalizeKey = (key) => String(key).trim().toUpperCase();

// Gate a route on a valid tenant key. Attaches req.tenantId and req.userId
// (the acting user; null if the X-User-Id header is absent).
const requireTenant = async (req, res, next) => {
  const key = req.get(KEY_HEADER);
  if (!key) return res.status(401).send("Tenant key required.");
  try {
    const tenant = await db.getTenantBySecretKey(normalizeKey(key));
    if (!tenant) return res.status(401).send("Unknown tenant key.");
    req.tenantId = tenant.id;
    req.userId = null;

    const userId = req.get(USER_HEADER);
    if (userId) {
      if (!isId(userId) || !(await db.getTenantUserById(tenant.id, userId))) {
        return res.status(403).send("That user is not in your tenant.");
      }
      req.userId = Number(userId);
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("Auth check failed.");
  }
};

// Like requireTenant, but also requires an acting user.
// Reuses the tenant check if requireTenant already ran for this request.
const requireUser = (req, res, next) => {
  const check = () => {
    if (!req.userId) return res.status(400).send("X-User-Id header required.");
    next();
  };
  if (req.tenantId) return check();
  return requireTenant(req, res, check);
};

module.exports = {
  requireTenant,
  requireUser,
  isId,
  normalizeKey,
};
