// routes/mail.js — Envío de correos con SendGrid
// Soporta adjuntos (multipart/form-data)
const express = require('express');
const router  = express.Router();
const sgMail  = require('@sendgrid/mail');
const multer  = require('multer');
const auth    = require('../middleware/auth');
const pool    = require('../db');

const upload = multer({ storage: multer.memoryStorage() });

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// POST /api/informes/enviar
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { to, subject, text, html } = req.body || {};

    if (!to) return res.status(400).json({ error: "Campo 'to' requerido" });

    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: 'SendGrid no configurado' });
    }

    // Construir contenido del mensaje
    const contentText  = (text || '').trim();
    const contentHtml  = (html || '').trim();
    const fallback     = subject ? `${subject} - Informe adjunto` : 'Informe adjunto';
    const finalContent = [];
    if (contentText) finalContent.push({ type: 'text/plain', value: contentText });
    if (contentHtml) finalContent.push({ type: 'text/html',  value: contentHtml });
    if (finalContent.length === 0) finalContent.push({ type: 'text/plain', value: fallback });

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@uner.edu.ar',
        name:  process.env.SENDGRID_FROM_NAME  || 'Sistema Pañol'
      },
      subject: subject || 'Notificación - Sistema Pañol',
      content: finalContent
    };

    // Adjunto si viene un archivo
    if (req.file?.buffer) {
      msg.attachments = [{
        content:     req.file.buffer.toString('base64'),
        filename:    req.file.originalname || 'adjunto',
        type:        req.file.mimetype     || 'application/octet-stream',
        disposition: 'attachment'
      }];
    }

    let dbStatus = 'pending';
    let dbResponse = null;

    try {
      await sgMail.send(msg);
      dbStatus   = 'sent';
      dbResponse = 'ok';
      res.json({ ok: true, message: 'Correo enviado' });
    } catch (sendErr) {
      dbStatus   = 'error';
      dbResponse = JSON.stringify(sendErr?.response?.body || sendErr.message);
      console.error('Error SendGrid:', dbResponse);
      res.status(500).json({ error: dbResponse });
    } finally {
      // Guardar log en BD
      try {
        await pool.query(
          `INSERT INTO mail_logs (usuario_id, destinatario, asunto, body, status, response)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [req.user?.id || null, to, subject || null, text || html || null, dbStatus, dbResponse]
        );
      } catch (dbErr) {
        console.error('Error guardando mail_log:', dbErr.message);
      }
    }
  } catch (err) {
    console.error('Error en /mail:', err.message);
    res.status(500).json({ error: err.message || 'error' });
  }
});

module.exports = router;
