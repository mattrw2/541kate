# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend** (port 3000):
```bash
cd frontend
npm start        # Dev server
npm run build    # Production build → frontend/build/
npm test         # Run tests
```

**Backend** (port 8000):
```bash
cd backend
npm start        # Start server
npm run watch    # Dev mode with nodemon (auto-reload)
```

No linting is configured. No backend tests exist.

## Architecture

Full-stack app: React SPA + Express/Postgres backend. Auto-deploys to AWS Amplify on push to `master`.

**Frontend (`frontend/src/`):**
- `App.js` — React Router v6 routes
- `Shell.js` — Persistent navbar wrapper around all pages; edit here to add/remove nav items
- `pages/` — One file per page/route; create a new file here and add the route in `App.js` to add a page
- Styled with Tailwind CSS

**Backend (`backend/src/`):**
- `server.js` — Express setup, static file serving, route registration
- `db.js` — Postgres connection + runtime queries via Porsager's `postgres` package, wrapped to expose `db.run / db.get / db.all` (`?` placeholders are auto-converted to `$1, $2, …`). Does NOT manage schema.
- `routes/` — Route handlers (users, activities, challenges)

**Backend (`backend/migrations/`):**
- Numbered `.sql` files (e.g. `0001_initial_schema.sql`). Run in lexicographic order by `npm run migrate`. Applied migrations are recorded in the `schema_migrations` table; reruns are no-ops.

**Backend (`backend/scripts/`):**
- `migrate.js` — applies pending SQL migrations from `backend/migrations/` (run via `npm run migrate`)
- `migrate-from-sqlite.js` — one-shot import of legacy SQLite data into Postgres (run via `npm run migrate:sqlite`)

**Database:** Postgres, connection string in `DATABASE_URL`. Schema is managed by migration files; **run `npm run migrate` after pulling schema changes, before starting the server**. SSL is auto-enabled when the URL points at Render/Supabase/Neon/AWS. Photo uploads stored in `backend/database/uploads/` (Render persistent disk) and served as static files.

**Key schema:**
- `users` — `id`, `username` (unique)
- `activities` — `id`, `user_id` (FK), `duration`, `memo`, `date`, `photo_path`, `is_archived`, `is_boosted`, `sus_count`, `lat`, `lng`, `address`, `challenge_id`
- `challenges`, `challenge_participants`, `prizes`, `activity_comments`

Ad-hoc migrations can be applied via the `POST /users/secret` endpoint (accepts raw SQL — be careful).

## Environment

Backend reads `DATABASE_URL` (required) and `APP_PORT` (defaults to 8000) via `dotenv`. No `.env` is committed — create one locally with at least `DATABASE_URL=postgres://localhost/541kate`.
