-- migrations/0013_goals_archive.sql
-- Description: Agregar columna status a goals para soportar archivar metas

ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'active';
