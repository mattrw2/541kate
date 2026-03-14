const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const path = require("path");
const databaseFile = path.join(__dirname, "../database/database.db");
let db;

const data = require("./data.json");

// Set up our database
const existingDatabase = fs.existsSync(databaseFile);

// populate initial users from data.json and filter out duplicates
const initial_users = data.map((activities) => {
  return { id: activities.user_id, username: activities.username };
}).filter((user, index, self) => self.findIndex((t) => t.id === user.id) === index).sort((a, b) => a.id - b.id);

const initial_activities = data.map((activity) => {
  return {
    user_id: activity.user_id,
    duration: activity.duration,
    memo: activity.memo,
    date: activity.date,
  };
});

const createUsersTableSQL =
  "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE)";
const createActivityTableSQL =
  "CREATE TABLE activities (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, " +
  "duration INTEGER NOT NULL, memo TEXT, " +
  "date TEXT NOT NULL, photo_path TEXT, sus_count INTEGER DEFAULT 0, IS_ARCHIVED INTEGER DEFAULT 0, challenge_id INTEGER DEFAULT 1, FOREIGN KEY(user_id) REFERENCES users(id))";
const createChallengesTableSQL =
  "CREATE TABLE challenges (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, goal_minutes INTEGER DEFAULT 600, start_date TEXT, end_date TEXT, admin_user_id INTEGER, photo_path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(admin_user_id) REFERENCES users(id))";
const createChallengeParticipantsTableSQL =
  "CREATE TABLE challenge_participants (id INTEGER PRIMARY KEY AUTOINCREMENT, challenge_id INTEGER NOT NULL, user_id INTEGER NOT NULL, UNIQUE(challenge_id, user_id), FOREIGN KEY(challenge_id) REFERENCES challenges(id), FOREIGN KEY(user_id) REFERENCES users(id))";
const createPrizesTableSQL =
  "CREATE TABLE prizes (id INTEGER PRIMARY KEY AUTOINCREMENT, challenge_id INTEGER NOT NULL, name TEXT NOT NULL, description TEXT, user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(challenge_id) REFERENCES challenges(id), FOREIGN KEY(user_id) REFERENCES users(id))";
const createActivityCommentsTableSQL =
  "CREATE TABLE activity_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, activity_id INTEGER NOT NULL, user_id INTEGER, text TEXT NOT NULL, lat REAL, lng REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(activity_id) REFERENCES activities(id), FOREIGN KEY(user_id) REFERENCES users(id))";

