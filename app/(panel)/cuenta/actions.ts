"use server"

import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"

import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export type ChangePasswordResult = {
  error?: string
  success?: boolean
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "No autorizado" }
  }

  if (newPassword.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres" }
  }

  let user
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
  } catch {
    return { error: "El servicio no está disponible" }
  }

  if (!user) {
    return { error: "No autorizado" }
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_user)

  if (!isValid) {
    return { error: "La contraseña actual es incorrecta" }
  }

  if (await bcrypt.compare(newPassword, user.password_user)) {
    return { error: "La nueva contraseña debe ser distinta a la actual" }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_user: await bcrypt.hash(newPassword, 10),
        primer_login: false,
        usuario_modificador: session.user.id,
      },
    })
  } catch {
    return { error: "No se pudo actualizar la contraseña" }
  }

  return { success: true }
}
