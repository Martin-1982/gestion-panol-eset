// Script para ejecutar migraciones en la base de datos de producción (Railway/Supabase)
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    console.log(`📁 Encontradas ${files.length} migraciones`);
    
    for (const file of files) {
      console.log(`\n⚙️  Ejecutando: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ ${file} - OK`);
      } catch (err) {
        console.error(`❌ Error en ${file}:`, err.message);
        // Continuar con las siguientes migraciones
      }
    }
    
    console.log('\n✨ Migraciones completadas');
    
  } catch (error) {
    console.error('💥 Error ejecutando migraciones:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
