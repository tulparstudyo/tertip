-- Monthly AI command quota (replaces token-based quota)
ALTER TABLE users RENAME COLUMN ai_token_quota TO ai_command_quota;
ALTER TABLE users RENAME COLUMN ai_token_used TO ai_commands_used;

UPDATE users
SET ai_command_quota = 100
WHERE ai_command_quota > 10000;

UPDATE users SET ai_commands_used = 0;

ALTER TABLE users ALTER COLUMN ai_command_quota SET DEFAULT 100;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ai_quota_period_start DATE NOT NULL
  DEFAULT date_trunc('month', CURRENT_DATE)::date;

CREATE TYPE ai_command_status AS ENUM ('success', 'failure');

CREATE TABLE ai_command_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    command_type VARCHAR(64) NOT NULL,
    tokens_used INT NOT NULL DEFAULT 0,
    status ai_command_status NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_command_logs_created_at ON ai_command_logs(created_at DESC);
CREATE INDEX idx_ai_command_logs_user_id ON ai_command_logs(user_id);
CREATE INDEX idx_ai_command_logs_project_id ON ai_command_logs(project_id);
CREATE INDEX idx_ai_command_logs_command_type ON ai_command_logs(command_type);
CREATE INDEX idx_ai_command_logs_status ON ai_command_logs(status);
