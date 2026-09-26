-- Prize ideas. Once someone has put up their own prize for a challenge they can
-- suggest ideas; anyone who hasn't added a prize yet can pick one as theirs,
-- which removes it from the list.

CREATE TABLE IF NOT EXISTS prize_suggestions (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prize_suggestions_challenge ON prize_suggestions(challenge_id);
