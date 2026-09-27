-- The part of a challenge's cover photo to feature (e.g. a face), tapped by the
-- uploader. Fractions of the photo's width/height (0–1); NULL means centered.
-- Used to crop the home-screen icon and position the dashboard banner.

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS photo_focus_x REAL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS photo_focus_y REAL;
