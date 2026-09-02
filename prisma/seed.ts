import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
})

const ID_ROL_ADMIN = "cladminrol0000000000001"
const ID_ADMIN_USER = "cladminuser0000000000001"

async function main() {
  // Rol Administrador: se re-crea en un solo upsert (único es_admin=true).
  const rol = await prisma.rol.upsert({
    where: { id_rol: ID_ROL_ADMIN },
    update: {
      nombre_rol: "Administrador",
      es_admin: true,
      estado_rol: true,
    },
    create: {
      id_rol: ID_ROL_ADMIN,
      nombre_rol: "Administrador",
      es_admin: true,
      estado_rol: true,
      usuario_creador: "seed",
    },
  })

  const email = "admin@hsse.com"
  const password = await bcrypt.hash("admin123", 10)

  // Trazabilidad: las columnas usuario_creador/usuario_modificador guardan el ID
  // del autor (regla "sin NULLs"): el propio admin se referencia a sí mismo.
  // Los campos opcionales se persisten como "" (nunca null).
  const admin = await prisma.user.upsert({
    where: { email_user: email },
    update: {
      password_user: password,
      id_rol: rol.id_rol,
      nombreyapellido_user: "Administrador Hsse",
      dni_user: "00000000",
    },
    create: {
      id: ID_ADMIN_USER,
      email_user: email,
      password_user: password,
      id_rol: rol.id_rol,
      nombreyapellido_user: "Administrador Hsse",
      dni_user: "00000000",
      telefono_user: "",
      direccion_user: "",
      usuario_creador: ID_ADMIN_USER,
      usuario_modificador: ID_ADMIN_USER,
    },
    select: { id: true },
  })

  // Tanto en DB nueva como en una existente (donde el admin ya tenía otro id),
  // la trazabilidad debe apuntar al id REAL del registro.
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      usuario_creador: admin.id,
      usuario_modificador: admin.id,
    },
  })

  console.log(`Rol de prueba creado: ${rol.nombre_rol}`)
  console.log(`Usuario de prueba creado: ${email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })