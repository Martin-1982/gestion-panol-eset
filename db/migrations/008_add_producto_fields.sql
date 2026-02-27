-- Migración: Agregar campos específicos a tabla productos
-- Fecha: 10 de diciembre de 2025
-- Descripción: Restructurar productos con campos jerárquicos y tipos específicos

-- Agregar nuevas columnas a la tabla productos
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

-- Nota: Los campos antiguos (tipo) se mantienen por compatibilidad con datos existentes
