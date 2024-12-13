const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const path = require("path");
const databaseFile = path.join(__dirname, "../database/database.db");
let db;

const data = require("./data.json");

// create the uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../database/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

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
  "date TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))";

dbWrapper
  .open({ filename: databaseFile, driver: sqlite3.Database })
  .then(async (dBase) => {
    db = dBase;
    try {
      if (!existingDatabase) {
        await db.run("PRAGMA foreign_keys = ON");
        await db.run(createUsersTableSQL);
        await db.run(createActivityTableSQL);
        for (const user of initial_users) {
          await db.run("INSERT INTO users (username) VALUES (?)", [
            user.username,
          ]);
        }
        for (const activity of initial_activities) {
          await db.run(
            "INSERT INTO activities (user_id, duration, memo, date) VALUES (?, ?, ?, ?)",
            [activity.user_id, activity.duration, activity.memo, activity.date]
          );
        }
      } else {

        // Avoids a rare bug where the database gets created, but the tables don't
        const tableNames = await db.all(
          "SELECT name FROM sqlite_master WHERE type='table'"
        );
        const tableNamesToCreationSQL = {
          users: createUsersTableSQL,
        activities: createActivityTableSQL,
        };
        for (const [tableName, creationSQL] of Object.entries(
          tableNamesToCreationSQL
        )) {
          if (!tableNames.some((table) => table.name === tableName)) {
            console.log(`Creating ${tableName} table`);
            await db.run(creationSQL);
          }
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

const runMigration = async (migration) => {
  await db.run(migration);
}

const addUser = async (username) => {
  const result =  await db.run("INSERT INTO users (username) VALUES (?)", [username]);
  const newUser = await db.get("SELECT * FROM users WHERE id = ?", [result.lastID]);
  return newUser;
};

const deleteUser = async (id) => {
  await db.run("DELETE FROM users WHERE id = ?", [id]);
}

const addActivity = async (user_id, duration, date, memo="", photo_path=null) => {
    const result = await db.run("INSERT INTO activities (user_id, duration, memo, date, photo_path) VALUES (?, ?, ?, ?, ?)", [user_id, duration, memo, date, photo_path]);
    const newActivity = await db.get("SELECT * FROM activities WHERE id = ?", [result.lastID]);
    return newActivity;
}

const incrementSusCount = async (id) => {
    await db.run("UPDATE activities SET sus_count = sus_count + 1 WHERE id = ?", [id]);
} 

const deleteActivity = async (id) => {
    await db.run("DELETE FROM activities WHERE id = ?", [id]);
}

const listActivities = async () => {
    return await db.all("SELECT a.*, u.username FROM activities a JOIN users u ON a.user_id = u.id order by a.date desc");
};

const listUsersByDuration = async () => {
    return await db.all("SELECT users.username, SUM(activities.duration) as total_duration FROM users JOIN activities ON users.id = activities.user_id GROUP BY users.id ORDER BY users.username DESC");
};

module.exports = {
    getUsers,
    listActivities,
    addUser,
    listUsersByDuration,
    addActivity,
    deleteActivity,
    deleteUser,
    runMigration,
    incrementSusCount,
};
