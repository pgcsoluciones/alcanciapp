-- migrations/0013_badges.sql
-- Ajustes mínimos para sistema de insignias existente en la base real

CREATE TABLE IF NOT EXISTS achievement_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    goal_id TEXT,
    event_type TEXT NOT NULL,
    payload_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS achievement_events_user_created_idx
ON achievement_events(user_id, created_at DESC);

INSERT OR IGNORE INTO badges_catalog
(code, name, description, icon, category, is_repeatable)
VALUES
('first_contribution', 'Ahorrador Novato', 'Registraste tu primer aporte.', 'spark', 'starter', 0),
('double_quota', 'Doble Cuota', 'Hiciste un aporte extraordinario.', 'boost', 'speed', 0),
('hitos_25', 'Despegue (25%)', 'Alcanzaste el 25% de una meta.', 'level_up', 'progress', 0),
('hitos_50', 'Bóveda (50%)', 'Llegaste al 50% de una meta.', 'halfway', 'progress', 0),
('hitos_75', 'Cosecha (75%)', 'Alcanzaste el 75% de una meta.', 'trophy', 'progress', 0),
('goal_completed', 'Meta Cumplida', 'Completaste una meta de ahorro.', 'goal', 'achievement', 0);
