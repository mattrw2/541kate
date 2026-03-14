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

Full-stack app: React SPA + Express/SQLite backend. Auto-deploys to AWS Amplify on push to `master`.

**Frontend (`frontend/src/`):**
- `App.js` — React Router v6 routes
- `Shell.js` — Persistent navbar wrapper around all pages; edit here to add/remove nav items
- `pages/` — One file per page/route; create a new file here and add the route in `App.js` to add a page
- Styled with Tailwind CSS

**Backend (`backend/src/`):**
- `server.js` — Express setup, static file serving, route registration
- `db.js` — All SQLite queries via the `sqlite`/`sqlite3` packages
- `routes/` — Route handlers (users, activities)
- `data.json` — Seed data loaded on first run

**Database:** SQLite at `backend/database/database.db`. Tables auto-created on startup if missing. Photo uploads stored in `backend/database/uploads/` and served as static files.

**Key schema:**
- `users` — `id`, `username` (unique)
- `activities` — `id`, `user_id` (FK), `duration`, `memo`, `date`, `photo_path`

Migrations live in `backend/src/migrations/` and can be applied via the `POST /users/secret` endpoint (accepts raw SQL — be careful).

## Environment

Backend reads `APP_PORT` env var (defaults to 8000). Uses `dotenv` but no `.env` file is committed — create one locally if needed.
