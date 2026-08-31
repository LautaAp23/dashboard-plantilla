-- CreateTable Rol (roles del ABM).
CREATE TABLE "Rol" (
    "id_rol" TEXT NOT NULL,
    "nombre_rol" TEXT NOT NULL,
    "es_admin" BOOLEAN NOT NULL DEFAULT false,
    "fechayhora_rol" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_rol" BOOLEAN NOT NULL DEFAULT true,
    "usuario_creador" TEXT NOT NULL,
    "usuario_modificador" TEXT,
    "fechayhora_modificacion" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_rol_key" ON "Rol"("nombre_rol");

-- Data migration: inserta el rol Administrador (el más importante). Se referencia
-- con id fijo para poder rellenar abajo los usuarios existentes.
INSERT INTO "Rol" (
    "id_rol", "nombre_rol", "es_admin", "fechayhora_rol", "estado_rol",
    "usuario_creador", "usuario_modificador", "fechayhora_modificacion"
)
VALUES (
    'cladminrol0000000000001', 'Administrador', true, now(), true,
    'seed', NULL, now()
);

-- AlterTable: agrega la FK con los valores existentes primero (nullable)
-- para no romper las filas actuales.
ALTER TABLE "User" ADD COLUMN "id_rol" TEXT;

-- Backfill: los usuarios existentes pasan al rol Administrador.
UPDATE "User" SET "id_rol" = 'cladminrol0000000000001' WHERE "id_rol" IS NULL;

-- Ahora sí: NOT NULL + FK.
ALTER TABLE "User" ALTER COLUMN "id_rol" SET NOT NULL;

-- El rol ya no se guarda como enum: vuelve a la tabla Rol.
ALTER TABLE "User" DROP COLUMN "role_user";

-- DropEnum
DROP TYPE "Role";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;