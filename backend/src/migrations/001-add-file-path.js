const db = require("../db");

const up = async () => {
  await db.runMigration("ALTER TABLE activities ADD COLUMN photo_path TEXT");
};

const down = async () => {
    await db.runMigration("ALTER TABLE activities DROP COLUMN photo_path");
    }

module.exports = { up, down };
