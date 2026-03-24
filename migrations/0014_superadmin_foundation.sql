-- migrations/0014_superadmin_foundation.sql
-- Base fundacional de Super Admin + Freemium + Sponsored + Cobros + Códigos de compra + Analítica + Alertas

PRAGMA foreign_keys = ON;

-- =========================================================
-- 0) EXTENSIÓN LIGERA DE USERS PARA ANALÍTICA OPERATIVA
-- =========================================================

ALTER TABLE users ADD COLUMN registration_source TEXT;
ALTER TABLE users ADD COLUMN registration_country_code TEXT;
ALTER TABLE users ADD COLUMN registration_region TEXT;
ALTER TABLE users ADD COLUMN registration_city TEXT;
ALTER TABLE users ADD COLUMN registration_timezone TEXT;
ALTER TABLE users ADD COLUMN registration_device_type TEXT;
ALTER TABLE users ADD COLUMN registration_os TEXT;
ALTER TABLE users ADD COLUMN registration_browser TEXT;
ALTER TABLE users ADD COLUMN registration_ip_hash TEXT;
ALTER TABLE users ADD COLUMN registration_user_agent TEXT;
ALTER TABLE users ADD COLUMN last_seen_at DATETIME;
ALTER TABLE users ADD COLUMN last_active_at DATETIME;
ALTER TABLE users ADD COLUMN last_device_type TEXT;
ALTER TABLE users ADD COLUMN last_os TEXT;
ALTER TABLE users ADD COLUMN last_browser TEXT;
ALTER TABLE users ADD COLUMN current_plan_code TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN sponsored_eligible INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS users_current_plan_code_idx
ON users(current_plan_code);

CREATE INDEX IF NOT EXISTS users_last_active_at_idx
ON users(last_active_at);

CREATE INDEX IF NOT EXISTS users_registration_country_code_idx
ON users(registration_country_code);

-- =========================================================
-- 1) ADMINISTRACIÓN Y AUDITORÍA
-- =========================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin_support', 'admin_analyst', 'admin_viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_user_id_uidx
ON admin_users(user_id);

CREATE INDEX IF NOT EXISTS admin_users_role_idx
ON admin_users(role);

CREATE INDEX IF NOT EXISTS admin_users_status_idx
ON admin_users(status);

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    reason TEXT,
    details_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_created_idx
ON admin_audit_log(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_entity_idx
ON admin_audit_log(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
ON admin_audit_log(action, created_at DESC);

-- =========================================================
-- 2) CONFIGURACIÓN GLOBAL DEL SISTEMA
-- =========================================================

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_settings (key, value_json) VALUES
('registration_mode', '{"mode":"open"}'),
('plans_page', '{"url":"/planes"}'),
('premium_cta', '{"label":"Actualizar a Premium"}'),
('ads_mode', '{"enabled":false,"provider":"internal","frequency":"low"}'),
('sponsored_mode', '{"enabled":false,"label":"Plan Avanzado Patrocinado"}'),
('payments_mode', '{"gateway_enabled":false,"manual_enabled":true}'),
('purchase_code_mode', '{"enabled":false,"required_for_registration":false,"mode":"disabled"}'),
('new_user_alerts', '{"enabled":false,"mode":"instant","recipients":[],"include_device_metadata":true}'),
('sponsorship_metrics_mode', '{"enabled":true,"track_impressions":false,"track_clicks":false}');

-- =========================================================
-- 3) CATÁLOGO DE FEATURES Y CONTROL FREEMIUM
-- =========================================================

