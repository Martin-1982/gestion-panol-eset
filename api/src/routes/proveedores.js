const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// 📌 Obtener todos los proveedores
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM proveedores ORDER BY nombre ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener proveedores:", err.message);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// 📌 Agregar un proveedor nuevo
router.post("/", auth, async (req, res) => {
  try {
    const { nombre, contacto, telefono, direccion, email } = req.body;

    const result = await pool.query(
      `INSERT INTO proveedores (nombre, contacto, telefono, direccion, email)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [nombre, contacto || null, telefono || null, direccion || null, email || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al agregar proveedor:", err.message);
    res.status(500).json({ error: "Error al agregar proveedor" });
  }
});

// 📌 Editar proveedor
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, direccion, email } = req.body;

    const result = await pool.query(
      `UPDATE proveedores 
       SET nombre=$1, contacto=$2, telefono=$3, direccion=$4, email=$5
       WHERE id=$6
       RETURNING *`,
      [nombre, contacto || null, telefono || null, direccion || null, email || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al editar proveedor:", err.message);
    res.status(500).json({ error: "Error al editar proveedor" });
  }
});

// 📌 Eliminar proveedor
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM proveedores WHERE id=$1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json({ mensaje: "✅ Proveedor eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar proveedor:", err.message);
    res.status(500).json({ error: "Error al eliminar proveedor" });
  }
});

module.exports = router;
