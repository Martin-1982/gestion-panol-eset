-- Añade campos para el restablecimiento de contraseña
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS password_reset_token_hash varchar,
  ADD COLUMN IF NOT EXISTS password_reset_expires timestamptz;
