const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const router = express.Router();
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

// Configuración de SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️  SENDGRID_API_KEY no configurada. Los correos no se enviarán.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// 🔹 Registro de usuario
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, rol_id, funcion_id, password } = req.body;
    console.log('>>> /register body:', { nombre, apellido, email, telefono, rol_id, funcion_id });

    // validar dominio
    if (!email.endsWith("@uner.edu.ar")) {
      return res.status(400).json({ error: "Solo se permiten correos @uner.edu.ar" });
    }

    // evitar duplicados - si existe pero está pendiente, devolvemos info para reenvío
    const exists = await pool.query("SELECT id, estado FROM usuarios WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      const e = exists.rows[0];
      if (e.estado === 'pendiente') {
        return res.status(409).json({ error: 'El correo está registrado pero no activado', pending: true, message: 'Usuario registrado pero no activado. ¿Querés que reenviemos el correo de activación?' });
      }
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // generar token opaco aleatorio
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // insertar usuario en estado "pendiente" y guardar hash+expiry
    const insertQuery = `INSERT INTO usuarios (nombre, apellido, email, telefono, rol_id, funcion_id, password, estado, verification_token_hash, verification_expires)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
    await pool.query(insertQuery,
      [nombre, apellido, email, telefono || null, rol_id || null, funcion_id || null, hashedPassword, "pendiente", tokenHash, expiresAt]
    );
    console.log('>>> /register: insert OK for', email);

    // enviar email con SendGrid
    const verifyUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/verify/${verificationToken}`;
    if (process.env.SENDGRID_API_KEY) {
        // Determinar remitente: usar SENDGRID_FROM (si existe) o el par SENDGRID_FROM_EMAIL/SENDGRID_FROM_NAME
        const fromField = process.env.SENDGRID_FROM
          ? process.env.SENDGRID_FROM
          : { email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@uner.edu.ar', name: process.env.SENDGRID_FROM_NAME || 'Sistema Pañol' };

        // Construir cuerpo del correo con detalles del registro
        const includePassword = process.env.SEND_PASSWORD_IN_EMAIL === 'true';
        const detailsHtml = `
          <ul>
            <li><strong>Correo:</strong> ${email}</li>
            <li><strong>Nombre:</strong> ${nombre || ''}</li>
            <li><strong>Apellido:</strong> ${apellido || ''}</li>
            <li><strong>Teléfono:</strong> ${telefono || ''}</li>
            <li><strong>Rol ID:</strong> ${rol_id || ''}</li>
            <li><strong>Función ID:</strong> ${funcion_id || ''}</li>
            ${includePassword ? `<li><strong>Contraseña:</strong> ${password}</li>` : ''}
          </ul>
        `;

        const msg = {
          to: email,
          from: fromField,
          subject: 'Verificá tu cuenta',
          html: `<p>Hola ${nombre || ''},</p>
                 <p>Hacé clic en el siguiente enlace para activar tu cuenta (válido 24 horas):</p>
                 <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                 <hr/>
                 <p><strong>Datos del registro:</strong></p>
                 ${detailsHtml}`,
        };
      try {
        await sgMail.send(msg);
        console.log('>>> /register: SendGrid send OK for', email);
      } catch (sendErr) {
        // No relanzamos: enviamos log y mostramos la URL de verificación como fallback
        console.error('>>> /register: SendGrid error (no crítico):', sendErr && (sendErr.stack || sendErr.message || sendErr));
        console.log('>>> /register: SendGrid fallo — mostrando URL de verificación como fallback:', verifyUrl);
        // continuar sin lanzar para evitar 500
      }
    } else {
      console.log('Simulación de email de verificación:', verifyUrl);
    }

    res.json({ message: "Usuario registrado. Revisá tu correo para activar la cuenta." });
  } catch (err) {
    console.error("❌ Error en /register:", err.stack || err.message || err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 🔹 Verificación de usuario por token
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    // verificar token opaco comparando hash y expiry
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const userResult = await pool.query(
      "SELECT id, verification_expires FROM usuarios WHERE verification_token_hash = $1",
      [tokenHash]
    );
    if (userResult.rows.length === 0) {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.status(400).send(`
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Verificación - Error</title>
              <style>
                body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0}
                .modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:400px;width:90%}
                .btn{display:inline-block;margin-top:12px;padding:10px 16px;background:#007bff;color:#fff;border-radius:6px;text-decoration:none}
              </style>
            </head>
            <body>
              <div class="modal">
                <h3>Error de verificación</h3>
                <p>Token inválido o usuario no existe.</p>
                <a class="btn" href="/">Aceptar</a>
              </div>
            </body>
          </html>
        `);
      }
      return res.status(400).json({ error: "Token inválido o usuario no existe" });
    }
    const user = userResult.rows[0];
    if (!user.verification_expires || new Date(user.verification_expires) < new Date()) {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.status(400).send(`
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Verificación - Expirado</title>
              <style>
                body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0}
                .modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:400px;width:90%}
                .btn{display:inline-block;margin-top:12px;padding:10px 16px;background:#007bff;color:#fff;border-radius:6px;text-decoration:none}
              </style>
            </head>
            <body>
              <div class="modal">
                <h3>Token expirado</h3>
                <p>El enlace de verificación ha expirado. Solicitá un reenvío desde la app.</p>
                <a class="btn" href="/">Aceptar</a>
              </div>
            </body>
          </html>
        `);
      }
      return res.status(400).json({ error: "Token expirado" });
    }

    // activar usuario y limpiar token
    await pool.query(
      "UPDATE usuarios SET estado = 'activo', verification_token_hash = NULL, verification_expires = NULL WHERE id = $1",
      [user.id]
    );

    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.send(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Cuenta verificada</title>
            <style>
              body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0}
              .modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:420px;width:92%}
              .btn{display:inline-block;margin-top:12px;padding:10px 16px;background:#28a745;color:#fff;border-radius:6px;text-decoration:none}
            </style>
          </head>
          <body>
            <div class="modal">
              <h3>\u2705 Cuenta verificada</h3>
              <p>Ya podés iniciar sesión.</p>
              <a class="btn" id="okBtn" href="/">Aceptar</a>
            </div>
            <script>
              // Determinar URL de login del frontend (rellenada desde servidor si se configura FRONTEND_URL)
              document.getElementById('okBtn').addEventListener('click', function(e){
                var frontendLogin = '${process.env.FRONTEND_URL || 'http://localhost:3000'}/login';
                window.location.href = frontendLogin;
                e.preventDefault();
              });
            </script>
          </body>
        </html>
      `);
    }

    res.json({ message: "✅ Cuenta verificada. Ya podés iniciar sesión." });
  } catch (err) {
    console.error("❌ Error en /verify:", err.message);
    res.status(400).json({ error: "Token inválido o expirado" });
  }
});

// 🔹 Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Intento de login:', { email });

    const userResult = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    console.log('📊 Usuarios encontrados:', userResult.rows.length);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];
    console.log('👤 Usuario encontrado:', { id: user.id, email: user.email, estado: user.estado });

    if (user.estado !== "activo") {
      console.log('⚠️  Cuenta no verificada:', { email, estado: user.estado });
      return res.status(403).json({ error: "Cuenta no verificada" });
    }

    const validPass = await bcrypt.compare(password, user.password);
    console.log('🔑 Validación de contraseña:', validPass);
    
    if (!validPass) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Obtener el nombre del rol desde la tabla roles
    let rol_nombre = 'Sin rol';
    if (user.rol_id) {
      const rolResult = await pool.query("SELECT nombre FROM roles WHERE id = $1", [user.rol_id]);
      if (rolResult.rows.length > 0) {
        rol_nombre = rolResult.rows[0].nombre;
      }
    }

    // generar JWT
    const token = jwt.sign(
      { id: user.id, rol_id: user.rol_id, funcion_id: user.funcion_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log('✅ Login exitoso:', { email, id: user.id, rol: rol_nombre });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        nombre: user.nombre, 
        apellido: user.apellido, 
        rol_id: user.rol_id,
        rol_nombre: rol_nombre
      } 
    });
  } catch (err) {
    console.error("❌ Error en /login:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 🔹 Reenviar verificación (si usuario existe y no está activo)
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Falta email' });

    const userResult = await pool.query('SELECT id, nombre, estado FROM usuarios WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = userResult.rows[0];
    if (user.estado === 'activo') return res.status(400).json({ error: 'Cuenta ya activada' });

    // generar token opaco
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query('UPDATE usuarios SET verification_token_hash=$1, verification_expires=$2, estado=$3 WHERE id=$4', [tokenHash, expiresAt, 'pendiente', user.id]);

    const verifyUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/verify/${verificationToken}`;
    if (process.env.SENDGRID_API_KEY) {
        // Determinar remitente: usar SENDGRID_FROM (si existe) o el par SENDGRID_FROM_EMAIL/SENDGRID_FROM_NAME
        const fromField = process.env.SENDGRID_FROM
          ? process.env.SENDGRID_FROM
          : { email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@uner.edu.ar', name: process.env.SENDGRID_FROM_NAME || 'Sistema Pañol' };

        const msg = {
          to: email,
          from: fromField,
          subject: 'Reenviar - Verificá tu cuenta',
          html: `<p>Hola ${user.nombre || ''},</p><p>Hacé clic en el siguiente enlace para activar tu cuenta (válido 24 horas):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
        };
      try {
        await sgMail.send(msg);
        console.log('>>> /resend: SendGrid send OK for', email);
      } catch (sendErr) {
        console.error('>>> /resend: SendGrid error (no crítico):', sendErr && (sendErr.stack || sendErr.message || sendErr));
        console.log('>>> /resend: SendGrid fallo — mostrando URL como fallback:', verifyUrl);
      }
    } else {
      console.log('Simulación /resend - URL de verificación:', verifyUrl);
    }

    return res.json({ message: 'Reenvío de verificación procesado. Revisá el correo o el log.' });
  } catch (err) {
    console.error('❌ Error en /resend:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

// 🔹 Solicitar restablecimiento de contraseña (envía token al email)
router.post('/password-reset-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Falta email' });

    const userResult = await pool.query('SELECT id, nombre FROM usuarios WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = userResult.rows[0];

    // generar token opaco
    const resetToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query('UPDATE usuarios SET password_reset_token_hash=$1, password_reset_expires=$2 WHERE id=$3', [tokenHash, expiresAt, user.id]);

  const resetUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/reset/${resetToken}`;
    if (process.env.SENDGRID_API_KEY) {
      const fromField = process.env.SENDGRID_FROM
        ? process.env.SENDGRID_FROM
        : { email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@uner.edu.ar', name: process.env.SENDGRID_FROM_NAME || 'Sistema Pañol' };

      const msg = {
        to: email,
        from: fromField,
        subject: 'Restablecer contraseña - Pañol',
        html: `<p>Hola ${user.nombre || ''},</p><p>Hacé clic en el siguiente enlace para restablecer tu contraseña (válido 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      };
      try {
        await sgMail.send(msg);
        console.log('>>> /password-reset-request: SendGrid send OK for', email);
      } catch (sendErr) {
        console.error('>>> /password-reset-request: SendGrid error:', sendErr && (sendErr.stack || sendErr.message || sendErr));
        console.log('>>> /password-reset-request: fallback URL:', resetUrl);
      }
    } else {
      console.log('Simulación password reset - URL:', resetUrl);
    }

    return res.json({ message: 'Solicitud procesada. Revisá tu correo.' });
  } catch (err) {
    console.error('❌ Error en /password-reset-request:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

// 🔹 Aplicar restablecimiento de contraseña mediante token opaco
router.post('/reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Falta nueva contraseña' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const userResult = await pool.query('SELECT id, password_reset_expires FROM usuarios WHERE password_reset_token_hash = $1', [tokenHash]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'Token inválido' });

    const user = userResult.rows[0];
    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE usuarios SET password=$1, password_reset_token_hash=NULL, password_reset_expires=NULL WHERE id=$2', [hashed, user.id]);
    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('❌ Error en /reset:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

// 🔹 Página HTML para restablecer contraseña (cuando usuario abre el enlace en el navegador)
router.get('/reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const userResult = await pool.query('SELECT id, password_reset_expires FROM usuarios WHERE password_reset_token_hash = $1', [tokenHash]);
    if (userResult.rows.length === 0) {
      return res.status(400).send(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Restablecer contraseña - Error</title>
            <style>body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0}.modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:420px;width:92%}.btn{display:inline-block;margin-top:12px;padding:10px 16px;background:#007bff;color:#fff;border-radius:6px;text-decoration:none}</style>
          </head>
          <body>
            <div class="modal">
              <h3>Error</h3>
              <p>Token inválido o usuario no existe.</p>
              <a class="btn" href="/">Aceptar</a>
            </div>
          </body>
        </html>
      `);
    }
    const user = userResult.rows[0];
    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).send(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Restablecer contraseña - Expirado</title>
            <style>body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0}.modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:420px;width:92%}.btn{display:inline-block;margin-top:12px;padding:10px 16px;background:#007bff;color:#fff;border-radius:6px;text-decoration:none}</style>
          </head>
          <body>
            <div class="modal">
              <h3>Token expirado</h3>
              <p>El enlace ha expirado. Solicitá uno nuevo desde la app.</p>
              <a class="btn" href="/">Aceptar</a>
            </div>
          </body>
        </html>
      `);
    }

    // Servir formulario HTML que hace POST al mismo endpoint
    return res.send(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Restablecer contraseña</title>
          <style>
            body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0}
            .modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.15);max-width:420px;width:92%}
            .btn{display:inline-block;margin-top:12px;padding:10px 16px;background:#28a745;color:#fff;border-radius:6px;text-decoration:none}
            input{width:100%;padding:8px;margin-top:8px;border:1px solid #ddd;border-radius:6px}
          </style>
        </head>
        <body>
          <div class="modal">
            <h3>Restablecer contraseña</h3>
            <p>Ingresá tu nueva contraseña (mínimo 6 caracteres).</p>
            <input id="password" type="password" placeholder="Nueva contraseña" />
            <input id="password2" type="password" placeholder="Repetir nueva contraseña" />
            <div style="text-align:right;margin-top:12px">
              <button id="submit" class="btn">Cambiar contraseña</button>
            </div>
            <div id="msg" style="margin-top:10px;color:#333"></div>
          </div>
          <script>
            const submit = document.getElementById('submit');
            const msg = document.getElementById('msg');
            submit.addEventListener('click', async function(){
              const p1 = document.getElementById('password').value;
              const p2 = document.getElementById('password2').value;
              if(!p1 || p1.length < 6){ msg.style.color='crimson'; msg.textContent='La contraseña debe tener al menos 6 caracteres'; return; }
              if(p1 !== p2){ msg.style.color='crimson'; msg.textContent='Las contraseñas no coinciden'; return; }
              msg.style.color='#333'; msg.textContent='Enviando...';
              try{
                const res = await fetch(window.location.pathname, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: p1 }) });
                const data = await res.json();
                if(!res.ok){ msg.style.color='crimson'; msg.textContent = (data && data.error) ? data.error : 'Error al cambiar contraseña'; return; }
                msg.style.color='green'; msg.textContent = data.message || 'Contraseña actualizada correctamente';
                setTimeout(()=>{
                  const frontend = '${process.env.FRONTEND_URL || 'http://localhost:3000'}';
                  window.location.href = frontend + '/login';
                }, 1200);
              } catch(e){ msg.style.color='crimson'; msg.textContent='Error de red'; }
            });
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('❌ Error en GET /reset/:token', err && (err.stack || err.message || err));
    return res.status(500).send('Error en el servidor');
  }
});

module.exports = router;

// Endpoints auxiliares para frontend (roles/funciones)
