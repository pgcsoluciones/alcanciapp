-- Migración 0007: Diferenciación usuario demo vs real
ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'demo';
