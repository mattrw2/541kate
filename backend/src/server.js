require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
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
app.use(cookieParser());
app.use(cors())

const db = require("./db");

app.post("/activities", upload.single('photo'), async (req, res) => {

  const d = JSON.parse(req.body.data);

  const { user_id, duration, memo, date } = d;
  const photo_path = req.file ? `/${req.file.filename}` : null;
  if (!user_id || !duration || !date) {
      return res.status(400).send("User ID, duration, and date are required.");
  }
  try {
      const newActivity = await db.addActivity(user_id, duration, date, memo, photo_path);
      return res.json(newActivity);
  } catch (error) {
      console.error(error);
      return res.status(500).send("An error occurred while adding an activity.");
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../database/uploads")));

const server = app.listen(APP_PORT, function () {
  console.log(`Server is up and running at http://localhost:${APP_PORT}/`);
});

// Add in our routes
const usersRouter = require("./routes/users");
const activitiesRouter = require("./routes/activities");
app.use("/users", usersRouter);
app.use("/activities", activitiesRouter);


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