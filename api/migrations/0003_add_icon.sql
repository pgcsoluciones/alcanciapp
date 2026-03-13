-- migrations/0003_add_icon.sql

-- Añadir columna icon a la tabla goals
-- Permite guardar el identificador del icono de la categoría (ej. 'vacation', 'house')
ALTER TABLE goals ADD COLUMN icon TEXT;
