const { sql } = require("./config");

const paramize = (query) => {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
};

const db = {
  run: async (query, params = []) => {
    const result = await sql.unsafe(paramize(query), params);
    return {
      lastID: result?.[0]?.id ?? null,
      changes: result.count ?? 0,
    };
  },
  get: async (query, params = []) => {
    const result = await sql.unsafe(paramize(query), params);
    return result[0];
  },
  all: async (query, params = []) => {
    const result = await sql.unsafe(paramize(query), params);
    return [...result];
  },
};

const getUsers = async () => {
  return await db.all("SELECT * FROM users order by username");
};

const getUserById = async (id) => {
  return await db.get("SELECT * FROM users WHERE id = ?", [id]);
};

const runMigration = async (migration) => {
  await sql.unsafe(migration);
};

const addUser = async (username) => {
  const result = await db.run("INSERT INTO users (username) VALUES (?) RETURNING id", [username]);
  return await db.get("SELECT * FROM users WHERE id = ?", [result.lastID]);
};

const deleteUser = async (id) => {
  await db.run("DELETE FROM users WHERE id = ?", [id]);
};

const addActivity = async (user_id, duration, date, memo = "", photo_path = null, challenge_id = 1, lat = null, lng = null, is_boosted = false) => {
  const result = await db.run(
    "INSERT INTO activities (user_id, duration, memo, date, photo_path, challenge_id, lat, lng, is_boosted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
    [user_id, duration, memo, date, photo_path, challenge_id, lat, lng, !!is_boosted]
  );
  return await db.get("SELECT * FROM activities WHERE id = ?", [result.lastID]);
};

const incrementSusCount = async (id) => {
  await db.run("UPDATE activities SET sus_count = sus_count + 1 WHERE id = ?", [id]);
};

const decrementSusCount = async (id) => {
  await db.run("UPDATE activities SET sus_count = GREATEST(0, sus_count - 1) WHERE id = ?", [id]);
};

const updateActivityAddress = async (id, address) => {
  await db.run("UPDATE activities SET address = ? WHERE id = ?", [address, id]);
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
    "SELECT users.username, SUM(activities.duration) as total_duration FROM users JOIN activities ON users.id = activities.user_id GROUP BY users.id, users.username ORDER BY users.username DESC"
  );
};

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
    "INSERT INTO challenges (name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
    [name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path]
  );
  await db.run(
    "INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?) ON CONFLICT (challenge_id, user_id) DO NOTHING",
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
    "INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?) ON CONFLICT (challenge_id, user_id) DO NOTHING",
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
  const activities = await db.all(
    `SELECT a.*, u.username FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE a.challenge_id = ?
    ORDER BY a.id DESC`,
    [challenge_id]
  );
  const comments = await db.all(
    `SELECT c.*, u.username FROM activity_comments c
    JOIN activities a ON c.activity_id = a.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE a.challenge_id = ?
    ORDER BY c.created_at ASC`,
    [challenge_id]
  );
  const commentsByActivity = {};
  for (const c of comments) {
    if (!commentsByActivity[c.activity_id]) commentsByActivity[c.activity_id] = [];
    commentsByActivity[c.activity_id].push(c);
  }
  return activities.map((a) => ({ ...a, comments: commentsByActivity[a.id] || [] }));
};

const getChallengeDuration = async (challenge_id) => {
  return await db.all(
    `SELECT u.id, u.username, COALESCE(SUM(a.duration), 0) as total_duration
    FROM challenge_participants cp
    JOIN users u ON cp.user_id = u.id
    LEFT JOIN activities a ON a.user_id = u.id AND a.challenge_id = ? AND a.is_archived = FALSE
    WHERE cp.challenge_id = ?
    GROUP BY u.id, u.username
    ORDER BY total_duration DESC`,
    [challenge_id, challenge_id]
  );
};

const getPrizes = async (challenge_id) => {
  return await db.all(
    `SELECT p.*, u.username, w.username as winner_username FROM prizes p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN users w ON p.winner_user_id = w.id
    WHERE p.challenge_id = ?
    ORDER BY p.created_at DESC`,
    [challenge_id]
  );
};

const getUserPrizeForChallenge = async (challenge_id, user_id) => {
  return await db.get("SELECT id FROM prizes WHERE challenge_id = ? AND user_id = ?", [challenge_id, user_id]);
};

const addPrize = async (challenge_id, name, description, user_id) => {
  const result = await db.run(
    "INSERT INTO prizes (challenge_id, name, description, user_id) VALUES (?, ?, ?, ?) RETURNING id",
    [challenge_id, name, description, user_id]
  );
  return await db.get(
    `SELECT p.*, u.username FROM prizes p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?`,
    [result.lastID]
  );
};

const updatePrize = async (id, name, description) => {
  await db.run("UPDATE prizes SET name = ?, description = ? WHERE id = ?", [name, description, id]);
  return await db.get(
    `SELECT p.*, u.username FROM prizes p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
    [id]
  );
};

const deletePrize = async (id) => {
  await db.run("DELETE FROM prizes WHERE id = ?", [id]);
};

const claimPrize = async (prizeId, user_id) => {
  const result = await db.run(
    "UPDATE prizes SET winner_user_id = ? WHERE id = ? AND winner_user_id IS NULL AND (user_id IS NULL OR user_id != ?)",
    [user_id, prizeId, user_id]
  );
  if (result.changes === 0) {
    throw new Error("Prize cannot be claimed");
  }
  return await db.get(
    `SELECT p.*, u.username, w.username as winner_username FROM prizes p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN users w ON p.winner_user_id = w.id
    WHERE p.id = ?`,
    [prizeId]
  );
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
    "INSERT INTO activity_comments (activity_id, user_id, text, lat, lng) VALUES (?, ?, ?, ?, ?) RETURNING id",
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
  updateActivityAddress,
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
  getUserPrizeForChallenge,
  addPrize,
  updatePrize,
  deletePrize,
  claimPrize,
  getActivityComments,
  addActivityComment,
};
