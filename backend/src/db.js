const { Pool } = require("pg");
require("dotenv").config();

// Habilitar SSL automáticamente cuando nos conectamos a Supabase
// (host termina en supabase.com) para evitar errores de conexión en producción.
const isSupabase = (process.env.PGHOST || "").includes("supabase.com");

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

module.exports = pool;

