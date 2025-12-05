#!/usr/bin/env node
/**
 * Script para sincronizar TODA la base de datos de SUPABASE a LOCAL
 * Uso: node scripts/db_sync_from_supabase.js
 * 
 * Este script hace un dump completo de tu BD en Supabase y lo restaura localmente.
 * IMPORTANTE: Sobrescribe TODOS los datos locales con los de Supabase.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const SUPABASE_DUMP_FILE = path.join(__dirname, '../.tmp_supabase_dump.dump');
const SUPABASE_HOST = 'aws-1-sa-east-1.pooler.supabase.com';
const SUPABASE_USER = 'postgres.dwckzovoowgtbpkdwsku';
const SUPABASE_DB = 'postgres';
const SUPABASE_PORT = 5432;
const SUPABASE_PASSWORD = 'panol.eset+2019';

const LOCAL_HOST = 'localhost';
const LOCAL_USER = 'martin';
const LOCAL_DB = 'panol';
const LOCAL_PORT = 5432;
const LOCAL_PASSWORD = '1234';

// Función para ejecutar comandos
function runCommand(command, env = {}) {
  return new Promise((resolve, reject) => {
    const customEnv = { ...process.env, ...env };
    exec(command, { env: customEnv }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function syncFromSupabase() {
  try {
    console.log('🔄 Iniciando sincronización SUPABASE → LOCAL...\n');

    // Paso 1: Hacer dump de Supabase
    console.log('📦 Paso 1: Extrayendo base de datos de Supabase...');
    const dumpCommand = `pg_dump -h ${SUPABASE_HOST} -U ${SUPABASE_USER} -d ${SUPABASE_DB} -p ${SUPABASE_PORT} -Fc -f "${SUPABASE_DUMP_FILE}"`;
    await runCommand(dumpCommand, { PGPASSWORD: SUPABASE_PASSWORD });
    console.log('✅ Base de Supabase extraída\n');

    // Paso 2: Restaurar localmente
    console.log('🔄 Paso 2: Restaurando en base local...');
    const restoreCommand = `pg_restore -h ${LOCAL_HOST} -U ${LOCAL_USER} -d ${LOCAL_DB} -p ${LOCAL_PORT} --clean --if-exists -v "${SUPABASE_DUMP_FILE}"`;
    await runCommand(restoreCommand, { PGPASSWORD: LOCAL_PASSWORD });
    console.log('✅ Base restaurada localmente\n');

    // Paso 3: Limpiar archivo temporal
    if (fs.existsSync(SUPABASE_DUMP_FILE)) {
      fs.unlinkSync(SUPABASE_DUMP_FILE);
      console.log('🧹 Archivo temporal eliminado\n');
    }

    console.log('✅ ¡Sincronización completada exitosamente!');
    console.log('   Supabase → Base local ✓');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en sincronización:', error.message);
    
    // Limpiar archivo temporal en caso de error
    if (fs.existsSync(SUPABASE_DUMP_FILE)) {
      fs.unlinkSync(SUPABASE_DUMP_FILE);
    }
    
    process.exit(1);
  }
}

syncFromSupabase();
