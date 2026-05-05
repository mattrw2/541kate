/**
 * One-shot migration: copies data from a SQLite file into a Postgres DB.
 *
 * Usage:
 *   SQLITE_PATH=./database/database.db DATABASE_URL=postgres://localhost/541kate \
 *     node scripts/migrate-from-sqlite.js
 *
 * Assumes Postgres tables already exist (start the server once first to run init).
 * Truncates the target Postgres tables before copying. Preserves source IDs.
 */

const path = require("path");
const sqlite3 = require("sqlite3");
const sqliteOpen = require("sqlite").open;
const { sql: pg } = require("../src/config");

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, "../database/database.db");

const toBool = (v) => v === 1 || v === true || v === "1" || v === "true";
const n = (v) => (v === "" || v === undefined ? null : v);
const toInt = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const num = Number(v);
  return Number.isFinite(num) ? Math.round(num) : null;
};

(async () => {
  console.log(`Opening SQLite at ${SQLITE_PATH}`);
  const sqlite = await sqliteOpen({ filename: SQLITE_PATH, driver: sqlite3.Database });

  // Order matters for FK constraints
  const order = [
    "users",
    "challenges",
    "challenge_participants",
    "activities",
    "prizes",
    "activity_comments",
  ];

  console.log("Truncating Postgres target tables");
  await pg.unsafe(`TRUNCATE ${order.slice().reverse().join(", ")} RESTART IDENTITY CASCADE`);

  const validUserIds = new Set();
  const validChallengeIds = new Set();
  const validActivityIds = new Set();
  const fkOrNull = (id, set) => (id != null && set.has(id) ? id : null);

  let skipped = { participants: 0, activities: 0, prizes: 0, comments: 0 };

  // users
  const users = await sqlite.all("SELECT id, username FROM users");
  console.log(`users: ${users.length}`);
  for (const u of users) {
    await pg`INSERT INTO users (id, username) VALUES (${u.id}, ${u.username})`;
    validUserIds.add(u.id);
  }

  // challenges
  const challenges = await sqlite.all(
    "SELECT id, name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path, created_at FROM challenges"
  );
  console.log(`challenges: ${challenges.length}`);
  for (const c of challenges) {
    const adminId = fkOrNull(toInt(c.admin_user_id), validUserIds);
    await pg`
      INSERT INTO challenges (id, name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path, created_at)
      VALUES (${c.id}, ${c.name}, ${n(c.description)}, ${toInt(c.goal_minutes)}, ${n(c.start_date)}, ${n(c.end_date)}, ${adminId}, ${n(c.photo_path)}, ${c.created_at || new Date()})
    `;
    validChallengeIds.add(c.id);
  }

  // challenge_participants — required FKs; skip rows that don't resolve
  const participants = await sqlite.all(
    "SELECT id, challenge_id, user_id FROM challenge_participants"
  );
  console.log(`challenge_participants: ${participants.length}`);
  for (const p of participants) {
    if (!validChallengeIds.has(p.challenge_id) || !validUserIds.has(p.user_id)) {
      skipped.participants++;
      continue;
    }
    await pg`INSERT INTO challenge_participants (id, challenge_id, user_id) VALUES (${p.id}, ${p.challenge_id}, ${p.user_id})`;
  }

  // activities — user_id is nullable FK; skip if user_id missing AND we want to keep referential integrity strict.
  // Here: null out missing user_id so the row survives.
  const activities = await sqlite.all(
    "SELECT id, user_id, duration, memo, date, photo_path, sus_count, IS_ARCHIVED, challenge_id, is_boosted, lat, lng, address FROM activities"
  );
  console.log(`activities: ${activities.length}`);
  for (const a of activities) {
    const userId = fkOrNull(toInt(a.user_id), validUserIds);
    await pg`
      INSERT INTO activities (id, user_id, duration, memo, date, photo_path, sus_count, is_archived, challenge_id, is_boosted, lat, lng, address)
      VALUES (${a.id}, ${userId}, ${toInt(a.duration) ?? 0}, ${n(a.memo)}, ${a.date}, ${n(a.photo_path)}, ${toInt(a.sus_count) ?? 0}, ${toBool(a.IS_ARCHIVED)}, ${toInt(a.challenge_id) ?? 1}, ${toBool(a.is_boosted)}, ${n(a.lat)}, ${n(a.lng)}, ${n(a.address)})
    `;
    validActivityIds.add(a.id);
  }

  // prizes — challenge_id required; user_id and winner_user_id nullable
  const prizeCols = await sqlite.all("PRAGMA table_info(prizes)");
  const hasWinner = prizeCols.some((c) => c.name === "winner_user_id");
  const prizeQuery = hasWinner
    ? "SELECT id, challenge_id, name, description, user_id, winner_user_id, created_at FROM prizes"
    : "SELECT id, challenge_id, name, description, user_id, created_at FROM prizes";
  const prizes = await sqlite.all(prizeQuery);
  console.log(`prizes: ${prizes.length}`);
  for (const p of prizes) {
    const challengeId = toInt(p.challenge_id);
    if (!validChallengeIds.has(challengeId)) {
      skipped.prizes++;
      continue;
    }
    const userId = fkOrNull(toInt(p.user_id), validUserIds);
    const winnerUserId = hasWinner ? fkOrNull(toInt(p.winner_user_id), validUserIds) : null;
    await pg`
      INSERT INTO prizes (id, challenge_id, name, description, user_id, winner_user_id, created_at)
      VALUES (${p.id}, ${challengeId}, ${p.name}, ${n(p.description)}, ${userId}, ${winnerUserId}, ${p.created_at || new Date()})
    `;
  }

  // activity_comments — activity_id required FK; user_id nullable
  const comments = await sqlite.all(
    "SELECT id, activity_id, user_id, text, lat, lng, created_at FROM activity_comments"
  );
  console.log(`activity_comments: ${comments.length}`);
  for (const c of comments) {
    const activityId = toInt(c.activity_id);
    if (!validActivityIds.has(activityId)) {
      skipped.comments++;
      continue;
    }
    const userId = fkOrNull(toInt(c.user_id), validUserIds);
    await pg`
      INSERT INTO activity_comments (id, activity_id, user_id, text, lat, lng, created_at)
      VALUES (${c.id}, ${activityId}, ${userId}, ${c.text}, ${n(c.lat)}, ${n(c.lng)}, ${c.created_at || new Date()})
    `;
  }

  if (Object.values(skipped).some((v) => v > 0)) {
    console.log("Skipped orphan rows:", skipped);
  }

  // Reset sequences to MAX(id) + 1 so future inserts don't collide
  console.log("Resetting sequences");
  for (const table of order) {
    await pg.unsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`
    );
  }

  await sqlite.close();
  await pg.end();
  console.log("Migration complete.");
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