CREATE TABLE IF NOT EXISTS feature_catalog (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO feature_catalog (code, name, description, category, is_active, sort_order) VALUES
('coach_invites', 'Invitar coach', 'Permite invitar un coach o mentor.', 'mentorship', 1, 10),
('goal_history_export', 'Exportar historial', 'Permite exportar historial de aportes.', 'reports', 1, 20),
('advanced_reports', 'Reportes avanzados', 'Acceso a reportes y métricas avanzadas.', 'reports', 1, 30),
('custom_reminders', 'Recordatorios personalizados', 'Permite configurar recordatorios avanzados.', 'engagement', 1, 40),
('priority_support', 'Soporte prioritario', 'Acceso a soporte preferencial.', 'support', 1, 50),
('sponsored_advanced_tools', 'Funciones avanzadas patrocinadas', 'Funciones disponibles para planes patrocinados.', 'monetization', 1, 60);

CREATE TABLE IF NOT EXISTS plan_feature_flags (
    id TEXT PRIMARY KEY,
    feature_code TEXT NOT NULL,
    plan_code TEXT NOT NULL CHECK (plan_code IN ('free', 'sponsored', 'premium')),
    access_state TEXT NOT NULL CHECK (access_state IN ('enabled', 'locked', 'sponsored')),
    cta_label TEXT,
    badge_label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(feature_code) REFERENCES feature_catalog(code) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS plan_feature_flags_feature_plan_uidx
ON plan_feature_flags(feature_code, plan_code);

INSERT OR IGNORE INTO plan_feature_flags (id, feature_code, plan_code, access_state, cta_label, badge_label) VALUES
('pff_free_coach_invites', 'coach_invites', 'free', 'locked', 'Actualizar a Premium', 'Premium'),
('pff_sponsored_coach_invites', 'coach_invites', 'sponsored', 'locked', 'Actualizar a Premium', 'Premium'),
('pff_premium_coach_invites', 'coach_invites', 'premium', 'enabled', NULL, NULL),

('pff_free_goal_history_export', 'goal_history_export', 'free', 'locked', 'Actualizar a Premium', 'Premium'),
('pff_sponsored_goal_history_export', 'goal_history_export', 'sponsored', 'enabled', NULL, 'Patrocinado'),
('pff_premium_goal_history_export', 'goal_history_export', 'premium', 'enabled', NULL, NULL),

('pff_free_advanced_reports', 'advanced_reports', 'free', 'locked', 'Actualizar a Premium', 'Premium'),
('pff_sponsored_advanced_reports', 'advanced_reports', 'sponsored', 'sponsored', 'Ver plan patrocinado', 'Patrocinado'),
('pff_premium_advanced_reports', 'advanced_reports', 'premium', 'enabled', NULL, NULL),

('pff_free_custom_reminders', 'custom_reminders', 'free', 'locked', 'Actualizar a Premium', 'Premium'),
('pff_sponsored_custom_reminders', 'custom_reminders', 'sponsored', 'enabled', NULL, 'Patrocinado'),
('pff_premium_custom_reminders', 'custom_reminders', 'premium', 'enabled', NULL, NULL),

('pff_free_priority_support', 'priority_support', 'free', 'locked', 'Actualizar a Premium', 'Premium'),
('pff_sponsored_priority_support', 'priority_support', 'sponsored', 'locked', 'Actualizar a Premium', 'Premium'),
('pff_premium_priority_support', 'priority_support', 'premium', 'enabled', NULL, NULL),

('pff_free_sponsored_advanced_tools', 'sponsored_advanced_tools', 'free', 'locked', 'Ver plan patrocinado', 'Patrocinado'),
('pff_sponsored_sponsored_advanced_tools', 'sponsored_advanced_tools', 'sponsored', 'enabled', NULL, 'Patrocinado'),
('pff_premium_sponsored_advanced_tools', 'sponsored_advanced_tools', 'premium', 'enabled', NULL, NULL);

-- =========================================================
-- 4) CÓDIGOS ÚNICOS DE COMPRA
-- =========================================================

CREATE TABLE IF NOT EXISTS purchase_code_batches (
    id TEXT PRIMARY KEY,
    batch_name TEXT NOT NULL,
    code_prefix TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'closed')),
    export_enabled INTEGER NOT NULL DEFAULT 1,
    last_exported_at DATETIME,
    notes TEXT,
    created_by_admin_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS purchase_code_batches_status_idx
ON purchase_code_batches(status);

