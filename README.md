# Sistema de Gestión Pañol — ESET

Sistema web para gestión de inventario, entradas, salidas y proveedores del Pañol de la Escuela Secundaria Técnica.

---

## 🏗️ Arquitectura

```
Vercel
├── /             → Frontend React (build estático)
└── /api/*        → Backend Node.js/Express (serverless functions)
         ↓
    Supabase (PostgreSQL)
```

Todo vive en Vercel. No hay Railway ni servidor separado.

---

## ⚙️ Variables de entorno (configurar en Vercel)

Ver `.env.example` para la lista completa.

Panel de Vercel → tu proyecto → **Settings → Environment Variables**

Las variables necesarias son:
- `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT` → Supabase
- `JWT_SECRET` → cadena aleatoria larga
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`
- `BACKEND_URL`, `FRONTEND_URL` → URL de tu proyecto en Vercel

---

## 🚀 Deploy en Vercel

1. Subí este código a GitHub
2. En Vercel → "Import Project" → seleccioná el repo
3. Vercel detecta el `vercel.json` automáticamente
4. Configurá las variables de entorno
5. Deploy ✅

---

## 💻 Desarrollo local

```bash
# Backend
cd api
npm install
# Crear api/.env con las variables (copiar de .env.example)
node -e "require('./src/app').listen(4000, () => console.log('API en :4000'))"

# Frontend (otra terminal)
cd frontend
npm install
npm start
```

---

## 📋 Funcionalidades actuales

- ✅ Login con email @uner.edu.ar + JWT
- ✅ Registro con verificación por email
- ✅ Recuperación de contraseña
- ✅ Gestión de Productos (CRUD + stock)
- ✅ Gestión de Proveedores (CRUD)
- ✅ Entradas de mercadería
- ✅ Salidas (individual y bulk/remito)
- ✅ Informes de Stock, Entradas y Salidas
- ✅ Exportación a Excel y PDF
- ✅ Envío de informes por email (SendGrid)
- ✅ Sistema de roles y funciones

---

## 📝 Pendiente / Próximas fases

- Módulo de Solicitudes (multiusuario)
- Módulo de Reservas
- Módulo de Mantenimiento
- Módulo Comedor
- Almacenamiento de archivos en Supabase Storage
- Diseño responsive y PWA
