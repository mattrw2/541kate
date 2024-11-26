const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const users = await db.getUsers();
        console.log("Users:", users);
        return res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while getting users.");
    }
    });

module.exports = router;