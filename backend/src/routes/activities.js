const express = require("express");
const db = require("../db");
const { requireDevice, assertUserInHousehold } = require("../middleware/device");

const router = express.Router();

// All activity actions require a trusted device.
router.use(requireDevice);

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
    const { lat, lng, deleted_by } = req.body || {};
    try {
        if (lat != null && lng != null) {
            console.log(`🗑️  Activity ${id} deleted by ${deleted_by || "unknown"} at [${lat}, ${lng}]`);
        }
        await db.deleteActivity(id);
        return res.send("Activity deleted.");
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while deleting an activity.");
    }
});

router.get("/:id/comments", async (req, res) => {
    const { id } = req.params;
    try {
        const comments = await db.getActivityComments(id);
        return res.json(comments);
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while getting comments.");
    }
});

router.post("/:id/comments", async (req, res) => {
    const { id } = req.params;
    const { user_id, text, lat, lng } = req.body;
    if (!text) return res.status(400).send("Text is required.");
    if (user_id && !(await assertUserInHousehold(user_id, req.householdId))) {
        return res.status(403).send("That user is not in your household.");
    }
    try {
        const comment = await db.addActivityComment(id, user_id, text, lat, lng);
        return res.json(comment);
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while adding a comment.");
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

router.post("/decrement/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.decrementSusCount(id);
        return res.send("Sus count decremented.");
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while decrementing sus count.");
    }
})


module.exports = router;