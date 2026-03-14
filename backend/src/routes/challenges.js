const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../database/uploads/")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();

// GET / - list all challenges
router.get("/", async (req, res) => {
  try {
    const challenges = await db.getChallenges();
    return res.json(challenges);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting challenges.");
  }
});

// POST / - create a challenge
router.post("/", upload.single("photo"), async (req, res) => {
  const { name, description, goal_minutes, start_date, end_date, admin_user_id } = req.body;
  if (!name) {
    return res.status(400).send("Name is required.");
  }
  const photo_path = req.file ? `/${req.file.filename}` : null;
  try {
    const challenge = await db.createChallenge(name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path);
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
  try {
    const prize = await db.addPrize(id, name, description, user_id);
    return res.json(prize);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding prize.");
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

module.exports = router;
