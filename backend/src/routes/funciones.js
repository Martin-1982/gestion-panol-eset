const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rol_id } = req.query;
    let q = 'SELECT id, nombre, rol_id FROM funciones';
    const params = [];
    if (rol_id) {
      q += ' WHERE rol_id = $1';
      params.push(rol_id);
    }
    q += ' ORDER BY id';
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (err) {
    console.error(err && (err.stack || err.message || err));
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
