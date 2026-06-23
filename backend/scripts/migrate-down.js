/**
 * Roll back the most recently applied migration(s).
 *
 * For a migration `0003_foo.sql`, its rollback SQL lives in `0003_foo.down.sql`.
 * Each down script runs in a transaction; on success its row is removed from
 * `schema_migrations` so it can be re-applied later with `npm run migrate`.
 *
 * Usage:
 *   npm run migrate:down        # roll back the latest applied migration
 *   npm run migrate:down -- 2   # roll back the latest 2
 */

const fs = require("fs");
const path = require("path");
const { sql } = require("../src/config");

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

(async () => {
  const steps = Math.max(1, parseInt(process.argv[2], 10) || 1);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Most recently applied first (lexicographic name matches apply order).
  const applied = (await sql`SELECT name FROM schema_migrations ORDER BY name DESC`).map((r) => r.name);
  if (applied.length === 0) {
    console.log("No applied migrations to roll back.");
    await sql.end();
    return;
  }

  const targets = applied.slice(0, steps);
  let rolled = 0;
  for (const name of targets) {
    const downFile = name.replace(/\.sql$/, ".down.sql");
    const downPath = path.join(MIGRATIONS_DIR, downFile);
    if (!fs.existsSync(downPath)) {
      console.error(`No down migration for ${name} (expected ${downFile}). Stopping.`);
      break;
    }
    const body = fs.readFileSync(downPath, "utf8");
    console.log(`Rolling back ${name}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`DELETE FROM schema_migrations WHERE name = ${name}`;
    });
    rolled++;
  }

  console.log(rolled === 0 ? "Nothing rolled back." : `Rolled back ${rolled} migration(s).`);
  await sql.end();
})().catch((err) => {
  console.error("Rollback failed:", err);
  process.exit(1);
});
