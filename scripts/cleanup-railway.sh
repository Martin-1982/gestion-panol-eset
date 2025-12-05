#!/bin/bash

# 🧹 Script de limpieza de Railway
# Este script te ayuda a limpiar deployments antiguos en Railway

echo "🚂 Limpieza de Railway - gestion-panol-eset"
echo "=========================================="
echo ""

# Verificar que Railway CLI esté instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado."
    echo ""
    echo "📦 Instalar con: npm install -g @railway/cli"
    echo "   o con: curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

echo "✅ Railway CLI detectado"
echo ""

# Verificar login
echo "🔐 Verificando sesión de Railway..."
railway whoami

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ No estás logueado en Railway."
    echo "   Ejecuta: railway login"
    exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "📝 INSTRUCCIONES PARA LIMPIAR RAILWAY:"
echo "════════════════════════════════════════"
echo ""
echo "Railway mantiene automáticamente solo los últimos deployments."
echo ""
echo "Para verificar y limpiar manualmente:"
echo ""
echo "1️⃣  Ve a: https://railway.app/dashboard"
echo ""
echo "2️⃣  Selecciona tu proyecto: gestion-panol-eset-production"
echo ""
echo "3️⃣  En la pestaña 'Deployments':"
echo "    - Railway muestra solo los deployments recientes"
echo "    - Los deployments antiguos se eliminan automáticamente"
echo ""
echo "4️⃣  Configuración importante a verificar:"
echo "    - Settings → Source → Branch: debe ser 'main' (no 'master')"
echo "    - Settings → Variables: verificar que estén todas las env vars"
echo ""
echo "5️⃣  Variables de entorno requeridas:"
echo "    ✓ BACKEND_URL"
echo "    ✓ FRONTEND_URL"
echo "    ✓ PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE"
echo "    ✓ JWT_SECRET"
echo "    ✓ SENDGRID_API_KEY"
echo ""
echo "════════════════════════════════════════"
echo ""
echo "💡 TIP: Railway no almacena muchos deployments antiguos,"
echo "        así que no suele necesitar limpieza manual."
echo ""
