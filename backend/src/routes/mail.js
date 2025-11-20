const express = require("express");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
const auth = require("../middleware/auth");
const pool = require("../db");
const multer = require('multer');

// multer in-memory storage for attachments
const storage = multer.memoryStorage();
const upload = multer({ storage });

// La API key debe estar en backend/.env como SENDGRID_API_KEY
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Enviar mail simple
// POST /api/informes/enviar
// Accepts multipart/form-data with optional file attachment (field 'file')
router.post("/", auth, upload.single('file'), async (req, res) => {
  try {
    // When using multipart/form-data, fields are in req.body as strings
    if (!req.body) {
      console.warn('Advertencia: req.body undefined en /api/informes/enviar (posible problema con multipart/form-data)');
    }
    const { to, subject, text, html } = req.body || {};

    if (!to) return res.status(400).json({ error: "Campo 'to' requerido" });

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "no-reply@example.com",
        name: process.env.SENDGRID_FROM_NAME || "Sistema Pa1ol",
      },
      subject: subject || "Notificaci3n - Sistema Pa1ol",
      text: text || "",
      html: html || (text ? `<p>${text}</p>` : undefined),
    };

      // Normalize text/html to strings and ensure at least one non-empty content is present for SendGrid
      try {
        msg.text = msg.text !== undefined && msg.text !== null ? String(msg.text) : '';
        msg.html = msg.html !== undefined && msg.html !== null ? String(msg.html) : undefined;
        const textTrim = msg.text ? msg.text.trim() : '';
        const htmlTrim = msg.html ? msg.html.trim() : '';
        if (textTrim.length === 0 && htmlTrim.length === 0) {
          msg.text = subject ? `${subject} - Informe adjunto` : 'Informe adjunto';
        } else {
          // if html is empty string, unset it to avoid SendGrid treating empty content
          if (htmlTrim.length === 0) msg.html = undefined;
          if (textTrim.length === 0) msg.text = '';
        }

      // Ensure msg.content exists with non-empty string for SendGrid API
      try {
        const finalText = msg.text && String(msg.text).trim().length ? String(msg.text).trim() : null;
        const finalHtml = msg.html && String(msg.html).trim().length ? String(msg.html).trim() : null;
        const content = [];
        if (finalText) content.push({ type: 'text/plain', value: finalText });
        if (finalHtml) content.push({ type: 'text/html', value: finalHtml });
        if (content.length === 0) {
          const fallback = subject ? `${subject} - Informe adjunto` : 'Informe adjunto';
          content.push({ type: 'text/plain', value: fallback });
        }
        // remove text/html to avoid SDK duplicating into content
        delete msg.text;
        delete msg.html;
        msg.content = content;
      } catch (e) {
        const fallback = subject ? `${subject} - Informe adjunto` : 'Informe adjunto';
        delete msg.text;
        delete msg.html;
        msg.content = [{ type: 'text/plain', value: fallback }];
      }
      } catch (e) {
        msg.text = msg.text || (subject ? `${subject} - Informe adjunto` : 'Informe adjunto');
      }

    // If there's an uploaded file, convert to base64 and attach
    if (req.file && req.file.buffer) {
      const file = req.file;
      const base64 = file.buffer.toString('base64');
      msg.attachments = [
        {
          content: base64,
          filename: file.originalname || 'attachment',
          type: file.mimetype || 'application/octet-stream',
          disposition: 'attachment',
        },
      ];
    }

    if (!process.env.SENDGRID_API_KEY) {
      console.warn("SENDGRID_API_KEY no configurada. No se enviar1 el mail.");
      return res.status(500).json({ error: "SENDGRID no configurado" });
    }

    let dbStatus = 'pending';
    let dbResponse = null;

    try {
      // Debug: log summary of message to help diagnose Bad Request (do not log full attachment content)
      try {
        const attachCount = msg.attachments ? msg.attachments.length : 0;
        const textLen = msg.text ? String(msg.text).length : 0;
        const htmlLen = msg.html ? String(msg.html).length : 0;
        console.log(`Enviando mail summary -> to:${to} subject:${subject || ''} attachments:${attachCount} textLen:${textLen} htmlLen:${htmlLen} typeof(text):${typeof msg.text} typeof(html):${typeof msg.html}`);
      } catch (lerr) { /* ignore */ }

        // Debug: log content summary
        try {
          const contentSummary = (msg.content || []).map(c => ({ type: c.type, len: String(c.value || '').length }));
          console.log('msg.content summary:', JSON.stringify(contentSummary));
        } catch (e) {}
        const sgRes = await sgMail.send(msg);
      dbStatus = 'sent';
      dbResponse = JSON.stringify(sgRes);
      res.json({ ok: true, message: "Correo enviado" });
    } catch (sendErr) {
      dbStatus = 'error';
      // Try to capture SendGrid response body if present
      let sendResp = null;
      try {
        sendResp = sendErr?.response?.body || sendErr?.response || sendErr?.toString();
      } catch (e) {
        sendResp = sendErr.message || String(sendErr);
      }
      dbResponse = typeof sendResp === 'string' ? sendResp : JSON.stringify(sendResp);
      console.error("Error enviando mail:", sendErr, 'responseBody:', sendResp);
      res.status(500).json({ error: dbResponse });
    } finally {
      // Guardar log en la base
      try {
        const usuario_id = req.user?.id || null;
        await pool.query(
          `INSERT INTO mail_logs (usuario_id, destinatario, asunto, body, status, response)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [usuario_id, to, subject || null, text || html || null, dbStatus, dbResponse]
        );
      } catch (dbErr) {
        console.error('Error guardando mail_log:', dbErr.message || dbErr);
      }
    }
  } catch (err) {
    console.error("Error enviando mail:", err.message || err);
    res.status(500).json({ error: err.message || "error" });
  }
});

module.exports = router;
