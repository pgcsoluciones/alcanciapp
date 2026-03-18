-- migrations/0012_goals_archived_at.sql
-- Archivar metas sin eliminarlas para ocultarlas del listado activo.
-- Mantiene historial sin mezclar con eliminación explícita.
ALTER TABLE goals ADD COLUMN archived_at DATETIME;

CREATE INDEX IF NOT EXISTS goals_user_archived_idx ON goals(user_id, archived_at);
