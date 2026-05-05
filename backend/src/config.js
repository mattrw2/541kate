require("dotenv").config();
const postgres = require("postgres");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: /render\.com|amazonaws\.com|supabase|neon\.tech/.test(process.env.DATABASE_URL)
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = { sql };
