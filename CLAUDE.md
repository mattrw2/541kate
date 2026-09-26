# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend** (port 3000) — built with Vite:
```bash
cd frontend
npm run dev      # Dev server (npm start is an alias)
npm run build    # Production build → frontend/build/
npm run preview  # Serve the production build locally
```
JSX lives in `.jsx` files; plain logic/util modules stay `.js`. The API base URL
comes from `import.meta.env.VITE_API_URL` (set `VITE_API_URL` in the deploy env).

**Backend** (port 8000):
```bash
cd backend
npm start        # Start server
npm run dev      # Dev mode with nodemon, restarts on file changes (npm run watch is an alias)
```

No linting is configured. No backend tests exist.

## Architecture

Full-stack app: React SPA + Express/Postgres backend. Auto-deploys to AWS Amplify on push to `master`.

**Frontend (`frontend/src/`):**
- `App.jsx` — React Router v6 routes
- `Shell.jsx` — Persistent navbar wrapper around all pages; edit here to add/remove nav items
- `pages/` — One file per page/route; create a new `.jsx` file here and add the route in `App.jsx` to add a page
- Styled with Tailwind CSS

**Backend (`backend/src/`):**
- `server.js` — Express setup, static file serving, route registration
- `db.js` — Postgres connection + runtime queries via Porsager's `postgres` package, wrapped to expose `db.run / db.get / db.all` (`?` placeholders are auto-converted to `$1, $2, …`). Does NOT manage schema.
- `routes/` — Route handlers (tenants, users, activities, challenges)
- `middleware/tenant.js` — Auth. Every request (except creating/joining a tenant) sends the tenant's secret key in `X-Tenant-Key`; the acting user goes in `X-User-Id`. Any user in a tenant may act as any other user in it, so the user id is only checked for tenant membership. All reads/writes are scoped to that tenant.

**Backend (`backend/migrations/`):**
- Numbered `.sql` files (e.g. `0001_initial_schema.sql`). Run in lexicographic order by `npm run migrate`. Applied migrations are recorded in the `schema_migrations` table; reruns are no-ops.

**Backend (`backend/scripts/`):**
- `migrate.js` — applies pending SQL migrations from `backend/migrations/` (run via `npm run migrate`)
- `migrate-from-sqlite.js` — one-shot import of legacy SQLite data into Postgres (run via `npm run migrate:sqlite`)

**Database:** Postgres, connection string in `DATABASE_URL`. Schema is managed by migration files; **run `npm run migrate` after pulling schema changes, before starting the server**. SSL is auto-enabled when the URL points at Render/Supabase/Neon/AWS. Photo uploads stored in `backend/database/uploads/` (Render persistent disk) and served as static files.

**Key schema:**
- `tenants` — `id`, `name`, `secret_key` (unique; shared by all the tenant's users, used to invite others)
- `users` — `id`, `tenant_id` (FK), `username` (unique per tenant)
- `challenges` — belong to one tenant via `tenant_id`; `unit` is `minutes` or `miles` (set at creation). `goal_minutes` and `activities.duration` keep their names but hold amounts in the challenge's unit (decimals allowed). Frontend unit labels/formatting live in `frontend/src/units.js`.
- `activities` — `id`, `user_id` (FK), `duration`, `memo`, `date`, `photo_path`, `is_archived`, `is_boosted`, `sus_count`, `lat`, `lng`, `address`, `challenge_id`
- `prizes` — one per user per challenge; `prize_suggestions` — ideas posted by users who already added a prize, removed when someone picks one as their prize
- `challenge_participants`, `activity_comments`

Ad-hoc migrations can be applied via the `POST /users/secret` endpoint (accepts raw SQL — be careful).

## Environment

Backend reads `DATABASE_URL` (required) and `APP_PORT` (defaults to 8000) via `dotenv`. No `.env` is committed — create one locally with at least `DATABASE_URL=postgres://localhost/541kate`.
