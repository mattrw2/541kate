import { defineConfig } from "vitest/config"

// Importing the app pulls in db/config, which require DATABASE_URL. The Postgres
// client connects lazily, so a dummy URL is enough for route tests that only hit
// auth/validation paths (which return before any query runs).
process.env.DATABASE_URL ??= "postgres://localhost:5432/test_541kate"

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
  },
})
