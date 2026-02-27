// routes/auth.js — Login, registro, verificación y reset de contraseña
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const sgMail   = require('@sendgrid/mail');
const pool     = require('../db');
const router   = express.Router();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Helper: construir remitente SendGrid
function getSender() {
  return process.env.SENDGRID_FROM
    ? process.env.SENDGRID_FROM
    : { email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@uner.edu.ar', name: process.env.SENDGRID_FROM_NAME || 'Sistema Pañol' };
}

// Helper: enviar mail (no lanza error, solo loguea)
async function sendMail(msg) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid no configurado. URL de verificación:', msg.html);
    return;
  }
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('Error SendGrid:', err?.response?.body || err.message);
  }
}

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, rol_id, funcion_id, password } = req.body;

    if (!email.endsWith('@uner.edu.ar')) {
      return res.status(400).json({ error: 'Solo se permiten correos @uner.edu.ar' });
    }

    const exists = await pool.query('SELECT id, estado FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      const u = exists.rows[0];
      if (u.estado === 'pendiente') {
        return res.status(409).json({
          error: 'El correo está registrado pero no activado',
          pending: true,
          message: '¿Querés que reenviemos el correo de activación?'
        });
      }
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword  = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const tokenHash       = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt       = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, telefono, rol_id, funcion_id, password, estado, verification_token_hash, verification_expires)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente',$8,$9)`,
      [nombre, apellido, email, telefono || null, rol_id || null, funcion_id || null, hashedPassword, tokenHash, expiresAt]
    );

    const verifyUrl = `${process.env.BACKEND_URL || 'https://gestion-panol-eset.vercel.app'}/api/auth/verify/${verificationToken}`;
    await sendMail({
      to: email,
      from: getSender(),
      subject: 'Verificá tu cuenta - Sistema Pañol',
      html: `<p>Hola ${nombre},</p><p>Hacé clic para activar tu cuenta (válido 24 horas):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });

    res.json({ message: 'Usuario registrado. Revisá tu correo para activar la cuenta.' });
  } catch (err) {
    console.error('Error en /register:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ── GET /api/auth/verify/:token ───────────────────────────
router.get('/verify/:token', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://gestion-panol-eset.vercel.app';
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const result    = await pool.query(
      'SELECT id, verification_expires FROM usuarios WHERE verification_token_hash = $1',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).send(htmlMessage('Error de verificación', 'Token inválido o usuario no encontrado.', frontendUrl));
    }

    const user = result.rows[0];
    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).send(htmlMessage('Token expirado', 'El enlace expiró. Solicitá un reenvío desde la app.', frontendUrl));
    }

    await pool.query(
      "UPDATE usuarios SET estado='activo', verification_token_hash=NULL, verification_expires=NULL WHERE id=$1",
      [user.id]
    );

    return res.send(htmlMessage('✅ Cuenta verificada', 'Ya podés iniciar sesión.', frontendUrl, true));
  } catch (err) {
    console.error('Error en /verify:', err.message);
    res.status(500).send('Error en el servidor');
  }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    if (user.estado !== 'activo') {
      return res.status(403).json({ error: 'Cuenta no verificada. Revisá tu correo.' });
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // Obtener nombre del rol
    let rol_nombre = 'Sin rol';
    if (user.rol_id) {
      const rolResult = await pool.query('SELECT nombre FROM roles WHERE id = $1', [user.rol_id]);
      if (rolResult.rows.length > 0) rol_nombre = rolResult.rows[0].nombre;
    }

    const token = jwt.sign(
      { id: user.id, rol_id: user.rol_id, funcion_id: user.funcion_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, apellido: user.apellido, rol_id: user.rol_id, rol_nombre }
    });
  } catch (err) {
    console.error('Error en /login:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ── POST /api/auth/resend ─────────────────────────────────
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Falta email' });

    const result = await pool.query('SELECT id, nombre, estado FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = result.rows[0];
    if (user.estado === 'activo') return res.status(400).json({ error: 'Cuenta ya activada' });

    const verificationToken = crypto.randomBytes(24).toString('hex');
    const tokenHash         = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt         = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      "UPDATE usuarios SET verification_token_hash=$1, verification_expires=$2, estado='pendiente' WHERE id=$3",
      [tokenHash, expiresAt, user.id]
    );

    const verifyUrl = `${process.env.BACKEND_URL || 'https://gestion-panol-eset.vercel.app'}/api/auth/verify/${verificationToken}`;
    await sendMail({
      to: email,
      from: getSender(),
      subject: 'Reenvío - Verificá tu cuenta',
      html: `<p>Hola ${user.nombre || ''},</p><p><a href="${verifyUrl}">Activar cuenta</a> (válido 24 horas)</p>`
    });

    res.json({ message: 'Reenvío procesado. Revisá tu correo.' });
  } catch (err) {
    console.error('Error en /resend:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ── POST /api/auth/password-reset-request ────────────────
router.post('/password-reset-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Falta email' });

    const result = await pool.query('SELECT id, nombre FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const user      = result.rows[0];
    const resetToken = crypto.randomBytes(24).toString('hex');
    const tokenHash  = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      'UPDATE usuarios SET password_reset_token_hash=$1, password_reset_expires=$2 WHERE id=$3',
      [tokenHash, expiresAt, user.id]
    );

    const resetUrl = `${process.env.BACKEND_URL || 'https://gestion-panol-eset.vercel.app'}/api/auth/reset/${resetToken}`;
    await sendMail({
      to: email,
      from: getSender(),
      subject: 'Restablecer contraseña - Pañol',
      html: `<p>Hola ${user.nombre || ''},</p><p><a href="${resetUrl}">Restablecer contraseña</a> (válido 1 hora)</p>`
    });

    res.json({ message: 'Solicitud procesada. Revisá tu correo.' });
  } catch (err) {
    console.error('Error en /password-reset-request:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ── GET /api/auth/reset/:token (formulario HTML) ──────────
router.get('/reset/:token', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://gestion-panol-eset.vercel.app';
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const result    = await pool.query(
      'SELECT id, password_reset_expires FROM usuarios WHERE password_reset_token_hash = $1',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).send(htmlMessage('Error', 'Token inválido o usuario no existe.', frontendUrl));
    }
    if (new Date(result.rows[0].password_reset_expires) < new Date()) {
      return res.status(400).send(htmlMessage('Token expirado', 'El enlace expiró. Solicitá uno nuevo desde la app.', frontendUrl));
    }

    // Formulario para cambiar contraseña
    res.send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Restablecer contraseña</title>
<style>
  body{font-family:Arial,sans-serif;background:#f5f7fb;margin:0}
  .modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:24px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:400px;width:90%}
  input{width:100%;padding:8px;margin-top:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box}
  .btn{display:inline-block;margin-top:14px;padding:10px 18px;background:#28a745;color:#fff;border-radius:6px;border:none;cursor:pointer;width:100%}
  #msg{margin-top:10px}
</style></head>
<body><div class="modal">
  <h3>Restablecer contraseña</h3>
  <p>Ingresá tu nueva contraseña (mínimo 6 caracteres).</p>
  <input id="p1" type="password" placeholder="Nueva contraseña" />
  <input id="p2" type="password" placeholder="Repetir contraseña" />
  <button class="btn" id="btn">Cambiar contraseña</button>
  <div id="msg"></div>
</div>
<script>
  document.getElementById('btn').addEventListener('click', async function(){
    const p1=document.getElementById('p1').value, p2=document.getElementById('p2').value, msg=document.getElementById('msg');
    if(p1.length<6){msg.style.color='crimson';msg.textContent='Mínimo 6 caracteres';return;}
    if(p1!==p2){msg.style.color='crimson';msg.textContent='Las contraseñas no coinciden';return;}
    msg.style.color='#333';msg.textContent='Enviando...';
    const res=await fetch(window.location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p1})});
    const data=await res.json();
    if(!res.ok){msg.style.color='crimson';msg.textContent=data.error||'Error';return;}
    msg.style.color='green';msg.textContent=data.message||'Contraseña actualizada';
    setTimeout(()=>{window.location.href='${frontendUrl}';},1200);
  });
</script></body></html>`);
  } catch (err) {
    console.error('Error en GET /reset:', err.message);
    res.status(500).send('Error en el servidor');
  }
});

// ── POST /api/auth/reset/:token ───────────────────────────
router.post('/reset/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Falta nueva contraseña' });

    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const result    = await pool.query(
      'SELECT id, password_reset_expires FROM usuarios WHERE password_reset_token_hash = $1',
      [tokenHash]
    );

    if (result.rows.length === 0) return res.status(400).json({ error: 'Token inválido' });
    if (new Date(result.rows[0].password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE usuarios SET password=$1, password_reset_token_hash=NULL, password_reset_expires=NULL WHERE id=$2',
      [hashed, result.rows[0].id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en POST /reset:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ── Helper HTML ───────────────────────────────────────────
function htmlMessage(title, body, frontendUrl, isSuccess = false) {
  const color = isSuccess ? '#28a745' : '#007bff';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{font-family:Arial,sans-serif;background:#f5f7fb;margin:0}.modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:24px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:400px;width:90%}.btn{display:inline-block;margin-top:12px;padding:10px 16px;background:${color};color:#fff;border-radius:6px;text-decoration:none}</style>
</head><body><div class="modal"><h3>${title}</h3><p>${body}</p><a class="btn" href="${frontendUrl}">Aceptar</a></div></body></html>`;
}

module.exports = router;
