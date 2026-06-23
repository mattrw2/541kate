const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const { requireDevice, assertUserInHousehold } = require("../middleware/device");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../database/uploads/")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();

// GET /by-token/:token - public lookup so an invite link can show the challenge
// name before the visitor has set up a device. Must stay above the guards below.
router.get("/by-token/:token", async (req, res) => {
  try {
    const challenge = await db.getChallengeByInviteToken(req.params.token);
    if (!challenge) return res.status(404).send("Invalid invite link.");
    return res.json({ id: challenge.id, name: challenge.name });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the invite.");
  }
});

// Every challenge route below requires a trusted device.
router.use(requireDevice);

// POST /redeem/:token - invite the current household to the challenge behind an
// invite link. Registered before the requireInvited guard (the whole point is
// that the household is not invited yet).
router.post("/redeem/:token", async (req, res) => {
  try {
    const challenge = await db.getChallengeByInviteToken(req.params.token);
    if (!challenge) return res.status(404).send("Invalid invite link.");
    await db.addChallengeInvite(challenge.id, req.householdId);
    return res.json({ challenge_id: challenge.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while joining the challenge.");
  }
});

// Routes scoped to a specific challenge require the household to be invited.
const requireInvited = async (req, res, next) => {
  try {
    if (!(await db.householdInvited(req.params.id, req.householdId))) {
      return res.status(403).send("Your household is not invited to this challenge.");
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while checking access.");
  }
};
router.use("/:id", requireInvited);

// GET / - list challenges this household is invited to
router.get("/", async (req, res) => {
  try {
    const challenges = await db.getChallengesForHousehold(req.householdId);
    return res.json(challenges);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting challenges.");
  }
});

// POST / - create a challenge
router.post("/", upload.single("photo"), async (req, res) => {
  const { name, description, goal_minutes, start_date, end_date, admin_user_id, prize } = req.body;
  if (!name) {
    return res.status(400).send("Name is required.");
  }
  if (!(await assertUserInHousehold(admin_user_id, req.householdId))) {
    return res.status(403).send("Invalid admin user.");
  }
  const photo_path = req.file ? `/${req.file.filename}` : null;
  try {
    const challenge = await db.createChallenge(name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path);
    // The creator's household can always see its own challenge.
    await db.addChallengeInvite(challenge.id, req.householdId);
    // Optional prize the creator is putting up.
    if (prize && prize.trim()) {
      await db.addPrize(challenge.id, prize.trim(), null, admin_user_id);
    }
    return res.json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while creating a challenge.");
  }
});

// GET /:id - get single challenge
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const challenge = await db.getChallenge(id);
    if (!challenge) {
      return res.status(404).send("Challenge not found.");
    }
    return res.json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting the challenge.");
  }
});

// PUT /:id - update a challenge
router.put("/:id", upload.single("photo"), async (req, res) => {
  const { id } = req.params;
  const { name, description, goal_minutes, start_date, end_date } = req.body;
  const photo_path = req.file ? `/${req.file.filename}` : undefined;
  try {
    const challenge = await db.updateChallenge(id, name, description, goal_minutes, start_date, end_date, photo_path);
    return res.json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating the challenge.");
  }
});

// GET /:id/participants
router.get("/:id/participants", async (req, res) => {
  const { id } = req.params;
  try {
    const participants = await db.getChallengeParticipants(id);
    return res.json(participants);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting participants.");
  }
});

// POST /:id/participants
router.post("/:id/participants", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).send("user_id is required.");
  }
  if (!(await assertUserInHousehold(user_id, req.householdId))) {
    return res.status(403).send("That user is not in your household.");
  }
  try {
    await db.addChallengeParticipant(id, user_id);
    const participants = await db.getChallengeParticipants(id);
    return res.json(participants);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding participant.");
  }
});

// DELETE /:id/participants/:userId
router.delete("/:id/participants/:userId", async (req, res) => {
  const { id, userId } = req.params;
  try {
    await db.removeChallengeParticipant(id, userId);
    return res.send("Participant removed.");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while removing participant.");
  }
});

