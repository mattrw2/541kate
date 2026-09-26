const express = require("express");
const db = require("../db");
const { requireTenant, isId } = require("../middleware/tenant");

const router = express.Router();

// All activity actions require a tenant key, and act only on activities in
// challenges owned by that tenant.
router.use(requireTenant);

const requireActivityInTenant = async (req, res, next) => {
    try {
        if (!isId(req.params.id) || !(await db.activityInTenant(req.params.id, req.tenantId))) {
            return res.status(404).send("Activity not found.");
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while checking access.");
    }
};

router.delete("/:id", requireActivityInTenant, async (req, res) => {
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

router.post("/:id/comments", requireActivityInTenant, async (req, res) => {
    const { id } = req.params;
    const { text, lat, lng } = req.body;
    if (!text) return res.status(400).send("Text is required.");
    try {
        // Comments are by the acting user (anonymous if none given).
        const comment = await db.addActivityComment(id, req.userId, text, lat, lng);
        return res.json(comment);
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while adding a comment.");
    }
});

router.post("/increment/:id", requireActivityInTenant, async (req, res) => {
    const { id } = req.params;
    try {
        await db.incrementSusCount(id);
        return res.send("Sus count incremented.");
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while incrementing sus count.");
    }
})

router.post("/decrement/:id", requireActivityInTenant, async (req, res) => {
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