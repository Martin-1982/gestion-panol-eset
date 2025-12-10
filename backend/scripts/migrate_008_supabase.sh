#!/bin/bash

# Script para ejecutar migración 008 en Supabase usando psql
# Uso: ./scripts/migrate_008_supabase.sh

set -e

echo "🔄 Conectando a Supabase y ejecutando migración 008..."
echo ""

# Credenciales de Supabase
PGHOST="aws-0-us-east-1.pooler.supabase.com"
PGPORT="5432"
PGUSER="postgres.dwckzovoowgtbpkdwsku"
PGPASSWORD="panol.eset+2019"
PGDATABASE="postgres"

# Exportar variables para psql
export PGPASSWORD

# Ejecutar la migración
psql -h "$PGHOST" \
     -p "$PGPORT" \
     -U "$PGUSER" \
     -d "$PGDATABASE" \
     -f db/migrations/008_add_producto_fields.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migración 008 ejecutada exitosamente!"
    echo "🎉 Los campos nuevos han sido agregados a la tabla productos"
else
    echo ""
    echo "❌ Error al ejecutar la migración"
    exit 1
fi
