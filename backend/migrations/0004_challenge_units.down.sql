-- Reverse 0004_challenge_units. Fractional amounts are rounded to whole numbers.

ALTER TABLE activities ALTER COLUMN duration TYPE INTEGER USING ROUND(duration)::INTEGER;
ALTER TABLE challenges ALTER COLUMN goal_minutes TYPE INTEGER USING ROUND(goal_minutes)::INTEGER;

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_unit_check;
ALTER TABLE challenges DROP COLUMN IF EXISTS unit;
