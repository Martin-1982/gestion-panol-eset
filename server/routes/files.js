// routes/files.js — Manejo de archivos adjuntos
// NOTA: En Vercel el sistema de archivos es efímero (no persiste entre requests).
// Por eso usamos memoria para subidas. Los archivos adjuntos se envían directamente
// por email (ver mail.js). Para almacenamiento persistente en el futuro: Supabase Storage.
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const auth    = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/files/upload
// Acepta un archivo y lo devuelve en base64 (para uso temporal en el frontend)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    return res.json({
      ok: true,
      filename:    req.file.originalname,
      mimetype:    req.file.mimetype,
      size:        req.file.size,
      dataUrl,
      nota: 'Archivo procesado en memoria. Para guardarlo permanentemente usá Supabase Storage.'
    });
  } catch (err) {
    console.error('Error en upload:', err);
    return res.status(500).json({ error: 'Error procesando archivo' });
  }
});

module.exports = router;
