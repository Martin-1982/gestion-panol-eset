-- Migration 005: add password reset fields to usuarios
-- Adds two columns used by the password reset flow: a token hash and an expiry timestamp

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS password_reset_token_hash varchar(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires timestamptz;

-- No data migration required. The columns are nullable and only used when a reset is requested.
