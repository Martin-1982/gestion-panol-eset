const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');

// GET /api/informes/mail_logs
router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM mail_logs ORDER BY created_at DESC LIMIT 200');
    res.json(r.rows);
  } catch (err) {
    console.error('Error obteniendo mail_logs:', err.message || err);
    res.status(500).json({ error: 'error' });
  }
});

module.exports = router;
