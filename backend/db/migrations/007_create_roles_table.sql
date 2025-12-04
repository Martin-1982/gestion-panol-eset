-- Crear tabla roles si no existe
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles por defecto si la tabla está vacía
INSERT INTO roles (nombre, descripcion) 
SELECT 'Administrador', 'Acceso completo al sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Administrador');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Usuario', 'Acceso limitado al sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Usuario');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Invitado', 'Solo lectura'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Invitado');

-- Asegurar que usuarios existentes tengan un rol_id válido
-- Si tienes usuarios sin rol, asignarles el rol de Usuario (id=2) por defecto
UPDATE usuarios 
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Usuario' LIMIT 1)
WHERE rol_id IS NULL OR rol_id NOT IN (SELECT id FROM roles);