dbWrapper
  .open({ filename: databaseFile, driver: sqlite3.Database })
  .then(async (dBase) => {
    db = dBase;
    try {
      if (!existingDatabase) {
        await db.run("PRAGMA foreign_keys = ON");
        await db.run(createUsersTableSQL);
        await db.run(createActivityTableSQL);
        await db.run(createChallengesTableSQL);
        await db.run(createChallengeParticipantsTableSQL);
        await db.run(createPrizesTableSQL);
        await db.run(createActivityCommentsTableSQL);

        for (const user of initial_users) {
          await db.run("INSERT INTO users (username) VALUES (?)", [
            user.username,
          ]);
        }

        // Seed challenge 1 with first user as admin
        const firstUser = await db.get("SELECT * FROM users LIMIT 1");
        await db.run(
          "INSERT INTO challenges (name, description, goal_minutes, admin_user_id) VALUES (?, ?, ?, ?)",
          ["Christmas Sweaters", "Christmas Sweaters challenge", 600, firstUser.id]
        );

        // Add all users as participants of challenge 1
        const allUsers = await db.all("SELECT * FROM users");
        for (const user of allUsers) {
          await db.run(
            "INSERT OR IGNORE INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)",
            [1, user.id]
          );
        }

        for (const activity of initial_activities) {
          await db.run(
            "INSERT INTO activities (user_id, duration, memo, date, challenge_id) VALUES (?, ?, ?, ?, ?)",
            [activity.user_id, activity.duration, activity.memo, activity.date, 1]
          );
        }
      } else {
        // Avoids a rare bug where the database gets created, but the tables don't
        const tableNames = await db.all(
          "SELECT name FROM sqlite_master WHERE type='table'"
        );
        const existingTableNames = tableNames.map((t) => t.name);

        const tableNamesToCreationSQL = {
          users: createUsersTableSQL,
          activities: createActivityTableSQL,
        };
        for (const [tableName, creationSQL] of Object.entries(
          tableNamesToCreationSQL
        )) {
          if (!existingTableNames.includes(tableName)) {
            console.log(`Creating ${tableName} table`);
            await db.run(creationSQL);
          }
        }

        // Check and create challenges table
        let challengesCreated = false;
        if (!existingTableNames.includes("challenges")) {
          console.log("Creating challenges table");
          await db.run(createChallengesTableSQL);
          challengesCreated = true;
        }

        // Check and create challenge_participants table
        let participantsCreated = false;
        if (!existingTableNames.includes("challenge_participants")) {
          console.log("Creating challenge_participants table");
          await db.run(createChallengeParticipantsTableSQL);
          participantsCreated = true;
        }

        // Check and create prizes table
        if (!existingTableNames.includes("prizes")) {
          console.log("Creating prizes table");
          await db.run(createPrizesTableSQL);
        }

        // Check and add photo_path to challenges
        const challengeColumns = await db.all("PRAGMA table_info(challenges)");
        if (!challengeColumns.map((c) => c.name).includes("photo_path")) {
          console.log("Adding photo_path column to challenges");
          await db.run("ALTER TABLE challenges ADD COLUMN photo_path TEXT");
        }

        // Check and create activity_comments table
        if (!existingTableNames.includes("activity_comments")) {
          console.log("Creating activity_comments table");
          await db.run(createActivityCommentsTableSQL);
        }

        // Seed challenge 1 if challenges table was just created
        if (challengesCreated) {
          const firstUser = await db.get("SELECT * FROM users LIMIT 1");
          await db.run(
            "INSERT INTO challenges (name, description, goal_minutes, admin_user_id) VALUES (?, ?, ?, ?)",
            ["Christmas Sweaters", "Christmas Sweaters challenge", 600, firstUser ? firstUser.id : null]
          );
        }

        // Add all users as participants of challenge 1 if participants table was just created
        if (participantsCreated) {
          const allUsers = await db.all("SELECT * FROM users");
          for (const user of allUsers) {
            await db.run(
              "INSERT OR IGNORE INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)",
              [1, user.id]
            );
          }
        }

        // Check and ALTER TABLE activities to add missing columns
        const activityColumns = await db.all("PRAGMA table_info(activities)");
        const existingColumns = activityColumns.map((c) => c.name);

        if (!existingColumns.includes("photo_path")) {
          console.log("Adding photo_path column to activities");
          await db.run("ALTER TABLE activities ADD COLUMN photo_path TEXT");
        }
        if (!existingColumns.includes("sus_count")) {
          console.log("Adding sus_count column to activities");
          await db.run("ALTER TABLE activities ADD COLUMN sus_count INTEGER DEFAULT 0");
        }
        if (!existingColumns.includes("IS_ARCHIVED")) {
          console.log("Adding IS_ARCHIVED column to activities");
          await db.run("ALTER TABLE activities ADD COLUMN IS_ARCHIVED INTEGER DEFAULT 0");
        }
        if (!existingColumns.includes("challenge_id")) {
          console.log("Adding challenge_id column to activities");
          await db.run("ALTER TABLE activities ADD COLUMN challenge_id INTEGER DEFAULT 1");
        }
        if (!existingColumns.includes("lat")) {
          console.log("Adding lat column to activities");
          await db.run("ALTER TABLE activities ADD COLUMN lat REAL");
        }
        if (!existingColumns.includes("lng")) {
          console.log("Adding lng column to activities");
          await db.run("ALTER TABLE activities ADD COLUMN lng REAL");
        }

        console.log("Database is up and running!");
        sqlite3.verbose();
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

const getUsers = async () => {
  return await db.all("SELECT * FROM users order by username");
};

const getUserById = async (id) => {
  return await db.get("SELECT * FROM users WHERE id = ?", [id]);
};

const runMigration = async (migration) => {
  await db.run(migration);
};

const addUser = async (username) => {
  const result = await db.run("INSERT INTO users (username) VALUES (?)", [username]);
  const newUser = await db.get("SELECT * FROM users WHERE id = ?", [result.lastID]);
  return newUser;
};

const deleteUser = async (id) => {
  await db.run("DELETE FROM users WHERE id = ?", [id]);
};

const addActivity = async (user_id, duration, date, memo = "", photo_path = null, challenge_id = 1, lat = null, lng = null) => {
  const result = await db.run(
    "INSERT INTO activities (user_id, duration, memo, date, photo_path, challenge_id, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [user_id, duration, memo, date, photo_path, challenge_id, lat, lng]
  );
  const newActivity = await db.get("SELECT * FROM activities WHERE id = ?", [result.lastID]);
  return newActivity;
};

const incrementSusCount = async (id) => {
  await db.run("UPDATE activities SET sus_count = sus_count + 1 WHERE id = ?", [id]);
};

const decrementSusCount = async (id) => {
  await db.run("UPDATE activities SET sus_count = MAX(0, sus_count - 1) WHERE id = ?", [id]);
};

const deleteActivity = async (id) => {
  await db.run("DELETE FROM activities WHERE id = ?", [id]);
};

const listActivities = async () => {
  return await db.all(
    "SELECT a.*, u.username FROM activities a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC"
  );
};

const listUsersByDuration = async () => {
  return await db.all(
    "SELECT users.username, SUM(activities.duration) as total_duration FROM users JOIN activities ON users.id = activities.user_id GROUP BY users.id ORDER BY users.username DESC"
  );
};

// Challenge functions
const getChallenges = async () => {
  return await db.all(
    `SELECT c.*, u.username as admin_username,
      (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = c.id) as participant_count
    FROM challenges c
    LEFT JOIN users u ON c.admin_user_id = u.id
    ORDER BY c.created_at DESC`
  );
};

const getChallenge = async (id) => {
  return await db.get(
    `SELECT c.*, u.username as admin_username
    FROM challenges c
    LEFT JOIN users u ON c.admin_user_id = u.id
    WHERE c.id = ?`,
    [id]
  );
};

const createChallenge = async (name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path = null) => {
  const result = await db.run(
    "INSERT INTO challenges (name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path]
  );
  // Auto-add admin as participant
  await db.run(
    "INSERT OR IGNORE INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)",
    [result.lastID, admin_user_id]
  );
  return await getChallenge(result.lastID);
};

const updateChallenge = async (id, name, description, goal_minutes, start_date, end_date, photo_path) => {
  if (photo_path !== undefined) {
    await db.run(
      "UPDATE challenges SET name = ?, description = ?, goal_minutes = ?, start_date = ?, end_date = ?, photo_path = ? WHERE id = ?",
      [name, description, goal_minutes, start_date, end_date, photo_path, id]
    );
  } else {
    await db.run(
      "UPDATE challenges SET name = ?, description = ?, goal_minutes = ?, start_date = ?, end_date = ? WHERE id = ?",
      [name, description, goal_minutes, start_date, end_date, id]
    );
  }
  return await getChallenge(id);
};

const getChallengeParticipants = async (challenge_id) => {
  return await db.all(
    `SELECT u.* FROM challenge_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.challenge_id = ?
    ORDER BY u.username`,
    [challenge_id]
  );
};

const addChallengeParticipant = async (challenge_id, user_id) => {
  await db.run(
    "INSERT OR IGNORE INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)",
    [challenge_id, user_id]
  );
};

const removeChallengeParticipant = async (challenge_id, user_id) => {
  await db.run(
    "DELETE FROM challenge_participants WHERE challenge_id = ? AND user_id = ?",
    [challenge_id, user_id]
  );
};

const getChallengeActivities = async (challenge_id) => {
  return await db.all(
    `SELECT a.*, u.username FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE a.challenge_id = ?
    ORDER BY a.date DESC, a.id DESC`,
    [challenge_id]
  );
};

const getChallengeDuration = async (challenge_id) => {
  return await db.all(
    `SELECT u.id, u.username, COALESCE(SUM(a.duration), 0) as total_duration
    FROM challenge_participants cp
    JOIN users u ON cp.user_id = u.id
    LEFT JOIN activities a ON a.user_id = u.id AND a.challenge_id = ? AND (a.IS_ARCHIVED IS NULL OR a.IS_ARCHIVED = 0)
    WHERE cp.challenge_id = ?
    GROUP BY u.id, u.username
    ORDER BY total_duration DESC`,
    [challenge_id, challenge_id]
  );
};

const getPrizes = async (challenge_id) => {
  return await db.all(
    `SELECT p.*, u.username FROM prizes p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.challenge_id = ?
    ORDER BY p.created_at DESC`,
    [challenge_id]
  );
};

const addPrize = async (challenge_id, name, description, user_id) => {
  const result = await db.run(
    "INSERT INTO prizes (challenge_id, name, description, user_id) VALUES (?, ?, ?, ?)",
    [challenge_id, name, description, user_id]
  );
  return await db.get(
    `SELECT p.*, u.username FROM prizes p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?`,
    [result.lastID]
  );
};

const deletePrize = async (id) => {
  await db.run("DELETE FROM prizes WHERE id = ?", [id]);
};

const getActivityComments = async (activity_id) => {
  return await db.all(
    `SELECT c.*, u.username FROM activity_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.activity_id = ?
    ORDER BY c.created_at ASC`,
    [activity_id]
  );
};

const addActivityComment = async (activity_id, user_id, text, lat, lng) => {
  const result = await db.run(
    "INSERT INTO activity_comments (activity_id, user_id, text, lat, lng) VALUES (?, ?, ?, ?, ?)",
    [activity_id, user_id, text, lat, lng]
  );
  return await db.get(
    `SELECT c.*, u.username FROM activity_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?`,
    [result.lastID]
  );
};

module.exports = {
  getUsers,
  getUserById,
  listActivities,
  addUser,
  listUsersByDuration,
  addActivity,
  deleteActivity,
  deleteUser,
  runMigration,
  incrementSusCount,
  decrementSusCount,
  getChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  getChallengeParticipants,
  addChallengeParticipant,
  removeChallengeParticipant,
  getChallengeActivities,
  getChallengeDuration,
  getPrizes,
  addPrize,
  deletePrize,
  getActivityComments,
  addActivityComment,
};
