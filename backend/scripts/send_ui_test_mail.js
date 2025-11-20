require('dotenv').config();
const jwt = require('jsonwebtoken');

async function main() {
  const fetch = global.fetch;
  if (!fetch) {
    console.error('fetch no disponible en este entorno de node. Se requiere Node >=18 o instalar node-fetch.');
    process.exit(1);
  }

  const token = jwt.sign({ id: 1, email: 'script@test.local' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  const to = process.argv[2] || 'martin.altamiranda@uner.edu.ar';

  const text = 'Este es un correo de prueba enviado desde el script de integración UI -> backend.\nHora: ' + new Date().toISOString();

  // create a small text "PDF" file in memory
  const buffer = Buffer.from(text);
  const fileName = 'informe_stock.pdf';

  const form = new FormData();
  form.append('to', to);
  form.append('subject', 'Prueba UI - Informe de Stock');
  form.append('text', text);
  form.append('html', `<pre>${text}</pre>`);
  // in Node >=18, Blob/File are available
  const fileBlob = new Blob([buffer], { type: 'application/pdf' });
  form.append('file', fileBlob, fileName);

  const res = await fetch(`http://localhost:${process.env.PORT || 4000}/api/informes/enviar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Note: don't set Content-Type, fetch will set the multipart boundary
    },
    body: form
  });

  console.log('Status:', res.status);
  const bodyRes = await res.text();
  try {
    console.log('Response JSON:', JSON.parse(bodyRes));
  } catch (e) {
    console.log('Response text:', bodyRes);
  }
}

main().catch(err => { console.error('Error en script:', err); process.exit(1); });
