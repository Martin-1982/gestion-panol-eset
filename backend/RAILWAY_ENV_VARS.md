# Variables de Entorno para Railway

Para que el backend funcione correctamente en Railway, asegúrate de tener configuradas estas variables de entorno en el panel de Railway:

## Base de Datos (Supabase)
```
PGUSER=postgres.dwckzovoowgtbpkdwsku
PGPASSWORD=panol.eset+2019
PGHOST=aws-1-sa-east-1.pooler.supabase.com
PGPORT=5432
PGDATABASE=postgres
```

## Backend
```
PORT=8080
JWT_SECRET=secretKey123
BACKEND_URL=https://gestion-panol-eset-production.up.railway.app
```

## SendGrid (Email)
```
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=panol.eset.fcal@uner.edu.ar
SENDGRID_FROM_NAME=Pañol - ESET - FCAL
```

## Frontend
```
FRONTEND_URL=https://gestion-panol-eset.vercel.app
```

---

## ⚠️ IMPORTANTE

La variable **`BACKEND_URL`** es crítica para que los links de:
- Verificación de email
- Recuperación de contraseña

...apunten a la URL de Railway en producción, en lugar de `localhost`.

**Cómo configurar en Railway:**
1. Ir al proyecto en Railway
2. Settings → Variables
3. Agregar/actualizar las variables listadas arriba
4. Railway hará redeploy automáticamente
