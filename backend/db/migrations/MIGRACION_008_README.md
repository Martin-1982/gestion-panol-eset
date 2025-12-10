# 🗄️ Migración de Base de Datos: Productos Reorganizados

## Resumen
Se agregaron nuevos campos a la tabla `productos` para soportar la nueva estructura jerárquica de categorías y tipos específicos.

## Campos Agregados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `perecedero` | VARCHAR(20) | Para Alimentos: "perecedero" o "no-perecedero" |
| `clasificacion` | VARCHAR(20) | Para Ferretería/Bazar/Limpieza/Librería/Equipamiento: "uso" o "consumo" |
| `tipo_limpieza` | VARCHAR(50) | Para Limpieza: "productos", "elementos", "descartables", "papelería" |
| `tipo_libreria` | VARCHAR(50) | Para Librería: "elementos" o "insumos" |
| `fecha_vencimiento` | DATE | Fecha de vencimiento del producto |

## Cómo Ejecutar la Migración

### Opción 1: Desde el Backend (Recomendado)
```bash
# Asegúrate de estar en la carpeta backend
cd backend

# Ejecuta la migración
node scripts/run_migration_008.js
```

**Requiere**: Variables de entorno configuradas (PGHOST, PGUSER, PGPASSWORD, etc.)

### Opción 2: Directamente en Supabase
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Copia y pega el contenido de `db/migrations/008_add_producto_fields.sql`
5. Ejecuta la query

### Opción 3: Usando psql desde Terminal
```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -U postgres.dwckzovoowgtbpkdwsku \
     -d postgres \
     -f backend/db/migrations/008_add_producto_fields.sql
```

## Verificación

Después de ejecutar la migración, verifica que los campos se crearon correctamente:

```sql
-- Ver la estructura de la tabla productos
\d productos

-- O ejecutar esta query:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
```

## Rollback (Si Algo Sale Mal)

```sql
-- Para revertir la migración:
ALTER TABLE productos 
DROP COLUMN IF EXISTS perecedero,
DROP COLUMN IF EXISTS clasificacion,
DROP COLUMN IF EXISTS tipo_limpieza,
DROP COLUMN IF EXISTS tipo_libreria,
DROP COLUMN IF EXISTS fecha_vencimiento;
```

## Próximos Pasos

1. ✅ Ejecutar esta migración en Supabase
2. ✅ Sincronizar DB local: `node scripts/db_sync_from_supabase.js`
3. ✅ Probar el formulario de Productos en desarrollo
4. ✅ Hacer commit en GitHub
5. ✅ Deploy automático en Railway/Vercel

---

**Fecha de creación**: 10 de diciembre de 2025  
**Relacionado con**: Reorganización del formulario de Productos
