#!/usr/bin/env node
require('dotenv').config();
const pool = require('../src/db');
const crypto = require('crypto');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: node resend_verification.js email@uner.edu.ar');
    process.exit(2);
  }

  const verificationToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const res = await pool.query(
    `UPDATE usuarios SET verification_token_hash = $1, verification_expires = $2, estado = 'pendiente' WHERE email = $3 RETURNING id`,
    [tokenHash, expiresAt, email]
  );

  if (res.rows.length === 0) {
    console.error('Usuario no encontrado:', email);
    process.exit(1);
  }

  const verifyUrl = `http://localhost:4000/api/auth/verify/${verificationToken}`;
  console.log('URL de verificación:', verifyUrl);
  process.exit(0);
}

main().catch(err => {
  console.error(err && (err.stack || err.message || err));
  process.exit(1);
});
