#!/usr/bin/env node
/**
 * Script para sincronizar datos de la base local a Supabase
 * Uso: node scripts/sync_to_supabase.js
 * 
 * IMPORTANTE: Este script copia TODOS los datos de tu BD local a Supabase.
 * Usar con precaución en producción.
 */

const { Pool } = require('pg');

// Configuración de base local
const localPool = new Pool({
  user: 'martin',
  host: 'localhost',
  database: 'panol',
  password: '1234',
  port: 5432,
});

// Configuración de Supabase
const supabasePool = new Pool({
  user: 'postgres.dwckzovoowgtbpkdwsku',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  database: 'postgres',
  password: 'panol.eset+2019',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

async function syncData() {
  try {
    console.log('🔄 Iniciando sincronización Local → Supabase...\n');

    // Ejemplo: Sincronizar usuarios
    const localUsers = await localPool.query('SELECT * FROM usuarios');
    console.log(`📊 Usuarios en local: ${localUsers.rows.length}`);

    for (const user of localUsers.rows) {
      await supabasePool.query(
        `INSERT INTO usuarios (id, nombre, apellido, email, telefono, rol_id, funcion_id, password, estado, verification_token_hash, verification_expires, password_reset_token_hash, password_reset_expires)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (email) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           apellido = EXCLUDED.apellido,
           telefono = EXCLUDED.telefono,
           rol_id = EXCLUDED.rol_id,
           funcion_id = EXCLUDED.funcion_id,
           password = EXCLUDED.password,
           estado = EXCLUDED.estado`,
        [user.id, user.nombre, user.apellido, user.email, user.telefono, user.rol_id, user.funcion_id, user.password, user.estado, user.verification_token_hash, user.verification_expires, user.password_reset_token_hash, user.password_reset_expires]
      );
    }

    console.log('✅ Usuarios sincronizados');

    // Agregar más tablas según necesites (productos, proveedores, etc.)
    
    console.log('\n✅ Sincronización completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    process.exit(1);
  } finally {
    await localPool.end();
    await supabasePool.end();
  }
}

syncData();
