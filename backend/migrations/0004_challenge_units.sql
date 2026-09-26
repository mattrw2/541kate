-- Per-challenge units. A challenge measures activity in minutes (the original,
-- and still the default) or miles. activities.duration and
-- challenges.goal_minutes keep their names but now hold an amount in the
-- challenge's unit, and allow decimals (e.g. 3.1 miles).

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'minutes';
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_unit_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_unit_check CHECK (unit IN ('minutes', 'miles'));

ALTER TABLE challenges ALTER COLUMN goal_minutes TYPE DOUBLE PRECISION;
ALTER TABLE activities ALTER COLUMN duration TYPE DOUBLE PRECISION;
