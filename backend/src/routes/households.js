const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { requireDevice, trustDevice, clearDeviceCookie } = require("../middleware/device");

const router = express.Router();

// Human-friendly join code, no visually ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = (len = 6) => {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
};

const uniqueCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = genCode();
    if (!(await db.getHouseholdByCode(code))) return code;
  }
  throw new Error("Could not generate a unique household code.");
};

// GET /households/me - household + profiles for the current trusted device
router.get("/me", requireDevice, async (req, res) => {
  try {
    const household = await db.getHouseholdById(req.householdId);
    const profiles = await db.getHouseholdUsers(req.householdId);
    return res.json({ household, profiles });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the household.");
  }
});

// POST /households - create an account (a household + first profile), trust this
// device. householdName is optional; for a solo signup it defaults to the name.
router.post("/", async (req, res) => {
  const { householdName, username } = req.body;
  if (!username) {
    return res.status(400).send("username is required.");
  }
  try {
    const name = (householdName && householdName.trim()) || username.trim();
    const code = await uniqueCode();
    const household = await db.createHousehold(name, code);
    const currentUser = await db.addUserToHousehold(household.id, username.trim());
    await trustDevice(res, household.id);
    const profiles = await db.getHouseholdUsers(household.id);
    return res.json({ household, profiles, currentUser });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while creating the household.");
  }
});

// POST /households/join - trust this device for an existing household (add-device / recovery)
router.post("/join", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).send("code is required.");
  }
  try {
    const household = await db.getHouseholdByCode(code.trim().toUpperCase());
    if (!household) {
      return res.status(404).send("No household found with that code.");
    }
    await trustDevice(res, household.id);
    const profiles = await db.getHouseholdUsers(household.id);
    return res.json({ household, profiles });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while joining the household.");
  }
});

// POST /households/signout - untrust this device (clear cookie + delete device)
router.post("/signout", requireDevice, async (req, res) => {
  try {
    await db.deleteDevice(req.deviceId);
    clearDeviceCookie(res);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while signing out.");
  }
});

module.exports = router;
