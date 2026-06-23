const crypto = require("crypto");
const db = require("../db");

const COOKIE_NAME = "device_token";
const isProd = process.env.NODE_ENV === "production";

// Random 256-bit device token. The raw token lives only in the cookie; we store
// its sha256 hash in the DB so a DB leak can't be replayed as a session.
const newDeviceToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  // Frontend (Amplify) and backend (Render) are different domains in prod, so
  // the cookie must be cross-site; SameSite=None requires Secure.
  sameSite: isProd ? "none" : "lax",
  maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // ~10 years
  path: "/",
});

const setDeviceCookie = (res, token) => res.cookie(COOKIE_NAME, token, cookieOptions());

const clearDeviceCookie = (res) =>
  res.clearCookie(COOKIE_NAME, { path: "/", sameSite: isProd ? "none" : "lax", secure: isProd });

// Issue a fresh trusted-device token for a household and set the cookie.
const trustDevice = async (res, householdId, label = null) => {
  const token = newDeviceToken();
  await db.addDevice(householdId, hashToken(token), label);
  setDeviceCookie(res, token);
};

// Gate a route on a known device cookie. Attaches req.householdId / req.deviceId.
const requireDevice = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).send("No trusted device.");
  try {
    const device = await db.getDeviceByTokenHash(hashToken(token));
    if (!device) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(401).send("Unknown device.");
    }
    req.householdId = device.household_id;
    req.deviceId = device.id;
    db.touchDevice(device.id).catch(() => {});
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("Auth check failed.");
  }
};

// Light write-side guard: a request may only act as a user in its own household.
const assertUserInHousehold = async (userId, householdId) => {
  if (!userId) return false;
  return !!(await db.userInHousehold(userId, householdId));
};

module.exports = {
  requireDevice,
  trustDevice,
  clearDeviceCookie,
  assertUserInHousehold,
};
