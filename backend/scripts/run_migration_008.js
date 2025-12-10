const fs = require('fs');
const { Client } = require('pg');

// Script para ejecutar la migración 008 en Supabase
// Uso: node scripts/run_migration_008.js

const client = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado a Supabase');

    const sql = fs.readFileSync('./db/migrations/008_add_producto_fields.sql', 'utf8');
    
    console.log('📝 Ejecutando migración 008...');
    await client.query(sql);
    console.log('✅ Migración 008 ejecutada exitosamente');

    await client.end();
    console.log('🎉 Listo!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
