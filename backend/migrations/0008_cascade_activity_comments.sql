-- Deleting an activity should delete its comments too, instead of failing
-- with a foreign key violation.

ALTER TABLE activity_comments DROP CONSTRAINT activity_comments_activity_id_fkey;
ALTER TABLE activity_comments ADD CONSTRAINT activity_comments_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