CREATE TABLE IF NOT EXISTS purchase_codes (
    id TEXT PRIMARY KEY,
    batch_id TEXT,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used', 'disabled', 'expired')),
    assigned_user_id TEXT,
    used_by_user_id TEXT,
    used_at DATETIME,
    expires_at DATETIME,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(batch_id) REFERENCES purchase_code_batches(id) ON DELETE SET NULL,
    FOREIGN KEY(assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS purchase_codes_code_uidx
ON purchase_codes(code);

CREATE INDEX IF NOT EXISTS purchase_codes_status_idx
ON purchase_codes(status);

CREATE INDEX IF NOT EXISTS purchase_codes_batch_idx
ON purchase_codes(batch_id);

-- =========================================================
-- 5) PLANES, SUSCRIPCIONES Y COBROS
-- =========================================================

CREATE TABLE IF NOT EXISTS plan_catalog (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    billing_type TEXT NOT NULL CHECK (billing_type IN ('free', 'sponsored', 'paid')),
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO plan_catalog (code, name, billing_type, is_active, sort_order, metadata_json) VALUES
('free', 'Básico Free', 'free', 1, 10, '{"ads":false,"sponsored":false}'),
('sponsored', 'Avanzado Patrocinado', 'sponsored', 1, 20, '{"ads":true,"sponsored":true}'),
('premium', 'Full Premium', 'paid', 1, 30, '{"ads":false,"sponsored":false}');

CREATE TABLE IF NOT EXISTS payment_methods (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('gateway', 'manual')),
    is_active INTEGER NOT NULL DEFAULT 1,
    config_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO payment_methods (code, name, type, is_active, config_json) VALUES
('manual_transfer', 'Transferencia manual', 'manual', 1, '{"requires_reference":true}'),
('manual_cash', 'Pago en efectivo', 'manual', 1, '{"requires_reference":false}'),
('gateway_placeholder', 'Pasarela futura', 'gateway', 0, '{"provider":"pending"}');

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_code TEXT NOT NULL CHECK (plan_code IN ('free', 'sponsored', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'pending', 'suspended', 'cancelled')),
    source TEXT NOT NULL CHECK (source IN ('gateway', 'manual', 'sponsored', 'admin_override', 'system_default')),
    starts_at DATETIME,
    ends_at DATETIME,
    auto_renew INTEGER NOT NULL DEFAULT 0,
    payment_method_code TEXT,
    external_reference TEXT,
    notes TEXT,
    created_by_admin_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(payment_method_code) REFERENCES payment_methods(code) ON DELETE SET NULL,
    FOREIGN KEY(created_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx
ON subscriptions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx
ON subscriptions(status);

CREATE INDEX IF NOT EXISTS subscriptions_plan_idx
ON subscriptions(plan_code);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_id TEXT,
    payment_method_code TEXT NOT NULL,
    amount REAL,
    currency TEXT DEFAULT 'DOP',
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    source TEXT NOT NULL CHECK (source IN ('gateway', 'manual')),
    external_reference TEXT,
    evidence_url TEXT,
    notes TEXT,
    processed_by_admin_id TEXT,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY(payment_method_code) REFERENCES payment_methods(code) ON DELETE RESTRICT,
    FOREIGN KEY(processed_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS payment_transactions_user_idx
ON payment_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_transactions_status_idx
ON payment_transactions(status);

CREATE INDEX IF NOT EXISTS payment_transactions_subscription_idx
ON payment_transactions(subscription_id);

-- =========================================================
-- 6) ANALÍTICA OPERATIVA Y PATROCINIO
-- =========================================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    event_name TEXT NOT NULL,
    event_group TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    session_id TEXT,
    plan_code TEXT,
    country_code TEXT,
    region TEXT,
    city TEXT,
    timezone TEXT,
    device_type TEXT,
    os_name TEXT,
    browser_name TEXT,
    app_version TEXT,
    referral_source TEXT,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS analytics_events_group_created_idx
ON analytics_events(event_group, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_user_created_idx
ON analytics_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx
ON analytics_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_plan_idx
ON analytics_events(plan_code, created_at DESC);

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    duration_seconds INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    country_code TEXT,
    region TEXT,
    city TEXT,
    timezone TEXT,
    device_type TEXT,
    os_name TEXT,
    browser_name TEXT,
    app_version TEXT,
    entry_screen TEXT,
    exit_screen TEXT,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_sessions_user_started_idx
ON user_sessions(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS user_sessions_active_idx
ON user_sessions(is_active, started_at DESC);

CREATE TABLE IF NOT EXISTS user_stats_daily (
    id TEXT PRIMARY KEY,
    stat_date DATE NOT NULL,
    user_id TEXT NOT NULL,
    plan_code TEXT,
    sessions_count INTEGER NOT NULL DEFAULT 0,
    total_session_seconds INTEGER NOT NULL DEFAULT 0,
    goals_created_count INTEGER NOT NULL DEFAULT 0,
    contributions_count INTEGER NOT NULL DEFAULT 0,
    achievements_count INTEGER NOT NULL DEFAULT 0,
    unlocks_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS user_stats_daily_date_user_uidx
ON user_stats_daily(stat_date, user_id);

CREATE INDEX IF NOT EXISTS user_stats_daily_plan_idx
ON user_stats_daily(plan_code, stat_date DESC);

CREATE TABLE IF NOT EXISTS platform_stats_daily (
    stat_date DATE PRIMARY KEY,
    new_users_count INTEGER NOT NULL DEFAULT 0,
    dau_count INTEGER NOT NULL DEFAULT 0,
    wau_count INTEGER NOT NULL DEFAULT 0,
    mau_count INTEGER NOT NULL DEFAULT 0,
    active_free_users_count INTEGER NOT NULL DEFAULT 0,
    active_sponsored_users_count INTEGER NOT NULL DEFAULT 0,
    active_premium_users_count INTEGER NOT NULL DEFAULT 0,
    sessions_count INTEGER NOT NULL DEFAULT 0,
    total_session_seconds INTEGER NOT NULL DEFAULT 0,
    avg_session_seconds REAL NOT NULL DEFAULT 0,
    goals_created_count INTEGER NOT NULL DEFAULT 0,
    contributions_count INTEGER NOT NULL DEFAULT 0,
    premium_conversions_count INTEGER NOT NULL DEFAULT 0,
    sponsored_impressions_count INTEGER NOT NULL DEFAULT 0,
    sponsored_clicks_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsorship_slots (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    placement TEXT NOT NULL,
    screen_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'paused')),
    pricing_model TEXT NOT NULL DEFAULT 'cpm' CHECK (pricing_model IN ('cpm', 'fixed', 'hybrid')),
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS sponsorship_slots_code_uidx
ON sponsorship_slots(code);

CREATE INDEX IF NOT EXISTS sponsorship_slots_status_idx
ON sponsorship_slots(status);

CREATE TABLE IF NOT EXISTS sponsorship_metrics_daily (
    id TEXT PRIMARY KEY,
    stat_date DATE NOT NULL,
    slot_id TEXT NOT NULL,
    impressions_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    unique_users_count INTEGER NOT NULL DEFAULT 0,
    avg_session_seconds REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(slot_id) REFERENCES sponsorship_slots(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS sponsorship_metrics_daily_date_slot_uidx
ON sponsorship_metrics_daily(stat_date, slot_id);

-- =========================================================
-- 7) NOTIFICACIONES ADMINISTRATIVAS
-- =========================================================

CREATE TABLE IF NOT EXISTS admin_notification_rules (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    event_name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    delivery_mode TEXT NOT NULL DEFAULT 'email' CHECK (delivery_mode IN ('email', 'digest')),
    recipients_json TEXT NOT NULL,
    include_metadata INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_notification_rules_code_uidx
ON admin_notification_rules(code);

INSERT OR IGNORE INTO admin_notification_rules (
    id, code, name, event_name, enabled, delivery_mode, recipients_json, include_metadata
) VALUES
(
    'anr_new_user_registered',
    'new_user_registered',
    'Nuevo usuario registrado',
    'user_registered',
    0,
    'email',
    '[]',
    1
);
