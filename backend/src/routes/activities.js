const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const activities = await db.getActivities();
        return res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while getting activities.");
    }
    });

module.exports = router;