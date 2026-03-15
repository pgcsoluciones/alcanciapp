-- api/migrations/0011_auth_refinement.sql
CREATE TABLE auth_tokens (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sessions ADD COLUMN unlock_until DATETIME;
