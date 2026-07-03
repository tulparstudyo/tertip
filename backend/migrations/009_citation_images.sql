CREATE TABLE IF NOT EXISTS citation_images (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id INT REFERENCES sources(id) ON DELETE SET NULL,
  google_drive_file_id VARCHAR(255) NOT NULL,
  ocr_text TEXT DEFAULT '',
  mime_type VARCHAR(100) NOT NULL,
  original_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_citation_images_project ON citation_images (project_id);
CREATE INDEX IF NOT EXISTS idx_citation_images_user ON citation_images (user_id);
