const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const path = require("path");
const databaseFile = path.join(__dirname, "database.db");
let db;

// Set up our database
const existingDatabase = fs.existsSync(databaseFile);

const initial_users = [
    { id: "1", username: "Corbin" },
    { id: "2", username: "Kate" },
    { id: "3", username: "Matt" },
    ];

const initial_activities = [
    { id: "1", user_id: "1", duration: 30, memo: "Ran around the block", date: "2021-01-01" },
    { id: "2", user_id: "1", duration: 60, memo: "Lifted weights", date: "2021-01-02" },
];

const createUsersTableSQL =
  "CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT NOT NULL)";
const createActivityTableSQL =
  "CREATE TABLE activities (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, " +
  "duration INTEGER NOT NULL, memo TEXT, " +
  "date TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))";
  "FOREIGN KEY(user_id) REFERENCES users(id))";

dbWrapper
  .open({ filename: databaseFile, driver: sqlite3.Database })
  .then(async (dBase) => {
    db = dBase;
    try {
      if (!existingDatabase) {
        // Database doesn't exist yet -- let's create it!
        await db.run(createUsersTableSQL);
        await db.run(createActivityTableSQL);
        for (const user of initial_users) {
          await db.run("INSERT INTO users (id, username) VALUES (?, ?)", [
            user.id,
            user.username,
          ]);
        }
        for (const activity of initial_activities) {
          await db.run(
            "INSERT INTO activities (id, user_id, duration, memo, date) VALUES (?, ?, ?, ?, ?)",
            [activity.id, activity.user_id, activity.duration, activity.memo, activity.date]
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
  return await db.all("SELECT * FROM users");
};

const getActivities = async () => {
    return await db.all("SELECT * FROM activities");
};

module.exports = {
    getUsers,
    getActivities,
};
