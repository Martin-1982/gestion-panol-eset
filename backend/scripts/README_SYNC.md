# Scripts de Sincronización de Base de Datos

Este directorio contiene scripts para sincronizar la base de datos completa entre tu entorno local y Supabase (producción).

## 📋 Scripts Disponibles

### 1. **db_sync_to_supabase.js** ⬆️
**Sincroniza TODA la base de datos de LOCAL a SUPABASE**

```bash
node scripts/db_sync_to_supabase.js
```

**Uso:**
- Después de desarrollar/modificar datos localmente
- Antes de hacer push a producción
- Sincroniza todas las tablas, índices, relaciones y datos

**Flujo:**
1. Extrae dump completo de tu BD local
2. Restaura en Supabase
3. Limpia archivos temporales

---

### 2. **db_sync_from_supabase.js** ⬇️
**Sincroniza TODA la base de datos de SUPABASE a LOCAL**

```bash
node scripts/db_sync_from_supabase.js
```

**Uso:**
- Antes de comenzar a desarrollar
- Para traer datos de prueba de producción
- Para sincronizar cambios que se hicieron en producción

**Flujo:**
1. Extrae dump completo de Supabase
2. Restaura en tu BD local
3. Limpia archivos temporales

---

## 🚀 Flujo de Trabajo Recomendado

```
1. Comienza a desarrollar
   → Trabajás en local con tu BD local

2. Pruebas completadas
   → Sincronizas local → Supabase
   → node scripts/db_sync_to_supabase.js

3. Haces commit y push
   → git add .
   → git commit -m "tu mensaje"
   → git push origin main

4. Próxima sesión de desarrollo
   → Sincronizas Supabase → local
   → node scripts/db_sync_from_supabase.js

5. Continuás desarrollando...
```

---

## ⚠️ Consideraciones Importantes

1. **Pérdida de datos:** Los scripts usan `--clean --if-exists` que **limpia la base destino antes de restaurar**. Asegúrate de tener respaldos si es necesario.

2. **Tiempo de ejecución:** Pueden tardar varios minutos dependiendo del tamaño de la BD.

3. **Credenciales:** Los scripts tienen credenciales embebidas en el código. **Cambialas si compartís el código públicamente**.

4. **Archivos temporales:** Se crean archivos `.dump` temporales que se eliminan automáticamente al finalizar.

---

## 🔧 Requisitos

- **PostgreSQL client tools** instalado (`pg_dump` y `pg_restore`)
  - En Linux: `sudo apt-get install postgresql-client`
  - En macOS: `brew install postgresql`
  - En Windows: Descargar desde https://www.postgresql.org/download/windows/

- **Node.js** (para ejecutar los scripts)

---

## 📊 Scripts Deprecados

Los antiguos scripts `sync_to_supabase.js` y `sync_from_supabase.js` solo sincronizaban la tabla `usuarios`. 

**Ya no uses estos scripts**, utiliza los nuevos scripts `db_sync_*` que sincronizan la base de datos completa.

---

## 🆘 Troubleshooting

**Error: "pg_dump: command not found"**
- Solución: Instala PostgreSQL client tools (ver Requisitos arriba)

**Error: "password authentication failed"**
- Verifica que las credenciales en el script sean correctas
- Asegúrate que los puertos están accesibles (5432 local, Railway para Supabase)

**Error: "connection refused"**
- BD local no está corriendo: `sudo service postgresql start`
- Supabase no accesible: verifica conexión a internet

---

## 📝 Ejemplo de Uso

```bash
# 1. Traer datos de Supabase antes de trabajar
node backend/scripts/db_sync_from_supabase.js

# 2. Desarrollar y probar localmente...

# 3. Sincronizar cambios a Supabase
node backend/scripts/db_sync_to_supabase.js

# 4. Subir cambios a GitHub
git add .
git commit -m "feat: nuevo módulo de solicitudes"
git push origin main
```

---

**Última actualización:** 5 de diciembre de 2025
