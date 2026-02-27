const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// 📦 Registrar salida
router.post("/", auth, async (req, res) => {
  try {
    const { producto_id, cantidad, destino, responsable, usuario_id } = req.body;

    // Insertar salida con fecha actual
    const nuevaSalida = await pool.query(
      `INSERT INTO salidas 
        (producto_id, cantidad, fecha, destino, responsable, usuario_id)
       VALUES ($1,$2,CURRENT_DATE,$3,$4,$5)
       RETURNING *`,
      [producto_id, cantidad, destino, responsable, usuario_id]
    );

    // Verificar tipo del producto
    const tipoRes = await pool.query("SELECT tipo FROM productos WHERE id=$1", [producto_id]);

    if (tipoRes.rows.length > 0 && tipoRes.rows[0].tipo === "uso") {
      // Registrar entrega en stock_areas
      await pool.query(
        `INSERT INTO stock_areas (producto_id, area, cantidad)
         VALUES ($1, $2, $3)`,
        [producto_id, destino, cantidad]
      );
    }

    res.json(nuevaSalida.rows[0]);
  } catch (err) {
    console.error("❌ Error al registrar salida:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// 📋 Listar salidas con formato de fecha legible
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        TO_CHAR(s.fecha, 'DD-MM-YYYY') AS fecha,
        s.cantidad,
        s.destino,
        s.responsable,
        p.nombre AS producto,
        p.tipo,
        p.categoria,
        p.subcategoria,
        p.presentacion,
        p.unidad,
        u.nombre || ' ' || u.apellido AS responsable_registro
      FROM salidas s
      JOIN productos p ON s.producto_id = p.id
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      ORDER BY s.fecha DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al listar salidas:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// 📋 Listar stock por área
router.get("/stock-areas", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sa.id,
        p.nombre AS producto,
        p.tipo,
        sa.area,
        sa.cantidad,
        TO_CHAR(sa.fecha_entrega, 'DD-MM-YYYY') AS fecha_entrega,
        sa.estado,
        sa.motivo_baja,
        TO_CHAR(sa.fecha_baja, 'DD-MM-YYYY') AS fecha_baja
      FROM stock_areas sa
      JOIN productos p ON sa.producto_id = p.id
      ORDER BY sa.area, p.nombre
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al listar stock por áreas:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// 📋 Listar áreas/destinos disponibles (valores únicos)
router.get("/areas", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT area
      FROM stock_areas
      WHERE area IS NOT NULL AND area <> ''
      ORDER BY area
    `);
    // Devolver como array de strings para facilitar el consumo en frontend
    res.json(result.rows.map(r => r.area));
  } catch (err) {
    console.error("❌ Error al listar áreas:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

// � Registrar salidas en bulk (batch/remito) y decrementar stock virtual si aplica
router.post("/bulk", auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { destino, responsable, items } = req.body; // items: [{ producto_id, cantidad }]
    const usuario_id = req.user && req.user.id ? req.user.id : null;

    if (!destino || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Destino e items requeridos' });
    }

    await client.query('BEGIN');

    for (const it of items) {
      const { producto_id, cantidad } = it;

      // Validar que producto exista
      const prodRes = await client.query('SELECT id, tipo FROM productos WHERE id=$1', [producto_id]);
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Producto ${producto_id} no encontrado` });
      }

      // Verificar stock disponible (basado en entradas - salidas actuales)
      const stockCheckRes = await client.query(
        `SELECT (
           COALESCE((SELECT SUM(cantidad) FROM entradas WHERE producto_id=$1),0)
           - COALESCE((SELECT SUM(cantidad) FROM salidas WHERE producto_id=$1),0)
         ) AS stock`,
        [producto_id]
      );
      const available = Number(stockCheckRes.rows[0].stock) || 0;
      if (available < cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Stock insuficiente para producto ${producto_id} (disponible: ${available})` });
      }

      // Insertar salida
      await client.query(
        `INSERT INTO salidas (producto_id, cantidad, fecha, destino, responsable, usuario_id)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)`,
        [producto_id, cantidad, destino, responsable, usuario_id]
      );

      // Si producto tipo 'uso', registrar en stock_areas
      if (prodRes.rows[0].tipo === 'uso') {
        await client.query(
          `INSERT INTO stock_areas (producto_id, area, cantidad)
           VALUES ($1, $2, $3)`,
          [producto_id, destino, cantidad]
        );
      }
      // Al insertar la salida, la vista de stock calculado reflejará el decremento
    }

    await client.query('COMMIT');
    // devolver la fecha del servidor para que el cliente pueda usarla en los remitos
    try {
      const fechaRes = await pool.query("SELECT TO_CHAR(CURRENT_DATE,'DD-MM-YYYY') AS fecha");
      const fecha = fechaRes.rows && fechaRes.rows[0] ? fechaRes.rows[0].fecha : null;
      res.json({ ok: true, inserted: items.length, fecha });
    } catch (e) {
      res.json({ ok: true, inserted: items.length });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error al registrar salidas bulk:', err.message);
    res.status(500).send('Error en el servidor');
  } finally {
    client.release();
  }
});

// �📋 Registrar baja de un bien
router.put("/baja/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_baja } = req.body;

    const result = await pool.query(
      `UPDATE stock_areas
       SET estado='baja', motivo_baja=$1, fecha_baja=CURRENT_DATE
       WHERE id=$2 RETURNING *`,
      [motivo_baja, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al registrar baja:", err.message);
    res.status(500).send("Error en el servidor");
  }
});

module.exports = router;
