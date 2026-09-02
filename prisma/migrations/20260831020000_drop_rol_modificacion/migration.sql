-- DropTable-like: quita la trazabilidad de modificación del Rol.
-- La trazabilidad de creación (usuario_creador, fechayhora_rol) se mantiene.
ALTER TABLE "Rol" DROP COLUMN IF EXISTS "usuario_modificador";
ALTER TABLE "Rol" DROP COLUMN IF EXISTS "fechayhora_modificacion";