-- Migration: 0012_auth_v2.sql
-- Description: New tables for passwordless auth and session improvements

-- 1. Identity table (Credentials)
CREATE TABLE IF NOT EXISTS auth_identities (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    email_normalized TEXT UNIQUE NOT NULL,
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. OTP table
CREATE TABLE IF NOT EXISTS auth_otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL, -- e.g., 'auth_login'
    code_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    consumed_at DATETIME,
    attempt_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_hash TEXT,
    metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_email_purpose ON auth_otps(email, purpose);

-- 3. Mejora de la tabla sessions
/**
 * DOCUMENTACIÓN TÉCNICA - MIGRACIÓN 0012
 * Esta sección de la migración es NO REENTRANTE en entornos SQLite que ya posean estas columnas.
 * Si se ejecuta en una base de datos donde ya existen (por ejemplo, tras un deploy fallido parcial),
 * las siguientes sentencias ALTER TABLE fallarán.
 * 
 * ESTRATEGIA: Ejecutar únicamente en entornos que no posean la estructura Auth v2.
 */
ALTER TABLE sessions ADD COLUMN revoked_at DATETIME;
ALTER TABLE sessions ADD COLUMN ip_hash TEXT;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;

-- 4. Asegurar columna email en tabla users
/**
 * REQUERIDO PARA V1 BACKWARD COMPATIBILITY
 * Vincula el perfil del usuario con la identidad verificada.
 */
ALTER TABLE users ADD COLUMN email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
