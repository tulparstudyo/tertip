CREATE TYPE project_document_type AS ENUM ('thesis', 'article', 'proceeding', 'book', 'proposal', 'other');
CREATE TYPE source_document_type AS ENUM ('book', 'article', 'newspaper', 'encyclopedia', 'thesis', 'other');
CREATE TYPE admin_role_type AS ENUM ('support', 'manager', 'super_admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ai_token_quota INT DEFAULT 500000,
    ai_token_used INT DEFAULT 0,
    google_oauth_token JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role_type DEFAULT 'manager',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    refresh_token TEXT NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    project_type project_document_type DEFAULT 'article',
    google_docs_file_id VARCHAR(255) NOT NULL,
    google_drive_folder_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_shares (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    shared_by_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    can_edit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, shared_with_user_id)
);

CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    source_type source_document_type NOT NULL,
    title TEXT NOT NULL,
    authors TEXT,
    publisher VARCHAR(255),
    publication_year INT,
    volume VARCHAR(50),
    issue VARCHAR(50),
    pages VARCHAR(50),
    google_drive_file_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_comments (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    tiptap_comment_id VARCHAR(100) NOT NULL,
    comment_text TEXT NOT NULL,
    line_number INT NOT NULL,
    column_offset INT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
