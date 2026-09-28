const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const { requireTenant, requireUser, isId } = require("../middleware/tenant");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../database/uploads/")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();

// Every challenge route requires a tenant key; challenges are visible only to the
// tenant that owns them.
router.use(requireTenant);

const requireChallengeInTenant = async (req, res, next) => {
  try {
    if (!isId(req.params.id) || !(await db.challengeInTenant(req.params.id, req.tenantId))) {
      return res.status(404).send("Challenge not found.");
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while checking access.");
  }
};
router.use("/:id", requireChallengeInTenant);

// GET / - list this tenant's challenges
router.get("/", async (req, res) => {
  try {
    const challenges = await db.getChallengesForTenant(req.tenantId);
    return res.json(challenges);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting challenges.");
  }
});

// Units a challenge can measure activity in. Set at creation and not editable,
// since existing activities are recorded in it.
const UNITS = ["minutes", "miles"];

// Parse the tapped photo focus from form fields; null if absent or invalid.
const parseFocus = (body) => {
  const x = parseFloat(body.photo_focus_x);
  const y = parseFloat(body.photo_focus_y);
  if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return null;
  return { x, y };
};

// POST / - create a challenge in this tenant, administered by the current user
router.post("/", requireUser, upload.single("photo"), async (req, res) => {
  const { name, description, goal_minutes, start_date, end_date, prize } = req.body;
  const unit = req.body.unit || "minutes";
  if (!name) {
    return res.status(400).send("Name is required.");
  }
  if (!description) {
    return res.status(400).send("Description is required.");
  }
  if (!UNITS.includes(unit)) {
    return res.status(400).send(`unit must be one of: ${UNITS.join(", ")}.`);
  }
  // No default goal: a sensible one depends on the unit (600 minutes ≠ 600 miles).
  if (!(parseFloat(goal_minutes) > 0)) {
    return res.status(400).send("A goal greater than 0 is required.");
  }
  if (!start_date) {
    return res.status(400).send("Start date is required.");
  }
  if (!end_date) {
    return res.status(400).send("End date is required.");
  }
  if (!req.file) {
    return res.status(400).send("Photo is required.");
  }
  const photo_path = `/${req.file.filename}`;
  try {
    const focus = photo_path ? parseFocus(req.body) : null;
    const challenge = await db.createChallenge(req.tenantId, name, description, goal_minutes, start_date, end_date, req.userId, photo_path, unit, focus);
    // Optional prize the creator is putting up.
    if (prize && prize.trim()) {
      await db.addPrize(challenge.id, prize.trim(), null, req.userId);
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
  // A new photo replaces the focus (null if none tapped); otherwise only update
  // the focus when one was sent (re-tapping the existing photo).
  const focus = req.file ? parseFocus(req.body) : parseFocus(req.body) ?? undefined;
  try {
    const challenge = await db.updateChallenge(id, name, description, goal_minutes, start_date, end_date, photo_path, focus);
    return res.json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating the challenge.");
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

// POST /:id/prizes - put up a prize as the current user
router.post("/:id/prizes", requireUser, async (req, res) => {
  const { id } = req.params;
  const { name, description, suggestion_id } = req.body;
  if (!name) {
    return res.status(400).send("Name is required.");
  }
  try {
    const existing = await db.getUserPrizeForChallenge(id, req.userId);
    if (existing) return res.status(400).send("You have already added a prize to this challenge.");
    const prize = await db.addPrize(id, name, description, req.userId);
    // Picked from the idea list: take that idea off the list.
    if (isId(suggestion_id)) await db.usePrizeSuggestion(id, suggestion_id);
    return res.json(prize);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding prize.");
  }
});

// PUT /:id/prizes/:prizeId
router.put("/:id/prizes/:prizeId", async (req, res) => {
  const { id, prizeId } = req.params;
  const { name, description } = req.body;
  try {
    const prize = await db.updatePrize(id, prizeId, name, description);
    if (!prize) return res.status(404).send("Prize not found.");
    return res.json(prize);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating prize.");
  }
});

// POST /:id/prizes/:prizeId/claim - claim as the current user
router.post("/:id/prizes/:prizeId/claim", requireUser, async (req, res) => {
  const { id, prizeId } = req.params;
  try {
    const prize = await db.claimPrize(id, prizeId, req.userId);
    return res.json(prize);
  } catch (error) {
    console.error(error);
    return res.status(400).send("Prize cannot be claimed.");
  }
});

// GET /:id/prize-suggestions - prize ideas anyone can pick as their prize
router.get("/:id/prize-suggestions", async (req, res) => {
  try {
    return res.json(await db.getPrizeSuggestions(req.params.id));
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting prize suggestions.");
  }
});

// POST /:id/prize-suggestions - suggest a prize anyone can choose as theirs
router.post("/:id/prize-suggestions", requireUser, async (req, res) => {
  const { id } = req.params;
  const text = (req.body.text || "").trim();
  if (!text) return res.status(400).send("text is required.");
  try {
    return res.json(await db.addPrizeSuggestion(id, req.userId, text));
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding the prize suggestion.");
  }
});

// PUT /:id/prize-suggestions/:suggestionId - edit your own suggestion
router.put("/:id/prize-suggestions/:suggestionId", requireUser, async (req, res) => {
  const { id, suggestionId } = req.params;
  const text = (req.body.text || "").trim();
  if (!text) return res.status(400).send("text is required.");
  try {
    const suggestion = isId(suggestionId) && (await db.updatePrizeSuggestion(id, suggestionId, req.userId, text));
    if (!suggestion) return res.status(404).send("Prize suggestion not found.");
    return res.json(suggestion);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating the prize suggestion.");
  }
});

// DELETE /:id/prize-suggestions/:suggestionId - remove your own idea
router.delete("/:id/prize-suggestions/:suggestionId", requireUser, async (req, res) => {
  const { id, suggestionId } = req.params;
  try {
    if (!isId(suggestionId) || !(await db.deletePrizeSuggestion(id, suggestionId, req.userId))) {
      return res.status(404).send("Prize suggestion not found.");
    }
    return res.send("Prize suggestion removed.");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while removing the prize suggestion.");
  }
});

module.exports = router;
