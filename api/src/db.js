// db.js — Conexión a Supabase (PostgreSQL)
// Las variables de entorno se configuran en el panel de Vercel

const { Pool } = require('pg');

// Supabase usa SSL, lo detectamos por el host
const isSupabase = (process.env.PGHOST || '').includes('supabase.com');

const pool = new Pool({
  user:     process.env.PGUSER,
  host:     process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port:     parseInt(process.env.PGPORT || '5432'),
  ssl:      isSupabase ? { rejectUnauthorized: false } : false
});

module.exports = pool;
