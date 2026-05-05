/**
 * Apply pending SQL migrations from backend/migrations/.
 *
 * Each migration is a `.sql` file. Files run in lexicographic order, so name them
 * with a numeric prefix (e.g. 0001_, 0002_). Each file's name is recorded in the
 * `schema_migrations` table after it runs successfully — already-applied files
 * are skipped.
 *
 * Usage:
 *   DATABASE_URL=postgres://localhost/541kate node scripts/migrate.js
 */

const fs = require("fs");
const path = require("path");
const { sql } = require("../src/config");

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

(async () => {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const applied = new Set(
    (await sql`SELECT name FROM schema_migrations`).map((r) => r.name)
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const body = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`Applying ${file}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    ran++;
  }

  console.log(ran === 0 ? "No pending migrations." : `Applied ${ran} migration(s).`);
  await sql.end();
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
