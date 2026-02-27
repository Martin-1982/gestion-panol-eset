const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, nombre FROM roles ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    console.error(err && (err.stack || err.message || err));
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
