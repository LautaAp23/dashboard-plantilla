-- Add new ABM fields (nullable / with defaults first so existing rows survive the ALTERs).
ALTER TABLE "User" ADD COLUMN "email_user" TEXT;
ALTER TABLE "User" ADD COLUMN "password_user" TEXT;
ALTER TABLE "User" ADD COLUMN "role_user" "Role" NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "User" ADD COLUMN "nombreyapellido_user" TEXT DEFAULT '';
ALTER TABLE "User" ADD COLUMN "dni_user" TEXT DEFAULT '';
ALTER TABLE "User" ADD COLUMN "direccion_user" TEXT;
ALTER TABLE "User" ADD COLUMN "telefono_user" TEXT;
ALTER TABLE "User" ADD COLUMN "fechayhora_user" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "ultima_conexion_user" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "fechayhora_modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "usuario_creador" TEXT DEFAULT '';
ALTER TABLE "User" ADD COLUMN "usuario_modificador" TEXT;
ALTER TABLE "User" ADD COLUMN "estado_user" BOOLEAN NOT NULL DEFAULT true;

-- Backfill renamed columns from the legacy ones.
UPDATE "User" SET
  "email_user" = "email",
  "password_user" = "password",
  "role_user" = "role";

-- Enforce NOT NULL on the now-populated columns.
ALTER TABLE "User" ALTER COLUMN "email_user" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password_user" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "nombreyapellido_user" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "nombreyapellido_user" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "dni_user" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "dni_user" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "usuario_creador" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "usuario_creador" SET NOT NULL;
-- @updatedAt columns are always set by Prisma Client; remove the temporary default.
ALTER TABLE "User" ALTER COLUMN "fechayhora_modificacion" DROP DEFAULT;

-- Unique indexes for the new fields.
CREATE UNIQUE INDEX "User_email_user_key" ON "User"("email_user");
CREATE UNIQUE INDEX "User_dni_user_key" ON "User"("dni_user");

-- Drop legacy columns and their indexes.
DROP INDEX "User_email_key";
ALTER TABLE "User" DROP COLUMN "email";
ALTER TABLE "User" DROP COLUMN "password";
ALTER TABLE "User" DROP COLUMN "role";