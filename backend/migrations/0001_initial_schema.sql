CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal_minutes INTEGER DEFAULT 600,
  start_date TEXT,
  end_date TEXT,
  admin_user_id INTEGER REFERENCES users(id),
  photo_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  UNIQUE (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  duration INTEGER NOT NULL,
  memo TEXT,
  date TEXT NOT NULL,
  photo_path TEXT,
  sus_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  challenge_id INTEGER DEFAULT 1,
  is_boosted BOOLEAN DEFAULT FALSE,
  lat REAL,
  lng REAL,
  address TEXT
);

CREATE TABLE IF NOT EXISTS prizes (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id),
  name TEXT NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id),
  winner_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_comments (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id),
  user_id INTEGER REFERENCES users(id),
  text TEXT NOT NULL,
  lat REAL,
  lng REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
