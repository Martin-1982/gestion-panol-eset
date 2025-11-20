const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

async function run() {
  try {
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log('Ejecutando:', file);
      await pool.query(sql);
      console.log('OK:', file);
    }
    console.log('Todas las migraciones ejecutadas.');
    process.exit(0);
  } catch (err) {
    console.error('Error ejecutando migraciones:', err.message || err);
    process.exit(1);
  }
}

run();
