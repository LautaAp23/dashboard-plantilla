import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
})

const ID_ROL_ADMIN = "cladminrol0000000000001"

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

  await prisma.user.upsert({
    where: { email_user: email },
    update: {
      password_user: password,
      id_rol: rol.id_rol,
      nombreyapellido_user: "Administrador Hsse",
      dni_user: "00000000",
      usuario_modificador: email,
    },
    create: {
      email_user: email,
      password_user: password,
      id_rol: rol.id_rol,
      nombreyapellido_user: "Administrador Hsse",
      dni_user: "00000000",
      telefono_user: null,
      direccion_user: null,
      usuario_creador: email,
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