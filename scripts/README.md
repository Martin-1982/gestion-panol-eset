# 🧹 Scripts de Limpieza y Mantenimiento

Este directorio contiene scripts para mantener limpio y ordenado el proyecto en todas las plataformas.

## 📜 Scripts Disponibles

### `cleanup-vercel.sh`
Ayuda a limpiar deployments antiguos en Vercel.

**Uso:**
```bash
./scripts/cleanup-vercel.sh
```

**Requisitos:**
- Vercel CLI instalado: `npm install -g vercel`
- Estar logueado: `vercel login`

**Qué hace:**
- Verifica que Vercel CLI esté instalado
- Lista todos los deployments del proyecto
- Muestra instrucciones para eliminar deployments antiguos

### `cleanup-railway.sh`
Ayuda a verificar configuración y limpieza en Railway.

**Uso:**
```bash
./scripts/cleanup-railway.sh
```

**Requisitos:**
- Railway CLI instalado: `npm install -g @railway/cli`
- Estar logueado: `railway login`

**Qué hace:**
- Verifica que Railway CLI esté instalado
- Muestra instrucciones para verificar configuración
- Recuerda las variables de entorno necesarias

## 🚀 Instalación de CLIs

### Vercel CLI
```bash
npm install -g vercel
# o
yarn global add vercel
```

### Railway CLI
```bash
npm install -g @railway/cli
# o
curl -fsSL https://railway.app/install.sh | sh
```

## 📋 Checklist de Limpieza Regular

### GitHub
- ✅ Eliminar ramas merged innecesarias
- ✅ Limpiar archivos de documentación redundantes
- ✅ Mantener .gitignore actualizado
- ✅ Eliminar scripts deprecated

### Vercel
- ⚠️ Mantener solo deployment de producción + últimos 2-3
- ⚠️ Eliminar deployments de más de 30 días
- ✅ Verificar que el proyecto apunte a branch 'main'

### Railway
- ✅ Verificar variables de entorno
- ✅ Confirmar que apunte a branch 'main' (no 'master')
- ⚠️ Railway limpia automáticamente deployments antiguos

### Base de Datos (Supabase)
- ⚠️ Revisar logs de queries lentas
- ⚠️ Verificar espacio de almacenamiento usado
- ✅ Mantener backups actualizados (sync scripts)

## 🔄 Frecuencia Recomendada

- **Semanal**: Revisar deployments en Vercel
- **Mensual**: Limpieza general de archivos temporales
- **Trimestral**: Auditoría completa de todos los servicios

## 💡 Tips

1. **Antes de limpiar deployments**: Verifica que el deployment de producción funcione correctamente
2. **Mantén backups**: Siempre conserva los últimos 2-3 deployments por seguridad
3. **Documenta cambios**: Usa commits descriptivos para facilitar rollbacks
4. **Sincroniza DB**: Antes de hacer cambios importantes, ejecuta `db_sync_to_supabase.js`