// GET /:id/activities
router.get("/:id/activities", async (req, res) => {
  const { id } = req.params;
  try {
    const activities = await db.getChallengeActivities(id);
    const uncached = activities.filter((a) => a.lat != null && a.lng != null && !a.address);
    if (uncached.length > 0) {
      for (const activity of uncached) {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${activity.lat}&lon=${activity.lng}&format=json`, {
            headers: { "User-Agent": "541kate-exercise-app/1.0" },
          });
          if (!r.ok) continue;
          const data = await r.json();
          const a = data.address || {};
          const parts = [a.road, a.city || a.town || a.village, a.state].filter(Boolean);
          const address = parts.join(", ") || data.display_name || null;
          if (address) {
            await db.updateActivityAddress(activity.id, address);
            activity.address = address;
          }
        } catch (e) {
          console.error(`Geocoding failed for activity ${activity.id}:`, e);
        }
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }
    return res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting activities.");
  }
});

// GET /:id/duration
router.get("/:id/duration", async (req, res) => {
  const { id } = req.params;
  try {
    const duration = await db.getChallengeDuration(id);
    return res.json(duration);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting duration.");
  }
});

// GET /:id/prizes
router.get("/:id/prizes", async (req, res) => {
  const { id } = req.params;
  try {
    const prizes = await db.getPrizes(id);
    return res.json(prizes);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting prizes.");
  }
});

// POST /:id/prizes
router.post("/:id/prizes", async (req, res) => {
  const { id } = req.params;
  const { name, description, user_id } = req.body;
  if (!name) {
    return res.status(400).send("Name is required.");
  }
  if (!(await assertUserInHousehold(user_id, req.householdId))) {
    return res.status(403).send("That user is not in your household.");
  }
  try {
    const existing = await db.getUserPrizeForChallenge(id, user_id);
    if (existing) return res.status(400).send("You have already added a prize to this challenge.");
    const prize = await db.addPrize(id, name, description, user_id);
    return res.json(prize);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding prize.");
  }
});

// PUT /:id/prizes/:prizeId
router.put("/:id/prizes/:prizeId", async (req, res) => {
  const { prizeId } = req.params;
  const { name, description } = req.body;
  try {
    const prize = await db.updatePrize(prizeId, name, description);
    return res.json(prize);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating prize.");
  }
});

// POST /:id/prizes/:prizeId/claim
router.post("/:id/prizes/:prizeId/claim", async (req, res) => {
  const { prizeId } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).send("user_id is required.");
  if (!(await assertUserInHousehold(user_id, req.householdId))) {
    return res.status(403).send("That user is not in your household.");
  }
  try {
    const prize = await db.claimPrize(prizeId, user_id);
    return res.json(prize);
  } catch (error) {
    console.error(error);
    return res.status(400).send("Prize cannot be claimed.");
  }
});

// DELETE /:id/prizes/:prizeId
router.delete("/:id/prizes/:prizeId", async (req, res) => {
  const { prizeId } = req.params;
  try {
    await db.deletePrize(prizeId);
    return res.send("Prize deleted.");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while deleting prize.");
  }
});

// GET /:id/invites - households invited to this challenge
router.get("/:id/invites", async (req, res) => {
  const { id } = req.params;
  try {
    const invites = await db.getChallengeInvites(id);
    return res.json(invites);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting invites.");
  }
});

// POST /:id/invites - invite a household by its code
router.post("/:id/invites", async (req, res) => {
  const { id } = req.params;
  const { code } = req.body;
  if (!code) {
    return res.status(400).send("code is required.");
  }
  try {
    const household = await db.getHouseholdByCode(code.trim().toUpperCase());
    if (!household) {
      return res.status(404).send("No household found with that code.");
    }
    await db.addChallengeInvite(id, household.id);
    const invites = await db.getChallengeInvites(id);
    return res.json(invites);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding the invite.");
  }
});

// DELETE /:id/invites/:householdId - remove an invited household
router.delete("/:id/invites/:householdId", async (req, res) => {
  const { id, householdId } = req.params;
  try {
    await db.removeChallengeInvite(id, householdId);
    return res.send("Invite removed.");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while removing the invite.");
  }
});

module.exports = router;
