const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require("./routes/auth");
const entradasRoutes = require("./routes/entradas");
const salidasRoutes = require("./routes/salidas");
const productosRoutes = require("./routes/productos");
const proveedoresRoutes = require("./routes/proveedores");
const informesRoutes = require("./routes/informes");
const mailRoutes = require("./routes/mail");
const mailLogsRoutes = require("./routes/mailLogs");
const rolesRoutes = require("./routes/roles");
const funcionesRoutes = require("./routes/funciones");
const filesRoutes = require("./routes/files");
const path = require('path');
const pool = require('./db');

app.use("/api/auth", authRoutes);
app.use("/api/entradas", entradasRoutes);
app.use("/api/salidas", salidasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/informes", informesRoutes);
app.use("/api/informes/enviar", mailRoutes);
app.use("/api/informes/mail_logs", mailLogsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/funciones', funcionesRoutes);
// serve uploaded files from /uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/files', filesRoutes);

// Ruta de diagnóstico de salud
app.get('/health', async (req, res) => {
  try {
    // Intentar una consulta simple
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    console.error('Error en /health:', error);
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});

// Puerto
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
  console.log(`📍 Escuchando en todas las interfaces (0.0.0.0:${PORT})`);
  console.log(`🌐 Variables de entorno cargadas:`, {
    PORT,
    PGHOST: process.env.PGHOST ? '✓' : '✗',
    PGDATABASE: process.env.PGDATABASE ? '✓' : '✗',
    JWT_SECRET: process.env.JWT_SECRET ? '✓' : '✗'
  });
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
