const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// Función para generar lote automático
function generarLote(proveedor_id, donacion) {
  const fecha = new Date();
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const yyyy = fecha.getFullYear();
  const base = `${dd}${mm}${yyyy}`;
  return donacion ? `${base}-d` : `${base}-${proveedor_id}`;
}

// 📦 Registrar entrada
router.post("/", auth, async (req, res) => {
  try {
    const {
      producto_id,
      usuario_id, // En el futuro se extraerá del token JWT
      proveedor_id,
      cantidad,
      costo,
      donacion,
      vencimiento,
    } = req.body;

    const loteGenerado = generarLote(proveedor_id, donacion);

    const nuevaEntrada = await pool.query(
      `INSERT INTO entradas 
        (producto_id, usuario_id, proveedor_id, cantidad, costo, donacion, vencimiento, lote, fecha) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_DATE)
       RETURNING *`,
      [
        producto_id,
        usuario_id,
        proveedor_id || null,
        cantidad,
        costo || null,
        donacion || false,
        vencimiento || null,
        loteGenerado,
      ]
    );

    res.json(nuevaEntrada.rows[0]);
  } catch (err) {
    console.error("❌ Error al registrar entrada:", err.message);
    res.status(500).send("Error en servidor");
  }
});

// 📋 Listar entradas con formato de fecha legible
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.id,
        TO_CHAR(e.fecha, 'DD-MM-YYYY') AS fecha,
        e.cantidad,
        e.costo,
        e.donacion,
        e.lote,
        TO_CHAR(e.vencimiento, 'DD-MM-YYYY') AS vencimiento,
        p.nombre AS producto,
        p.categoria,
        p.subcategoria,
        p.presentacion,
        p.unidad,
        prov.nombre AS proveedor,
        u.nombre || ' ' || u.apellido AS responsable
      FROM entradas e
      JOIN productos p ON e.producto_id = p.id
      LEFT JOIN proveedores prov ON e.proveedor_id = prov.id
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      ORDER BY e.fecha DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en listar entradas:", err.message);
    res.status(500).send("Error en servidor");
  }
});

module.exports = router;
