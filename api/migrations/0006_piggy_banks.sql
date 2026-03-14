-- Migración 0006: Tabla piggy_banks para alcancías físicas vinculadas
CREATE TABLE IF NOT EXISTS piggy_banks (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    linked_user_id TEXT,
    linked_goal_id TEXT,
    status TEXT DEFAULT 'unlinked',
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    linked_at DATETIME,
    FOREIGN KEY(linked_user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS pb_code_idx ON piggy_banks(code);
CREATE INDEX IF NOT EXISTS pb_user_idx ON piggy_banks(linked_user_id);
