-- Migración 0004: Extender goal_transactions con nota, evidencia y confirmación física
ALTER TABLE goal_transactions ADD COLUMN note TEXT;
ALTER TABLE goal_transactions ADD COLUMN evidence_url TEXT;
ALTER TABLE goal_transactions ADD COLUMN confirmed_physical INTEGER DEFAULT 0;
