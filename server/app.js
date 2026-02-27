// app.js — Configuración de Express
// No tiene app.listen() porque Vercel lo maneja internamente

const express = require('express');
const cors = require('cors');

const app = express();

// CORS: permite llamadas desde el frontend de Vercel y desde localhost en desarrollo
app.use(cors({
  origin: [
    'http://localhost:3000',
    /\.vercel\.app$/
  ],
  credentials: true
}));

app.use(express.json());

// ── Rutas ────────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const entradasRoutes   = require('./routes/entradas');
const salidasRoutes    = require('./routes/salidas');
const productosRoutes  = require('./routes/productos');
const proveedoresRoutes = require('./routes/proveedores');
const informesRoutes   = require('./routes/informes');
const mailRoutes       = require('./routes/mail');
const mailLogsRoutes   = require('./routes/mailLogs');
const rolesRoutes      = require('./routes/roles');
const funcionesRoutes  = require('./routes/funciones');
const filesRoutes      = require('./routes/files');

app.use('/api/auth',              authRoutes);
app.use('/api/entradas',          entradasRoutes);
app.use('/api/salidas',           salidasRoutes);
app.use('/api/productos',         productosRoutes);
app.use('/api/proveedores',       proveedoresRoutes);
app.use('/api/informes/enviar',   mailRoutes);
app.use('/api/informes/mail_logs', mailLogsRoutes);
app.use('/api/informes',          informesRoutes);
app.use('/api/roles',             rolesRoutes);
app.use('/api/funciones',         funcionesRoutes);
app.use('/api/files',             filesRoutes);

// ── Health check ─────────────────────────────────────────
const pool = require('./db');
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

module.exports = app;
