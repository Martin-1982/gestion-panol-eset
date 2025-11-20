Resumen rápido - SendGrid + verificación

1) Instalar dependencias (si no lo hiciste):

   npm install

2) Variables de entorno (usa `.env` local, NO subirlo al repo). Copiá `.env.example` y completá los valores.

3) Asegurate de tener la migración ejecutada que añade columnas de verificación:

   - Si usás un administrador de migraciones ejecutá `backend/db/migrations/002_add_verification_fields.sql`.
   - O ejecutá la consulta SQL en tu cliente PostgreSQL.

4) Ejecutar el servidor:

   npm run dev

5) Probar el registro:

   - En el frontend, usá la pantalla de registro con un correo `@uner.edu.ar` real.
   - Si `SENDGRID_API_KEY` está configurada, SendGrid enviará el mail. Si no, se imprimirá en la consola la URL de verificación.

6) Recomendaciones de producción:

   - Configurá DKIM/SPF para tu dominio en SendGrid.
   - Rotá la API key y restringila si es posible.
   - Usá HTTPS y protegé `JWT_SECRET` y `SENDGRID_API_KEY`.

