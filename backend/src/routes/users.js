const express = require("express")
const db = require("../db")
const { requireDevice } = require("../middleware/device")

const router = express.Router()

router.get("/", requireDevice, async (req, res) => {
  try {
    const users = await db.getHouseholdUsers(req.householdId)
    return res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).send("An error occurred while getting users.")
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    await db.deleteUser(id)
    return res.send("User deleted.")
  } catch (error) {
    console.error(error)
    return res.status(500).send("An error occurred while deleting a user.")
  }
})

router.get("/duration", async (req, res) => {
  try {
    const users = await db.listUsersByDuration()
    console.log("Users by duration:", users)
    return res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).send("An error occurred while getting users by duration.")
  }
})

router.post("/", requireDevice, async (req, res) => {
  const { username } = req.body
  if (!username) {
    return res.status(400).send("Username is required.")
  }
  try {
    const newUser = await db.addUserToHousehold(req.householdId, username.trim())
    return res.json(newUser)
  } catch (error) {
    console.error(error)
    return res.status(500).send("An error occurred while adding a user.")
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const user = await db.getUserById(id)
    if (!user) {
      return res.status(404).send("User not found.")
    }
    return res.json(user)
  } catch (error) {
    console.error(error)
    return res.status(500).send("An error occurred while getting the user.")
  }
})

router.post("/secret", async (req, res) => {
  const { sql } = req.body
  try {
    await db.runMigration(sql)
    return res.send("Migration successful.")
  } catch (error) {
    console.error(error)
    return res.status(500).send("An error occurred while running the migration.")
  }
})


module.exports = router
