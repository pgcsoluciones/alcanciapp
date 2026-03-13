-- migrations/0002_add_target_amount.sql

-- Añadir columna target_amount a la tabla goals
-- Permite guardar el monto objetivo real de la meta (null para compatibilidad hacia atrás)
ALTER TABLE goals ADD COLUMN target_amount REAL;
