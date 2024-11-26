const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/list", async (req, res) => {
    try {
        const activities = await db.listActivities();
        return res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while getting activities.");
    }
    });

router.post("/", async (req, res) => {
    const { user_id, duration, memo, date } = req.body;
    if (!user_id || !duration || !date) {
        return res.status(400).send("User ID, duration, and date are required.");
    }
    try {
        const newActivity = await db.addActivity(user_id, duration, date, memo);
        return res.json(newActivity);
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while adding an activity.");
    }
});


module.exports = router;