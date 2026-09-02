-- Regla "sin NULLs" + trazabilidad por id.
-- 1) Los campos opcionales de entrada (direccion/telefono) pasan a NOT NULL con
--    default "" para no persistir null (backfill previo).
-- 2) usuario_modificador pasa a NOT NULL (backfill previo).
-- 3) La trazabilidad pasa de almacenar email a almacenar el id del autor:
--    - si el valor ya es un id válido, se conserva;
--    - si era un email de un usuario existente, se convierte a su id;
--    - si no resuelve (p. ej. seed/legacy), usuario_creador se asigna a su propio
--      id y usuario_modificador toma el id del creador: la primera modificación
--      efectiva de un registro la hace quien lo creó.

-- Backfill de campos opcionales.
UPDATE "User" u SET
  "direccion_user" = COALESCE(u."direccion_user", ''),
  "telefono_user"  = COALESCE(u."telefono_user", '');

-- 1) Convertir email -> id para usuario_creador (idempotente).
UPDATE "User" u
SET "usuario_creador" = COALESCE(
  (SELECT a."id" FROM "User" a WHERE a."id" = u."usuario_creador"  LIMIT 1),
  (SELECT a."id" FROM "User" a WHERE a."email_user" = u."usuario_creador" LIMIT 1),
  u."id"
);

-- 2) Convertir email -> id para usuario_modificador; si no resuelve (registros
--    nunca modificados) queda apuntando al creador (que en el paso anterior ya
--    quedó como id válido). Nunca NULL y nunca el propio id ajeno al creador.
UPDATE "User" u
SET "usuario_modificador" = COALESCE(
  (SELECT a."id" FROM "User" a WHERE a."id" = u."usuario_modificador"  LIMIT 1),
  (SELECT a."id" FROM "User" a WHERE a."email_user" = u."usuario_modificador" LIMIT 1),
  u."usuario_creador"
);

-- Enforzar NO NULL + default "" para los campos opcionales de entrada.
ALTER TABLE "User" ALTER COLUMN "direccion_user" SET DEFAULT '';
ALTER TABLE "User" ALTER COLUMN "direccion_user" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "telefono_user" SET DEFAULT '';
ALTER TABLE "User" ALTER COLUMN "telefono_user" SET NOT NULL;

-- Enforzar NO NULL para la trazabilidad de modificación (el app siempre lo
-- escribe; no lleva default para no desviarse del schema: String sin @default).
ALTER TABLE "User" ALTER COLUMN "usuario_modificador" SET NOT NULL;