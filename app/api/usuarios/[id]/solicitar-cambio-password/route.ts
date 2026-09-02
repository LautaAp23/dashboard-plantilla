import type { NextRequest } from "next/server"

import { requireSessionAdmin } from "@/lib/api-auth"
import { badRequest, ok, notFound, unauthorized, manejarError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { generarPassword } from "@/lib/utils"
import { enviarEmail } from "@/lib/mail"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: usuarioId } = await params
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  try {
    if (!usuarioId) {
      return badRequest("ID de usuario requerido")
    }

    // Obtener datos del usuario para enviar email
    const usuario = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: { email_user: true, nombreyapellido_user: true },
    })

    if (!usuario) {
      return notFound("El usuario no existe")
    }

    // Generar nueva contraseña temporal
    const nuevaPassword = generarPassword(12)

    // Hashear la contraseña
    const bcrypt = await import("bcryptjs")
    const passwordHash = await bcrypt.hash(nuevaPassword, 10)

    // Actualizar contraseña en la base de datos
    await prisma.user.update({
      where: { id: usuarioId },
      data: {
        password_user: passwordHash,
        primer_login: true,
        usuario_modificador: sesion.id,
      },
    })

    // Enviar nueva contraseña por email
    await enviarEmail({
      to: usuario.email_user,
      subject: "Cambio de contraseña - Sistema hsse",
      html: `
        <h3>Hola ${usuario.nombreyapellido_user}</h3>
        <p>Se ha solicitado un cambio de contraseña para tu cuenta.</p>
        <p>Tu nueva contraseña temporal es: <strong>${nuevaPassword}</strong></p>
        <p>Al iniciar sesión, el sistema te pedirá que la cambies por una nueva.</p>
      `,
      text: `Hola ${usuario.nombreyapellido_user}. Se ha solicitado un cambio de contraseña para tu cuenta. Tu nueva contraseña temporal es: ${nuevaPassword}. Al iniciar sesión, el sistema te pedirá que la cambies por una nueva.`,
    })

    return ok({ mensaje: "Solicitud de cambio de contraseña realizada" })
  } catch (error) {
    return manejarError(error)
  }
}