const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

//
// 🔹 Stock Consolidado con filtros
router.get("/stock", auth, async (req, res) => {
  try {
    const { categoria, subcategoria, bajo, sinStock } = req.query;

    // Usar subconsultas agregadas para entradas y salidas por producto
    // Evita el problema de multiplicación de filas cuando hay múltiples entradas y salidas
    let query = `
      SELECT
        p.nombre AS producto,
        p.categoria,
        p.subcategoria,
        p.presentacion,
        p.unidad,
        p.minimo,
        COALESCE(e.entradas_total,0) - COALESCE(s.salidas_total,0) AS stock
      FROM productos p
      LEFT JOIN (
        SELECT producto_id, SUM(cantidad) AS entradas_total
        FROM entradas
        GROUP BY producto_id
      ) e ON e.producto_id = p.id
      LEFT JOIN (
        SELECT producto_id, SUM(cantidad) AS salidas_total
        FROM salidas
        GROUP BY producto_id
      ) s ON s.producto_id = p.id
      WHERE 1=1
    `;
    const values = [];
    let index = 1;

    if (categoria) {
      query += ` AND p.categoria = $${index++}`;
      values.push(categoria);
    }
    if (subcategoria) {
      query += ` AND p.subcategoria = $${index++}`;
      values.push(subcategoria);
    }
    if (bajo === "true") {
      query += ` AND (COALESCE(e.entradas_total,0) - COALESCE(s.salidas_total,0)) <= p.minimo AND (COALESCE(e.entradas_total,0) - COALESCE(s.salidas_total,0)) > 0`;
    }
    if (sinStock === "true") {
      query += ` AND (COALESCE(e.entradas_total,0) - COALESCE(s.salidas_total,0)) = 0`;
    }

    query += " ORDER BY p.nombre ASC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en /stock:", err.message);
    res.status(500).send("Error en servidor");
  }
});


//
// 🔹 Entradas con filtros
//
router.get("/entradas", auth, async (req, res) => {
  try {
    const { desde, hasta, producto, categoria, subcategoria, proveedor, donacion } = req.query;

    let query = `
      SELECT 
        e.id,
        e.fecha,
        e.cantidad,
        e.costo,
        e.donacion,
        e.lote,
        p.nombre AS producto,
        p.categoria,
        p.subcategoria,
        p.presentacion,
        p.unidad,
        prov.nombre AS proveedor_nombre
      FROM entradas e
      JOIN productos p ON e.producto_id = p.id
      LEFT JOIN proveedores prov ON e.proveedor_id = prov.id
      WHERE 1=1
    `;
    const values = [];
    let index = 1;

    if (desde) {
      query += ` AND e.fecha >= $${index++}`;
      values.push(desde);
    }
    if (hasta) {
      query += ` AND e.fecha <= $${index++}`;
      values.push(hasta);
    }
    if (producto) {
      query += ` AND p.nombre = $${index++}`;
      values.push(producto);
    }
    if (categoria) {
      query += ` AND p.categoria = $${index++}`;
      values.push(categoria);
    }
    if (subcategoria) {
      query += ` AND p.subcategoria = $${index++}`;
      values.push(subcategoria);
    }
    if (proveedor) {
      query += ` AND e.proveedor_id = $${index++}`;
      values.push(proveedor);
    }
    if (donacion === "true") query += " AND e.donacion = true";

    query += " ORDER BY e.fecha DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en /entradas:", err.message);
    res.status(500).send("Error en servidor");
  }
});

//
// 🔹 Salidas con filtros
//
router.get("/salidas", auth, async (req, res) => {
  try {
    const { desde, hasta, producto, destino, responsable, groupRemitos } = req.query;

    let query = `
      SELECT 
        s.id,
        s.fecha,
        s.cantidad,
        s.destino,
        s.responsable,
        p.nombre AS producto,
        p.unidad
      FROM salidas s
      JOIN productos p ON s.producto_id = p.id
      WHERE 1=1
    `;
    const values = [];
    let index = 1;

    if (desde) {
      query += ` AND s.fecha >= $${index++}`;
      values.push(desde);
    }
    if (hasta) {
      query += ` AND s.fecha <= $${index++}`;
      values.push(hasta);
    }
    if (producto) {
      query += ` AND p.nombre = $${index++}`;
      values.push(producto);
    }
    if (destino) {
      query += ` AND s.destino = $${index++}`;
      values.push(destino);
    }
    if (responsable) {
      query += ` AND s.responsable = $${index++}`;
      values.push(responsable);
    }

    query += " ORDER BY s.fecha DESC";

    const result = await pool.query(query, values);
    let rows = result.rows || [];

    // grouping by remito removed - return individual rows

    res.json(rows);
  } catch (err) {
    console.error("❌ Error en /salidas:", err.message);
    res.status(500).send("Error en servidor");
  }
});

module.exports = router;
