const express = require("express")
const db = require("../db")
const { requireTenant } = require("../middleware/tenant")

const router = express.Router()

// Scoped to the caller's tenant.
router.use(requireTenant)

router.post("/", async (req, res) => {
  const { username } = req.body
  if (!username || !username.trim()) {
    return res.status(400).send("Username is required.")
  }
  try {
    const newUser = await db.addUserToTenant(req.tenantId, username.trim())
    return res.json(newUser)
  } catch (error) {
    console.error(error)
    return res.status(500).send("An error occurred while adding a user.")
  }
})

module.exports = router
