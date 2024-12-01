const express = require("express")
const db = require("../db")

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const users = await db.getUsers()
    console.log("Users:", users)
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

router.post("/", async (req, res) => {
  const { username } = req.body
  if (!username) {
    return res.status(400).send("Username is required.")
  }
  try {
    const newUser = await db.addUser(username)
    console.log("New user:", newUser)
    return res.json(newUser)
  } catch (error) {
    console.error(error)
    return res.status(500).send("An error occurred while adding a user.")
  }
})

module.exports = router
