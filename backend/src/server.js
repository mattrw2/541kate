require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const APP_PORT = process.env.APP_PORT || 8000;
const path = require("path");


const cors = require('cors')
const multer = require("multer");

// Configure Multer to save files in the 'uploads' folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, path.join(__dirname, "../database/uploads/"));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
const upload = multer({ storage });

const app = express();

// Explicit origin allowlist (wildcard is disallowed with credentials). Set
// CORS_ORIGIN to the frontend origin(s) in production.
const normalizeOrigin = (o) => o.trim().replace(/\/+$/, ""); // tolerate trailing slashes
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);
console.log("CORS allowed origins:", allowedOrigins);
app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser / same-origin requests (no Origin header).
      if (!origin) return cb(null, true);
      cb(null, allowedOrigins.includes(normalizeOrigin(origin)));
    },
    credentials: true,
  })
);

const db = require("./db");
const { requireUser, isId } = require("./middleware/tenant");

// Activities are logged as the acting user, in a challenge owned by
// the caller's tenant.
app.post("/activities", upload.single('photo'), requireUser, async (req, res) => {

  let d;
  try {
      d = JSON.parse(req.body.data);
  } catch {
      return res.status(400).send("Activity data is missing or invalid.");
  }

  const { duration, memo, date, challenge_id, lat, lng } = d;
  const photo_path = req.file ? `/${req.file.filename}` : null;
  if (!duration || !date || !challenge_id) {
      return res.status(400).send("Duration, date, and challenge ID are required.");
  }
  if (!isId(challenge_id) || !(await db.challengeInTenant(challenge_id, req.tenantId))) {
      return res.status(404).send("Challenge not found.");
  }
  try {
      const newActivity = await db.addActivity(req.userId, duration, date, memo, photo_path, challenge_id, lat, lng);
      return res.json(newActivity);
  } catch (error) {
      console.error(error);
      return res.status(500).send("An error occurred while adding an activity.");
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../database/uploads")));

// Add in our routes
const usersRouter = require("./routes/users");
const activitiesRouter = require("./routes/activities");
const challengesRouter = require("./routes/challenges");
const tenantsRouter = require("./routes/tenants");
app.use("/users", usersRouter);
app.use("/activities", activitiesRouter);
app.use("/challenges", challengesRouter);
app.use("/tenants", tenantsRouter);


/* Add in some basic error handling so our server doesn't crash if we run into
 * an error.
 */
const errorHandler = function (err, req, res, next) {
  console.error(`Your error:`);
  console.error(err);
  if (err.response?.data != null) {
    res.status(500).send(err.response.data);
  } else {
    res.status(500).send({
      error_code: "OTHER_ERROR",
      error_message: "I got some other message on the server.",
    });
  }
};
app.use(errorHandler);

// Only bind a port when run directly (`node src/server.js`); when imported by
// tests we just export the app for supertest.
if (require.main === module) {
  app.listen(APP_PORT, function () {
    console.log(`Server is up and running at http://localhost:${APP_PORT}/`);
  });
}

module.exports = app;