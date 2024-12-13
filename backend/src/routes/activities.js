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

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.deleteActivity(id);
        return res.send("Activity deleted.");
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while deleting an activity.");
    }
});

router.post("/increment/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.incrementSusCount(id);
        return res.send("Sus count incremented.");
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while incrementing sus count.");
    }
})


module.exports = router;