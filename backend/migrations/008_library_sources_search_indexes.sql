CREATE INDEX IF NOT EXISTS idx_sources_user_created_at
  ON sources (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sources_user_type_created
  ON sources (user_id, source_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sources_user_title_pattern
  ON sources (user_id, title varchar_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_sources_user_author_last
  ON sources (user_id, author_last_name varchar_pattern_ops);
