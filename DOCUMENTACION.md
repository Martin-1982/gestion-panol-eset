# 📚 Documentación del Proyecto - Sistema de Gestión de Pañol ESET

## 🎯 Estado Actual del Proyecto

### ✅ Funcionalidades Implementadas

#### 🔐 Autenticación y Usuarios
- Sistema de login con JWT (8 horas de sesión)
- Registro de usuarios con verificación por email
- Reset de contraseña con token de seguridad
- Sistema de roles (7 roles: Administrador, Directivo, Docentes, Coordinador/a, Bibliotecario/a, Orientación, PAyS)
- Verificación de email con SendGrid

#### 📦 Gestión de Inventario
- **Productos**: CRUD completo con categorías, subcategorías, stock mínimo, fecha de vencimiento
- **Proveedores**: Gestión de proveedores con contacto
- **Entradas**: Registro de ingresos de materiales con remitos
- **Salidas**: Registro de egresos con destino, responsable y generación de remitos PDF con QR

#### 📊 Informes y Reportes
- Informe de Stock con filtros avanzados (categoría, subcategoría, stock bajo, sin stock, vencimiento)
- Informe de Entradas con rango de fechas y exportación Excel/PDF
- Informe de Salidas con filtros y exportación
- Logs de emails enviados
- Generación de remitos vacíos (solo en desarrollo)

#### 🎨 Diseño y UX
- Diseño responsive mobile-first
- Optimización touch-friendly para móviles (44px botones, 16px inputs)
- Tablas con scroll horizontal en mobile
- Headers sticky con gradientes
- Sistema de colores consistente con variables CSS
- Checkboxes inline en desktop, grid 2x2 en tablet, apilados en mobile

### 🗄️ Arquitectura Técnica

#### Backend (Railway)
- **Framework**: Node.js + Express.js
- **Base de datos**: PostgreSQL (Supabase cloud + local development)
- **Autenticación**: JWT con bcrypt
- **Email**: SendGrid para verificación y reset de contraseña
- **Archivos**: Multer para uploads de remitos
- **Puerto**: 8080 (producción) / 4000 (desarrollo)

#### Frontend (Vercel)
- **Framework**: React 18 (Create React App)
- **HTTP Client**: Axios
- **Exportación**: ExcelJS (Excel), jsPDF (PDF)
- **Estilos**: CSS3 con variables custom (sin frameworks)
- **QR**: Generación de QR para remitos

#### Base de Datos
- **Producción**: Supabase PostgreSQL (Session Pooler)
- **Desarrollo**: PostgreSQL local
- **Sincronización**: Scripts pg_dump/pg_restore para sync bidireccional

### 📁 Scripts Disponibles

#### Backend (`/backend/scripts/`)
- `db_sync_to_supabase.js` - Sincroniza DB local → Supabase (antes de deploy)
- `db_sync_from_supabase.js` - Sincroniza Supabase → DB local (inicio de desarrollo)
- `run_migrations.js` - Ejecuta migraciones en local
- `run_production_migrations.js` - Ejecuta migraciones en Supabase
- `get_mail_logs.js` - Obtiene logs de emails
- `resend_verification.js` - Reenvía email de verificación
- `send_test_mail.js` - Test de SendGrid
- `send_ui_test_mail.js` - Test de email desde UI

### 🔧 Variables de Entorno Requeridas

#### Railway (Backend)
```
BACKEND_URL=https://gestion-panol-eset-production.up.railway.app
FRONTEND_URL=https://gestion-panol-eset.vercel.app
PGHOST=aws-0-us-east-1.pooler.supabase.com
PGPORT=6543
PGUSER=postgres.dwckzovoowgtbpkdwsku
PGPASSWORD=panol.eset+2019
PGDATABASE=postgres
JWT_SECRET=<tu_jwt_secret>
SENDGRID_API_KEY=<tu_sendgrid_key>
```

#### Local Development (`.env`)
```
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
PGHOST=localhost
PGPORT=5432
PGUSER=martin
PGPASSWORD=1234
PGDATABASE=panol
JWT_SECRET=<tu_jwt_secret>
SENDGRID_API_KEY=<tu_sendgrid_key>
```

### 🚀 Workflow de Desarrollo

1. **Sincronizar DB**: `node scripts/db_sync_from_supabase.js`
2. **Desarrollar localmente**: Modificar código, probar en `localhost:3000`
3. **Verificar cambios**: Probar funcionalidad completa
4. **Sincronizar a Supabase**: `node scripts/db_sync_to_supabase.js` (si hay cambios en DB)
5. **Commit y Push**: `git add -A && git commit -m "..." && git push origin main`
6. **Auto-deploy**: Railway y Vercel se actualizan automáticamente

### 📌 Pendientes / Próximas Tareas

1. **Railway Branch Fix**: Cambiar de 'master' a 'main' en configuración
2. **Filtros de Vencimiento**: Implementar lógica para "Próximo a vencer" (30 días) y "Vencido"
3. **Módulo de Solicitudes** (próxima prioridad alta):
   - Submódulo: Solicitudes de Recursos
   - Submódulo: Reservas
   - Submódulo: Mantenimiento
   - Submódulo: Consultas Generales
   - Listado general de solicitudes
4. **PWA**: Configurar manifest.json y service workers para instalación
5. **Testing**: Pruebas en dispositivos reales (320px-480px width)

### 🔗 URLs del Proyecto

- **Frontend (Producción)**: https://gestion-panol-eset.vercel.app
- **Backend (Producción)**: https://gestion-panol-eset-production.up.railway.app
- **Repositorio GitHub**: https://github.com/Martin-1982/gestion-panol-eset
- **Branch Principal**: main

### 👤 Usuarios de Prueba

- **Admin**: admin@uner.edu.ar / contraseña configurada (rol_id: 7 - Administrador)
- **Test Admin**: german.loker@uner.edu.ar / adming (rol_id: 7 - Administrador)

### 📧 Contacto

- **Desarrollador**: altamiranda.martin@gmail.com
- **Institución**: UNER

---

**Última actualización**: 5 de diciembre de 2025
