-- Añade columnas para verificación por email si no existen
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP WITH TIME ZONE;

-- Asegura columna estado (activo/pendiente)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activo';

-- Nota: esta migración es idempotente y añade solo las columnas faltantes.
