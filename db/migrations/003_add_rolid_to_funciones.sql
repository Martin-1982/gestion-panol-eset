-- Agrega la columna rol_id a la tabla funciones para relacionar funciones con roles
ALTER TABLE funciones
  ADD COLUMN IF NOT EXISTS rol_id integer;

-- (Opcional) crear FK si roles.id existe y se desea integridad referencial
-- ALTER TABLE funciones
--   ADD CONSTRAINT funciones_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES roles(id);
