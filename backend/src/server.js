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

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});
