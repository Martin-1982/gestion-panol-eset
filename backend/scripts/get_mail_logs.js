#!/usr/bin/env node
// Script sencillo para listar los últimos registros de mail_logs
(async () => {
  try {
    const pool = require('../src/db');
    const r = await pool.query("SELECT id, usuario_id, destinatario, asunto, status, response, created_at FROM mail_logs ORDER BY created_at DESC LIMIT 20");
    console.log(JSON.stringify(r.rows, null, 2));
    await pool.end();
  } catch (e) {
    console.error('ERRDB', e && (e.message || e));
    process.exit(1);
  }
})();
