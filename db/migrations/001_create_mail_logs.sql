-- Tabla para registrar envíos de correo
CREATE TABLE IF NOT EXISTS mail_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NULL,
  destinatario TEXT NOT NULL,
  asunto TEXT,
  body TEXT,
  status TEXT,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
