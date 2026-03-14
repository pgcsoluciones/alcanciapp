-- Migration: 0009_v1_architecture.sql
-- Description: Add currency to goals and setup final badge system

-- 1. Add currency to goals
ALTER TABLE goals ADD COLUMN currency TEXT NOT NULL DEFAULT 'DOP';

-- 2. Badges Catalog
CREATE TABLE IF NOT EXISTS badges_catalog (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_repeatable INTEGER DEFAULT 0 -- 0: no, 1: yes
);

-- 3. User Badges (Achievements)
CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_code TEXT NOT NULL,
    goal_id TEXT, -- Puede ser nulo si la insignia es global
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    meta_json TEXT, -- Para guardar datos extra (ej: el hito de 25%)
    FOREIGN KEY(badge_code) REFERENCES badges_catalog(code),
    UNIQUE(user_id, badge_code, goal_id) -- Evita duplicados para la misma meta
);

-- 4. Initial Data for Badges Catalog
INSERT OR IGNORE INTO badges_catalog (code, name, description, icon, category, is_repeatable) VALUES 
('first_contribution', 'Ahorrador Novato', 'Primera transacción válida en cualquier meta.', 'badge_first_goal.png', 'starter', 0),
('constancy_3', 'Constancia de Bronce', '3 cuotas cumplidas consecutivamente.', 'badge_iron_streak.png', 'discipline', 1),
('constancy_7', 'Constancia de Plata', '7 cuotas cumplidas consecutivamente.', 'badge_steady_harvest.png', 'discipline', 1),
('double_quota', 'Doble Cuota', '2 cuotas registradas el mismo día.', 'badge_saving_sprint.png', 'speed', 1),
('hitos_25', 'Despegue (25%)', 'Meta alcanzó el 25% de su objetivo.', 'badge_savings_takeoff.png', 'progress', 0),
('hitos_50', 'Bóveda (50%)', 'Meta alcanzó el 50% de su objetivo.', 'badge_vault_premium.png', 'progress', 0),
('hitos_75', 'Cosecha (75%)', 'Meta alcanzó el 75% de su objetivo.', 'badge_seed_brave.png', 'progress', 0),
('goal_completed', 'Meta Cumplida', '¡Felicidades! Llegaste al 100%.', 'badge_grand_progress_cup.png', 'achievement', 0),
('punctual_5', 'Reloj de Oro (5)', '5 aportes consecutivos sin un solo día de atraso.', 'badge_budget_captain.png', 'discipline', 1),
('racha_10', 'Titán del Ahorro (10)', '10 aportes consecutivos sin atraso.', 'badge_iron_streak.png', 'discipline', 1),
('recovery', 'Fénix del Ahorro', 'Regresaste al ritmo esperado después de estar atrasado.', 'badge_level_up.png', 'resilience', 1);
