# ⚠️ MIGRACIÓN MANUAL NECESARIA: Agregar Campos a Productos

## 🔴 IMPORTANTE: DEBE EJECUTARSE MANUALMENTE EN SUPABASE

No fue posible ejecutar la migración automáticamente desde la terminal. **Debes hacerlo manualmente** a través del dashboard de Supabase.

---

## 📋 Pasos a Seguir

### 1. Acceder a Supabase
- Ve a: https://supabase.com/dashboard
- Selecciona tu proyecto: **gestion-panol-eset**

### 2. Ir al SQL Editor
- Click en la pestaña izquierda: **SQL Editor**
- O ve directamente a: https://supabase.com/dashboard/project/[tu-project-id]/sql/new

### 3. Ejecutar la Migración
Copia y pega el siguiente SQL en el editor:

```sql
-- Migración: Agregar campos específicos a tabla productos
-- Fecha: 10 de diciembre de 2025

ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS perecedero VARCHAR(20),
ADD COLUMN IF NOT EXISTS clasificacion VARCHAR(20),
ADD COLUMN IF NOT EXISTS tipo_limpieza VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_libreria VARCHAR(50),
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- Comentarios explicativos
COMMENT ON COLUMN productos.perecedero IS 'Para Alimentos: perecedero o no-perecedero';
COMMENT ON COLUMN productos.clasificacion IS 'Para Ferretería/Bazar/Limpieza/Librería/Equipamiento: uso o consumo';
COMMENT ON COLUMN productos.tipo_limpieza IS 'Para Limpieza: productos, elementos, descartables, papelería';
COMMENT ON COLUMN productos.tipo_libreria IS 'Para Librería: elementos o insumos';
COMMENT ON COLUMN productos.fecha_vencimiento IS 'Fecha de vencimiento del producto (para perecederos)';
```

### 4. Ejecutar
- Click en botón **"RUN"** (o presiona Ctrl+Enter)
- Deberías ver: "Success. No rows returned."

### 5. Verificar
Ejecuta este SQL para confirmar que los campos se crearon:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
```

Deberías ver columnas nuevas: `perecedero`, `clasificacion`, `tipo_limpieza`, `tipo_libreria`, `fecha_vencimiento`

---

## ✅ Después de Ejecutar la Migración

1. **Sincronizar DB local**:
   ```bash
   cd backend
   node scripts/db_sync_from_supabase.js
   ```

2. **Verificar en local**:
   ```bash
   psql -U martin -d panol -c "\d productos"
   ```

3. **Comitear y subir a GitHub**:
   ```bash
   git add -A
   git commit -m "✅ Migración 008 ejecutada: campos productos agregados"
   git push origin main
   ```

4. **Probar en la aplicación**:
   - Ir a http://localhost:3000/recursos/productos
   - Crear un nuevo producto
   - Deberías ver los nuevos campos (Tipo, Fecha Vencimiento, etc.)

---

## 📞 Si Hay Problemas

### Error: "column already exists"
- Los campos ya existen, no hay problema
- Los comandos usan `IF NOT EXISTS` para evitar errores

### Error: "Permission denied"
- Necesitas permisos de admin en Supabase
- Contacta al administrador del proyecto

### La migración tarda mucho
- Si la tabla tiene muchos datos, puede tardar
- Espera a que termine (no cierres la pestaña)

---

**Estado**: ⏳ PENDIENTE EJECUCIÓN MANUAL  
**Archivo de migración**: `/backend/db/migrations/008_add_producto_fields.sql`  
**Documentación completa**: `/backend/db/migrations/MIGRACION_008_README.md`
