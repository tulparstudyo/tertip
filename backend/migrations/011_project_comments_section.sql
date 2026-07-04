ALTER TABLE project_comments
  ADD COLUMN IF NOT EXISTS section_slug VARCHAR(50) NOT NULL DEFAULT 'body';

CREATE INDEX IF NOT EXISTS idx_project_comments_project_section
  ON project_comments (project_id, section_slug);
