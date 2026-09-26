const { sql } = require("./config");
const { paramize } = require("./paramize");

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

// --- Tenants ---

const createTenant = async (name, secret_key) => {
  const result = await db.run("INSERT INTO tenants (name, secret_key) VALUES (?, ?) RETURNING id", [name, secret_key]);
  return await db.get("SELECT * FROM tenants WHERE id = ?", [result.lastID]);
};

const listTenants = async () => {
  return await db.all("SELECT id, name FROM tenants ORDER BY LOWER(name)");
};

const getTenantByName = async (name) => {
  return await db.get("SELECT * FROM tenants WHERE LOWER(name) = LOWER(?)", [name]);
};

const getTenantById = async (id) => {
  return await db.get("SELECT * FROM tenants WHERE id = ?", [id]);
};

const getTenantBySecretKey = async (secret_key) => {
  return await db.get("SELECT * FROM tenants WHERE secret_key = ?", [secret_key]);
};

const updateTenantSecretKey = async (id, secret_key) => {
  await db.run("UPDATE tenants SET secret_key = ? WHERE id = ?", [secret_key, id]);
  return await getTenantById(id);
};

const getTenantUsers = async (tenant_id) => {
  return await db.all("SELECT * FROM users WHERE tenant_id = ? ORDER BY username", [tenant_id]);
};

const getTenantUserById = async (tenant_id, id) => {
  return await db.get("SELECT * FROM users WHERE id = ? AND tenant_id = ?", [id, tenant_id]);
};

const getTenantUserByUsername = async (tenant_id, username) => {
  return await db.get("SELECT * FROM users WHERE tenant_id = ? AND username = ?", [tenant_id, username]);
};

const addUserToTenant = async (tenant_id, username) => {
  const result = await db.run(
    "INSERT INTO users (tenant_id, username) VALUES (?, ?) RETURNING id",
    [tenant_id, username]
  );
  return await db.get("SELECT * FROM users WHERE id = ?", [result.lastID]);
};

// --- Tenant scoping ---

const getChallengesForTenant = async (tenant_id) => {
  return await db.all(
    `SELECT c.*, u.username as admin_username,
      (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = c.id) as participant_count
    FROM challenges c
    LEFT JOIN users u ON c.admin_user_id = u.id
    WHERE c.tenant_id = ?
    ORDER BY c.created_at DESC`,
    [tenant_id]
  );
};

const challengeInTenant = async (challenge_id, tenant_id) => {
  return await db.get("SELECT 1 FROM challenges WHERE id = ? AND tenant_id = ?", [challenge_id, tenant_id]);
};

// An activity is visible to the tenant that owns its challenge.
const activityInTenant = async (activity_id, tenant_id) => {
  return await db.get(
    `SELECT 1 FROM activities a
    JOIN challenges c ON a.challenge_id = c.id
    WHERE a.id = ? AND c.tenant_id = ?`,
    [activity_id, tenant_id]
  );
};

const runMigration = async (migration) => {
  await sql.unsafe(migration);
};

const addActivity = async (user_id, duration, date, memo = "", photo_path = null, challenge_id, lat = null, lng = null) => {
  const result = await db.run(
    "INSERT INTO activities (user_id, duration, memo, date, photo_path, challenge_id, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
    [user_id, duration, memo, date, photo_path, challenge_id, lat, lng]
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

const getChallenge = async (id) => {
  return await db.get(
    `SELECT c.*, u.username as admin_username
    FROM challenges c
    LEFT JOIN users u ON c.admin_user_id = u.id
    WHERE c.id = ?`,
    [id]
  );
};

const createChallenge = async (tenant_id, name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path = null, unit = "minutes") => {
  const result = await db.run(
    "INSERT INTO challenges (tenant_id, name, description, goal_minutes, start_date, end_date, admin_user_id, photo_path, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
    [tenant_id, name, description ?? null, goal_minutes, start_date ?? null, end_date ?? null, admin_user_id, photo_path, unit]
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
    [challenge_id, name, description ?? null, user_id]
  );
  return await db.get(
    `SELECT p.*, u.username FROM prizes p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?`,
    [result.lastID]
  );
};

const updatePrize = async (challenge_id, id, name, description) => {
  await db.run("UPDATE prizes SET name = ?, description = ? WHERE id = ? AND challenge_id = ?", [name, description ?? null, id, challenge_id]);
  return await db.get(
    `SELECT p.*, u.username FROM prizes p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ? AND p.challenge_id = ?`,
    [id, challenge_id]
  );
};

const getPrizeSuggestions = async (challenge_id) => {
  return await db.all(
    `SELECT s.*, u.username FROM prize_suggestions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.challenge_id = ?
    ORDER BY s.created_at ASC`,
    [challenge_id]
  );
};

const addPrizeSuggestion = async (challenge_id, user_id, text) => {
  const result = await db.run(
    "INSERT INTO prize_suggestions (challenge_id, user_id, text) VALUES (?, ?, ?) RETURNING id",
    [challenge_id, user_id, text]
  );
  return await db.get(
    `SELECT s.*, u.username FROM prize_suggestions s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
    [result.lastID]
  );
};

// Only the suggester can remove their own idea.
const deletePrizeSuggestion = async (challenge_id, id, user_id) => {
  const result = await db.run(
    "DELETE FROM prize_suggestions WHERE id = ? AND challenge_id = ? AND user_id = ?",
    [id, challenge_id, user_id]
  );
  return result.changes > 0;
};

// Picking an idea as your prize uses it up.
const usePrizeSuggestion = async (challenge_id, id) => {
  await db.run("DELETE FROM prize_suggestions WHERE id = ? AND challenge_id = ?", [id, challenge_id]);
};

const claimPrize = async (challenge_id, prizeId, user_id) => {
  const result = await db.run(
    "UPDATE prizes SET winner_user_id = ? WHERE id = ? AND challenge_id = ? AND winner_user_id IS NULL AND (user_id IS NULL OR user_id != ?)",
    [user_id, prizeId, challenge_id, user_id]
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

const addActivityComment = async (activity_id, user_id, text, lat, lng) => {
  const result = await db.run(
    "INSERT INTO activity_comments (activity_id, user_id, text, lat, lng) VALUES (?, ?, ?, ?, ?) RETURNING id",
    [activity_id, user_id ?? null, text, lat ?? null, lng ?? null]
  );
  return await db.get(
    `SELECT c.*, u.username FROM activity_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?`,
    [result.lastID]
  );
};

module.exports = {
  createTenant,
  listTenants,
  getTenantByName,
  getTenantById,
  getTenantBySecretKey,
  updateTenantSecretKey,
  getTenantUsers,
  getTenantUserById,
  getTenantUserByUsername,
  addUserToTenant,
  getChallengesForTenant,
  challengeInTenant,
  activityInTenant,
  addActivity,
  updateActivityAddress,
  deleteActivity,
  runMigration,
  incrementSusCount,
  decrementSusCount,
  getChallenge,
  createChallenge,
  updateChallenge,
  getChallengeActivities,
  getPrizes,
  getUserPrizeForChallenge,
  addPrize,
  updatePrize,
  claimPrize,
  getPrizeSuggestions,
  addPrizeSuggestion,
  deletePrizeSuggestion,
  usePrizeSuggestion,
  addActivityComment,
};
