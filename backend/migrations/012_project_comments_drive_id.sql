ALTER TABLE project_comments
  ADD COLUMN IF NOT EXISTS google_drive_comment_id VARCHAR(255);
