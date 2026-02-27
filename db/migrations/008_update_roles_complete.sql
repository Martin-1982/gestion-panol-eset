-- Actualizar tabla roles con todos los roles del sistema
-- Esta migración agrega los roles faltantes y actualiza los existentes

-- Agregar roles faltantes si no existen
INSERT INTO roles (nombre, descripcion) 
SELECT 'Directivo', 'Acceso a solicitudes de aprobación e informes'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Directivo');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Docente', 'Acceso a solicitudes de recursos y reservas'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Docente');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Bibliotecario', 'Acceso a solicitudes de material didáctico'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Bibliotecario');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Equipo de Orientación', 'Acceso a consultas y solicitudes'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Equipo de Orientación');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Ordenanza', 'Acceso al módulo específico de ordenanzas'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Ordenanza');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Mantenimiento', 'Acceso a tickets y herramientas de mantenimiento'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Mantenimiento');

INSERT INTO roles (nombre, descripcion) 
SELECT 'Cocinero', 'Acceso al módulo comedor exclusivo'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'Cocinero');

-- Actualizar descripción del rol Usuario si existe
UPDATE roles 
SET descripcion = 'Acceso limitado al sistema'
WHERE nombre = 'Usuario' AND (descripcion IS NULL OR descripcion = '');

-- Asegurar que la tabla usuarios tiene rol_id válido
-- Si algún usuario tiene rol_id que no existe en roles, asignarlo al rol Usuario
UPDATE usuarios 
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Usuario' LIMIT 1)
WHERE rol_id NOT IN (SELECT id FROM roles) OR (rol_id IS NULL);
