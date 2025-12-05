#!/bin/bash

# 🧹 Script de limpieza de Vercel
# Este script te ayuda a limpiar deployments antiguos en Vercel

echo "🚀 Limpieza de Vercel - gestion-panol-eset"
echo "=========================================="
echo ""

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado."
    echo ""
    echo "📦 Instalar con: npm install -g vercel"
    echo "   o con: yarn global add vercel"
    exit 1
fi

echo "✅ Vercel CLI detectado"
echo ""

# Login a Vercel (si es necesario)
echo "🔐 Verificando sesión de Vercel..."
vercel whoami

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ No estás logueado en Vercel."
    echo "   Ejecuta: vercel login"
    exit 1
fi

echo ""
echo "📋 Obteniendo lista de deployments..."
echo ""

# Listar deployments
vercel ls gestion-panol-eset

echo ""
echo "════════════════════════════════════════"
echo "📝 INSTRUCCIONES:"
echo "════════════════════════════════════════"
echo ""
echo "Para eliminar deployments antiguos, usa:"
echo ""
echo "  vercel rm <deployment-url> --yes"
echo ""
echo "Por ejemplo:"
echo "  vercel rm gestion-panol-eset-abc123.vercel.app --yes"
echo ""
echo "💡 TIP: Mantén solo el deployment de producción (marked as 'Production')"
echo "        y opcionalmente los últimos 2-3 por seguridad."
echo ""
echo "🔄 Para eliminar múltiples deployments a la vez:"
echo "   1. Ve a https://vercel.com/dashboard"
echo "   2. Selecciona tu proyecto 'gestion-panol-eset'"
echo "   3. Ve a la pestaña 'Deployments'"
echo "   4. Selecciona múltiples deployments con checkboxes"
echo "   5. Haz clic en 'Delete'"
echo ""
