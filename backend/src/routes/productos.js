const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
// 📌 Listar productos con stock calculado (entradas - salidas)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COALESCE(e.entradas_total,0) - COALESCE(s.salidas_total,0) AS stock
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
      ORDER BY p.nombre ASC
    `);

    const productos = result.rows.map((r) => ({ ...r, stock: Number(r.stock) }));
    res.json(productos);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// 📌 Crear un producto nuevo
router.post("/", auth, async (req, res) => {
  try {
    const { nombre, tipo, categoria, subcategoria, presentacion, unidad, minimo } = req.body;

    const result = await pool.query(
      `INSERT INTO productos (nombre, tipo, categoria, subcategoria, presentacion, unidad, minimo)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [nombre, tipo || null, categoria, subcategoria, presentacion, unidad, minimo || 0]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al crear producto:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// 📌 Editar un producto
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, categoria, subcategoria, presentacion, unidad, minimo } = req.body;

    const result = await pool.query(
      `UPDATE productos 
       SET nombre=$1, tipo=$2, categoria=$3, subcategoria=$4, 
           presentacion=$5, unidad=$6, minimo=$7
       WHERE id=$8
       RETURNING *`,
      [nombre, tipo || null, categoria, subcategoria, presentacion, unidad, minimo || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al actualizar producto:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// 📌 Eliminar un producto
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM productos WHERE id=$1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ mensaje: "✅ Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

module.exports = router;
