require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function run() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY no configurada');
      process.exit(1);
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: process.env.TEST_MAIL_TO || 'martin.altamiranda@uner.edu.ar',
      from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.com',
      subject: 'Prueba directa desde servidor',
      text: 'Mensaje de prueba enviado desde script de servidor',
      html: '<p>Mensaje de prueba enviado desde script de servidor</p>',
    };

    const res = await sgMail.send(msg);
    console.log('SendGrid response status:', res && res[0] && res[0].statusCode);
    console.log('SendGrid response headers:', res && res[0] && res[0].headers);
  } catch (err) {
    if (err && err.response && err.response.body) {
      console.error('SendGrid error body:', JSON.stringify(err.response.body, null, 2));
    } else {
      console.error('SendGrid error:', err && (err.message || err));
    }
    process.exit(1);
  }
}

run();
